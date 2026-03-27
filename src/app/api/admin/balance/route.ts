import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import type { BalanceTransactionType } from "@prisma/client";
import { Prisma } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

type AdjustBody = {
  userId: string;
  type: "CREDIT" | "DEBIT";
  amount: number;
  comment?: string | null;
  orderId?: string | null;
};

export async function POST(request: NextRequest) {
  try {
    const session = await requireAdmin();

    let body: AdjustBody;
    try {
      body = (await request.json()) as AdjustBody;
    } catch {
      return NextResponse.json(
        { success: false, error: "Invalid JSON body" },
        { status: 400 },
      );
    }

    const amount = Number(body.amount);
    if (!body.userId || !Number.isFinite(amount) || amount <= 0) {
      return NextResponse.json(
        { success: false, error: "userId and positive amount are required" },
        { status: 400 },
      );
    }
    if (body.type !== "CREDIT" && body.type !== "DEBIT") {
      return NextResponse.json(
        { success: false, error: "type must be CREDIT or DEBIT" },
        { status: 400 },
      );
    }

    const result = await db.$transaction(async (tx) => {
      const user = await tx.user.findUnique({ where: { id: body.userId } });
      if (!user) {
        throw new Error("USER_NOT_FOUND");
      }

      const current = Number(user.balance);
      const delta = body.type === "CREDIT" ? amount : -amount;
      const nextBal = current + delta;
      if (nextBal < 0) {
        throw new Error("NEGATIVE_BALANCE");
      }

      const updated = await tx.user.update({
        where: { id: body.userId },
        data: { balance: new Prisma.Decimal(nextBal.toFixed(2)) },
      });

      await tx.balanceTransaction.create({
        data: {
          userId: body.userId,
          type: body.type as BalanceTransactionType,
          amount: new Prisma.Decimal(amount.toFixed(2)),
          balanceAfter: new Prisma.Decimal(nextBal.toFixed(2)),
          comment: body.comment ?? `Admin ${body.type.toLowerCase()}`,
          orderId: body.orderId ?? undefined,
          createdBy: session.userId!,
        },
      });

      return updated;
    });

    await logAudit({
      actorId: session.userId!,
      actorRole: "admin",
      entity: "user_balance",
      entityId: body.userId,
      action: "balance_change",
      newValue: { type: body.type, amount, balance: result.balance },
    });

    return NextResponse.json({
      success: true,
      data: { balance: result.balance },
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    if (message === "Unauthorized") {
      return NextResponse.json({ success: false, error: message }, { status: 401 });
    }
    if (message === "Forbidden") {
      return NextResponse.json({ success: false, error: message }, { status: 403 });
    }
    if (message === "USER_NOT_FOUND") {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
    }
    if (message === "NEGATIVE_BALANCE") {
      return NextResponse.json(
        { success: false, error: "Resulting balance would be negative" },
        { status: 400 },
      );
    }
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
