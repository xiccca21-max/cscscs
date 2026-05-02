import { db } from "@/lib/db";
import { NextResponse } from "next/server";

/** Public featured promo for landing hero (chosen in admin via “show on hero”). */
export async function GET() {
  try {
    const promo = await db.promoCode.findFirst({
      where: {
        featuredOnHero: true,
        isActive: true,
      },
      orderBy: { updatedAt: "desc" },
    });

    if (!promo) {
      return NextResponse.json({ success: true, data: null });
    }

    const now = new Date();
    if (promo.expiresAt && now > promo.expiresAt) {
      return NextResponse.json({ success: true, data: null });
    }
    if (promo.usageLimit !== null && promo.usageCount >= promo.usageLimit) {
      return NextResponse.json({ success: true, data: null });
    }

    return NextResponse.json({
      success: true,
      data: {
        code: promo.code,
        discount: Number(promo.discount),
        newUsersOnly: promo.newUsersOnly,
      },
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
