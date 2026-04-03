import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import {
  getReferralProgramSettings,
  REFERRAL_BONUS_COMMENT_PREFIX,
} from "@/lib/referral-reward";
import { NextResponse } from "next/server";

function generateCode(steamLogin: string | undefined): string {
  const base = (steamLogin || "user").replace(/[^a-zA-Z0-9]/g, "").slice(0, 8).toUpperCase();
  const suffix = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `${base}-${suffix}`;
}

export async function GET() {
  try {
    const session = await requireAuth();

    const user = await db.user.findUnique({
      where: { id: session.userId },
      select: { id: true, steamLogin: true, steamId: true },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 },
      );
    }

    let referral = await db.referral.findFirst({
      where: { name: user.steamId },
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
      referral = await db.referral.create({
        data: {
          name: user.steamId,
          code: generateCode(user.steamLogin ?? undefined),
          password: "",
          isActive: true,
        },
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
    }

    const signups = referral.users.length;
    let ordered = 0;
    let done = 0;
    let volume = 0;

    for (const u of referral.users) {
      if (u.orders.length > 0) ordered++;
      for (const order of u.orders) {
        if (order.status === "PAID") {
          done++;
          volume += Number(order.totalAmount);
        }
      }
    }

    const bonusAgg = await db.balanceTransaction.aggregate({
      where: {
        userId: session.userId,
        type: "CREDIT",
        comment: { startsWith: REFERRAL_BONUS_COMMENT_PREFIX },
      },
      _sum: { amount: true },
    });
    const referralBonusesPaid = bonusAgg._sum.amount?.toFixed(2) ?? "0.00";

    const program = await getReferralProgramSettings(db);

    return NextResponse.json({
      success: true,
      data: {
        name: referral.name,
        code: referral.code,
        signups,
        ordered,
        done,
        volume: volume.toFixed(2),
        referralBonusesPaid,
        rewardPerReferralUsd: program.rewardUsd,
        minOrderForRewardUsd: program.minOrderUsd,
        minCashoutUsd: program.minCashoutUsd,
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
    if (message === "Unauthorized") return NextResponse.json({ success: false, error: message }, { status: 401 });
    if (message === "Blocked") return NextResponse.json({ success: false, error: "Your account has been blocked" }, { status: 403 });
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
