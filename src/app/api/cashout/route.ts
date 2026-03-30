import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { Prisma } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

type CashoutBody = {
  amount: number;
  paymentMethod: string;
  currency: string;
  paymentDetails: Prisma.InputJsonValue;
};

export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth();

    let body: CashoutBody;
    try {
      body = (await request.json()) as CashoutBody;
    } catch {
      return NextResponse.json(
        { success: false, error: "Invalid JSON body" },
        { status: 400 },
      );
    }

    const amount = Number(body.amount);
    if (!Number.isFinite(amount) || amount <= 0) {
      return NextResponse.json(
        { success: false, error: "amount must be greater than 0" },
        { status: 400 },
      );
    }
    if (!body.paymentMethod || !body.currency) {
      return NextResponse.json(
        { success: false, error: "paymentMethod and currency are required" },
        { status: 400 },
      );
    }

    const paymentMethodRecord =
      (await db.paymentMethod.findFirst({
        where: {
          OR: [{ id: body.paymentMethod }, { name: body.paymentMethod }],
          isActive: true,
        },
      })) ??
      (await db.paymentMethod.findFirst({
        where: { type: body.paymentMethod, isActive: true },
      }));

    const commissionPercent = paymentMethodRecord
      ? Number(paymentMethodRecord.commission)
      : 0;
    const commission = (amount * commissionPercent) / 100;
    const totalAmount = amount + commission;

    const result = await db.$transaction(async (tx) => {
      const user = await tx.user.findUnique({ where: { id: session.userId } });
      if (!user) {
        throw new Error("USER_NOT_FOUND");
      }
      const balanceNum = Number(user.balance);
      if (balanceNum < amount) {
        throw new Error("INSUFFICIENT_BALANCE");
      }

      const cashoutRequest = await tx.cashoutRequest.create({
        data: {
          userId: session.userId,
          amount: new Prisma.Decimal(amount.toFixed(2)),
          commission: new Prisma.Decimal(commission.toFixed(2)),
          totalAmount: new Prisma.Decimal(totalAmount.toFixed(2)),
          paymentMethod: body.paymentMethod,
          currency: body.currency,
          paymentDetails: body.paymentDetails ?? {},
          status: "CREATED",
        },
      });

      const newBalance = balanceNum - amount;
      await tx.user.update({
        where: { id: session.userId },
        data: { balance: new Prisma.Decimal(newBalance.toFixed(2)) },
      });

      await tx.balanceTransaction.create({
        data: {
          userId: session.userId,
          type: "FREEZE",
          amount: new Prisma.Decimal(amount.toFixed(2)),
          balanceAfter: new Prisma.Decimal(newBalance.toFixed(2)),
          comment: `Cashout request ${cashoutRequest.id}`,
          cashoutRequestId: cashoutRequest.id,
        },
      });

      return cashoutRequest;
    });

    return NextResponse.json({ success: true, data: result });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    if (message === "Unauthorized") return NextResponse.json({ success: false, error: message }, { status: 401 });
    if (message === "Blocked") return NextResponse.json({ success: false, error: "Your account has been blocked" }, { status: 403 });
    if (message === "USER_NOT_FOUND") {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
    }
    if (message === "INSUFFICIENT_BALANCE") {
      return NextResponse.json(
        { success: false, error: "Insufficient balance" },
        { status: 400 },
      );
    }
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
