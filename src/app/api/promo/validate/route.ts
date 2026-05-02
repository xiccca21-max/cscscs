import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { userEligibleForNewUserPromo } from "@/lib/promo-validate-shared";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const raw = await request.json();
    const { code } = raw as { code?: string };

    if (!code || typeof code !== "string") {
      return NextResponse.json(
        { success: false, error: "code is required" },
        { status: 400 },
      );
    }

    const promo = await db.promoCode.findUnique({
      where: { code: code.trim().toUpperCase() },
    });

    if (!promo || !promo.isActive) {
      return NextResponse.json(
        { success: false, error: "Invalid promo code" },
        { status: 404 },
      );
    }

    if (promo.expiresAt && new Date() > promo.expiresAt) {
      return NextResponse.json(
        { success: false, error: "Promo code has expired" },
        { status: 410 },
      );
    }

    if (promo.usageLimit !== null && promo.usageCount >= promo.usageLimit) {
      return NextResponse.json(
        { success: false, error: "Promo code usage limit reached" },
        { status: 410 },
      );
    }

    const discount = Number(promo.discount);

    if (promo.newUsersOnly) {
      const session = await getSession();
      if (!session.userId) {
        return NextResponse.json(
          { success: false, error: "Sign in with Steam to use this promo" },
          { status: 403 },
        );
      }
      const eligible = await userEligibleForNewUserPromo(session.userId);
      if (!eligible) {
        return NextResponse.json(
          {
            success: false,
            error: "This promo is only available before your first completed payout",
          },
          { status: 403 },
        );
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        code: promo.code,
        discount,
      },
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
