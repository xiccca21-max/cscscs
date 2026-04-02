import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { code } = (await request.json()) as { code: string };

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

    return NextResponse.json({
      success: true,
      data: {
        code: promo.code,
        discount: Number(promo.discount),
      },
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
