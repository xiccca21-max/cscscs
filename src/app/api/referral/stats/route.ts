import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const session = await getSession();
    if (!session.isReferral || !session.referralId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    const referral = await db.referral.findUnique({
      where: { id: session.referralId },
      include: {
        users: {
          select: {
            id: true,
            steamLogin: true,
            createdAt: true,
            orders: {
              select: {
                id: true,
                status: true,
                totalAmount: true,
              },
            },
          },
        },
      },
    });

    if (!referral) {
      return NextResponse.json(
        { success: false, error: "Referral not found" },
        { status: 404 },
      );
    }

    const signups = referral.users.length;
    let ordered = 0;
    let done = 0;
    let volume = 0;

    for (const user of referral.users) {
      if (user.orders.length > 0) ordered++;
      for (const order of user.orders) {
        if (order.status === "PAID") {
          done++;
          volume += Number(order.totalAmount);
        }
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        name: referral.name,
        code: referral.code,
        signups,
        ordered,
        done,
        volume: volume.toFixed(2),
        users: referral.users.map((u) => ({
          id: u.id,
          steamLogin: u.steamLogin,
          createdAt: u.createdAt,
          ordersCount: u.orders.length,
          paidOrders: u.orders.filter((o) => o.status === "PAID").length,
          totalVolume: u.orders
            .filter((o) => o.status === "PAID")
            .reduce((s, o) => s + Number(o.totalAmount), 0)
            .toFixed(2),
        })),
      },
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 },
    );
  }
}
