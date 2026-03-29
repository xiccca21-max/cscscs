import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import type { CashoutStatus } from "@prisma/client";
import { Prisma } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

type PatchBody = {
  status: CashoutStatus;
};

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

    if (!["APPROVED", "REJECTED", "PAID"].includes(body.status)) {
      return NextResponse.json(
        { success: false, error: "status must be APPROVED, REJECTED, or PAID" },
        { status: 400 },
      );
    }

    const existing = await db.cashoutRequest.findUnique({
      where: { id },
      include: { user: true },
    });
    if (!existing) {
      return NextResponse.json({ success: false, error: "Cashout not found" }, { status: 404 });
    }

    const updated = await db.$transaction(async (tx) => {
      if (body.status === "REJECTED") {
        const freezeTx = await tx.balanceTransaction.findFirst({
          where: { cashoutRequestId: id, type: "FREEZE" },
        });
        const amount = freezeTx ? Number(freezeTx.amount) : Number(existing.amount);
        const user = await tx.user.findUnique({ where: { id: existing.userId } });
        if (user) {
          const nextBal = Number(user.balance) + amount;
          await tx.user.update({
            where: { id: existing.userId },
            data: { balance: new Prisma.Decimal(nextBal.toFixed(2)) },
          });
          await tx.balanceTransaction.create({
            data: {
              userId: existing.userId,
              type: "UNFREEZE",
              amount: new Prisma.Decimal(amount.toFixed(2)),
              balanceAfter: new Prisma.Decimal(nextBal.toFixed(2)),
              comment: `Cashout ${id} rejected - balance restored`,
              cashoutRequestId: id,
            },
          });
        }
      }

      const patch: Prisma.CashoutRequestUpdateInput = { status: body.status };
      if (body.status === "PAID") {
        patch.processedAt = new Date();
      }

      return tx.cashoutRequest.update({
        where: { id },
        data: patch,
        include: { user: true },
      });
    });

    await logAudit({
      actorId: session.userId!,
      actorRole: "admin",
      entity: "cashout_request",
      entityId: id,
      action:
        body.status === "REJECTED"
          ? "reject"
          : body.status === "APPROVED"
            ? "approve"
            : "update",
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
