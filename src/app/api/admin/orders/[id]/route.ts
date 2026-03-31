import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { Prisma, type OrderStatus } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await requireAdmin();
    if (!admin) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    const { id } = await params;
    const order = await db.order.findUnique({
      where: { id },
      include: { user: true, items: true, paymentMethod: true, botAccount: true, statusHistory: { orderBy: { createdAt: "desc" } } },
    });
    if (!order) return NextResponse.json({ success: false, error: "Order not found" }, { status: 404 });
    return NextResponse.json({ success: true, data: order });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message ?? "Server error" }, { status: 500 });
  }
}

const VALID_NEXT: Partial<Record<OrderStatus, OrderStatus[]>> = {
  CREATED: ["TRADE_SENT", "PAYMENT_PENDING", "PAID", "TRADE_CANCELLED"],
  TRADE_SENT: ["TRADE_COMPLETED", "TRADE_CANCELLED", "PAYMENT_PENDING", "PAID"],
  TRADE_COMPLETED: ["PAID", "TRADE_CANCELLED"],
  TRADE_CANCELLED: [],
  PAYMENT_PENDING: ["PAID", "TRADE_CANCELLED"],
  PAID: [],
};

function isValidStatusTransition(from: OrderStatus, to: OrderStatus): boolean {
  if (from === to) return true;
  const allowed = VALID_NEXT[from];
  return allowed?.includes(to) ?? false;
}

type PatchBody = {
  status?: OrderStatus;
  botAccountId?: string | null;
  botName?: string;
  botSteamProfileUrl?: string;
  tradeOfferUrl?: string;
  adminComment?: string | null;
};

function mergeAdminComment(existing: string | null, tradeOfferUrl?: string): string | null {
  if (!tradeOfferUrl) return existing;
  let parsed: Record<string, unknown> = {};
  try { parsed = JSON.parse(existing || "{}"); } catch { parsed = existing ? { text: existing } : {}; }
  parsed.tradeOfferUrl = tradeOfferUrl;
  return JSON.stringify(parsed);
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requireAdmin();
    const { id } = await context.params;

    let body: PatchBody;
    try {
      body = (await request.json()) as PatchBody;
    } catch {
      return NextResponse.json(
        { success: false, error: "Invalid JSON body" },
        { status: 400 },
      );
    }

    const existing = await db.order.findUnique({
      where: { id },
      include: { paymentMethod: true, user: true },
    });
    if (!existing) {
      return NextResponse.json({ success: false, error: "Order not found" }, { status: 404 });
    }

    if (body.status && body.status !== existing.status) {
      if (!isValidStatusTransition(existing.status, body.status)) {
        return NextResponse.json(
          { success: false, error: "Invalid status transition" },
          { status: 400 },
        );
      }
    }

    const data: Prisma.OrderUpdateInput = {};

    if (body.botName && body.botSteamProfileUrl) {
      const steamIdMatch = body.botSteamProfileUrl.match(/\/(?:profiles|id)\/([^\/\s?]+)/);
      const botSteamId = steamIdMatch?.[1] ?? `bot_${Date.now()}`;
      let bot = await db.botAccount.findFirst({ where: { steamId: botSteamId } });
      if (!bot) {
        bot = await db.botAccount.create({
          data: {
            steamId: botSteamId,
            steamProfileUrl: body.botSteamProfileUrl.trim(),
            name: body.botName.trim(),
            isActive: true,
          },
        });
      }
      data.botAccount = { connect: { id: bot.id } };
    } else if (body.botAccountId !== undefined) {
      data.botAccount = body.botAccountId
        ? { connect: { id: body.botAccountId } }
        : { disconnect: true };
    }

    if (body.tradeOfferUrl) data.adminComment = mergeAdminComment(existing.adminComment, body.tradeOfferUrl);
    else if (body.adminComment !== undefined) data.adminComment = body.adminComment;
    if (body.status) {
      data.status = body.status;
      if (body.status === "TRADE_SENT") data.tradeSentAt = new Date();
      if (body.status === "TRADE_COMPLETED") data.tradeCompletedAt = new Date();
      if (body.status === "PAID") data.paidAt = new Date();
      if (body.status === "TRADE_CANCELLED") data.cancelledAt = new Date();
    }

    const updated = await db.$transaction(async (tx) => {
      const order = await tx.order.update({
        where: { id },
        data,
        include: {
          items: true,
          paymentMethod: true,
          botAccount: true,
          user: true,
        },
      });

      if (body.status && body.status !== existing.status) {
        await tx.orderStatusHistory.create({
          data: {
            orderId: id,
            oldStatus: existing.status,
            newStatus: body.status,
            changedBy: session.userId!,
            comment: body.adminComment ?? undefined,
          },
        });

        if (existing.paymentMethod.type === "balance") {
          const amt = Number(existing.totalAmount);
          const user = await tx.user.findUnique({ where: { id: existing.userId } });

          if (body.status === "PAID" && user) {
            const nextBal = Number(user.balance) + amt;
            await tx.user.update({
              where: { id: existing.userId },
              data: { balance: new Prisma.Decimal(nextBal.toFixed(2)) },
            });
            await tx.balanceTransaction.create({
              data: {
                userId: existing.userId,
                type: "CREDIT",
                amount: new Prisma.Decimal(amt.toFixed(2)),
                balanceAfter: new Prisma.Decimal(nextBal.toFixed(2)),
                comment: `Order ${existing.orderNumber} paid (balance)`,
                orderId: id,
              },
            });
            await tx.balanceTransaction.create({
              data: {
                userId: existing.userId,
                type: "UNFREEZE",
                amount: new Prisma.Decimal(amt.toFixed(2)),
                balanceAfter: new Prisma.Decimal(nextBal.toFixed(2)),
                comment: `Order ${existing.orderNumber} - payout unfrozen`,
                orderId: id,
              },
            });
          }

          if (body.status === "TRADE_CANCELLED" && user) {
            await tx.balanceTransaction.create({
              data: {
                userId: existing.userId,
                type: "UNFREEZE",
                amount: new Prisma.Decimal(amt.toFixed(2)),
                balanceAfter: new Prisma.Decimal(Number(user.balance).toFixed(2)),
                comment: `Order ${existing.orderNumber} cancelled - payout unfrozen`,
                orderId: id,
              },
            });
          }
        }
      }

      return order;
    });

    await logAudit({
      actorId: session.userId!,
      actorRole: "admin",
      entity: "order",
      entityId: id,
      action: body.status && body.status !== existing.status ? "status_change" : "update",
      oldValue: existing,
      newValue: updated,
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    if (message === "Unauthorized") {
      return NextResponse.json({ success: false, error: message }, { status: 401 });
    }
    if (message === "Forbidden") {
      return NextResponse.json({ success: false, error: message }, { status: 403 });
    }
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
