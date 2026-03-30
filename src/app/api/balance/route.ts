import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const session = await requireAuth();

    const user = await db.user.findUnique({
      where: { id: session.userId },
      select: { balance: true },
    });
    if (!user) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
    }

    const transactions = await db.balanceTransaction.findMany({
      where: { userId: session.userId },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    return NextResponse.json({
      success: true,
      data: {
        balance: user.balance,
        transactions,
      },
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    if (message === "Unauthorized") return NextResponse.json({ success: false, error: message }, { status: 401 });
    if (message === "Blocked") return NextResponse.json({ success: false, error: "Your account has been blocked" }, { status: 403 });
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
