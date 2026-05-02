import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

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
      return NextResponse.json(
        { success: true, data: null },
        { headers: { "Cache-Control": "private, no-store" } },
      );
    }

    const now = new Date();
    if (promo.expiresAt && now > promo.expiresAt) {
      return NextResponse.json(
        { success: true, data: null },
        { headers: { "Cache-Control": "private, no-store" } },
      );
    }
    const limit =
      promo.usageLimit != null && promo.usageLimit > 0 ? promo.usageLimit : null;
    if (limit !== null && promo.usageCount >= limit) {
      return NextResponse.json(
        { success: true, data: null },
        { headers: { "Cache-Control": "private, no-store" } },
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          code: promo.code,
          discount: Number(promo.discount),
          newUsersOnly: promo.newUsersOnly,
        },
      },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
