import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    await requireAdmin();

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const [
      totalOrders,
      totalUsers,
      pendingCashouts,
      todayOrders,
    ] = await Promise.all([
      db.order.count(),
      db.user.count(),
      db.cashoutRequest.findMany({
        where: { status: { in: ["CREATED", "PENDING", "APPROVED"] } },
        select: { amount: true },
      }),
      db.order.findMany({
        where: { createdAt: { gte: todayStart } },
        select: { totalAmount: true },
      }),
    ]);

    const pendingPayoutsSum = pendingCashouts.reduce(
      (sum, c) => sum + Number(c.amount),
      0,
    );
    const todayVolume = todayOrders.reduce(
      (sum, o) => sum + Number(o.totalAmount),
      0,
    );

    return NextResponse.json({
      success: true,
      data: {
        totalOrders,
        totalUsers,
        pendingPayouts: pendingPayoutsSum.toFixed(2),
        todayVolume: todayVolume.toFixed(2),
      },
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    if (message === "Unauthorized")
      return NextResponse.json({ success: false, error: message }, { status: 401 });
    if (message === "Forbidden")
      return NextResponse.json({ success: false, error: message }, { status: 403 });
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
