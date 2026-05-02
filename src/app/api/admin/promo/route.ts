import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { Prisma } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  try {
    await requireAdmin();
    const promos = await db.promoCode.findMany({
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ success: true, data: promos });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    if (message === "Unauthorized")
      return NextResponse.json({ success: false, error: message }, { status: 401 });
    if (message === "Forbidden")
      return NextResponse.json({ success: false, error: message }, { status: 403 });
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

type PromoBody = {
  id?: string;
  code: string;
  discount: number;
  isActive?: boolean;
  newUsersOnly?: boolean;
  featuredOnHero?: boolean;
  usageLimit?: number | null;
  expiresAt?: string | null;
};

export async function POST(request: NextRequest) {
  try {
    const session = await requireAdmin();

    let body: PromoBody;
    try {
      body = (await request.json()) as PromoBody;
    } catch {
      return NextResponse.json({ success: false, error: "Invalid JSON body" }, { status: 400 });
    }

    if (!body.code || body.discount === undefined) {
      return NextResponse.json(
        { success: false, error: "code and discount are required" },
        { status: 400 },
      );
    }

    const code = body.code.trim().toUpperCase();
    if (code.length < 2 || code.length > 32) {
      return NextResponse.json(
        { success: false, error: "Code must be 2-32 characters" },
        { status: 400 },
      );
    }

    const discount = Number(body.discount);
    if (isNaN(discount) || discount <= 0 || discount > 100) {
      return NextResponse.json(
        { success: false, error: "Discount must be between 0.01 and 100" },
        { status: 400 },
      );
    }

    const promo = body.id
      ? await db.promoCode.update({
          where: { id: body.id },
          data: {
            code,
            discount: new Prisma.Decimal(discount.toFixed(2)),
            ...(body.isActive !== undefined ? { isActive: body.isActive } : {}),
            ...(body.newUsersOnly !== undefined ? { newUsersOnly: body.newUsersOnly } : {}),
            ...(body.featuredOnHero !== undefined ? { featuredOnHero: body.featuredOnHero } : {}),
            ...(body.usageLimit !== undefined ? { usageLimit: body.usageLimit } : {}),
            ...(body.expiresAt !== undefined
              ? { expiresAt: body.expiresAt ? new Date(body.expiresAt) : null }
              : {}),
          },
        })
      : await db.promoCode.create({
          data: {
            code,
            discount: new Prisma.Decimal(discount.toFixed(2)),
            isActive: body.isActive ?? true,
            newUsersOnly: body.newUsersOnly ?? false,
            featuredOnHero: body.featuredOnHero ?? false,
            usageLimit: body.usageLimit ?? null,
            expiresAt: body.expiresAt ? new Date(body.expiresAt) : null,
          },
        });

    if (promo.featuredOnHero) {
      await db.promoCode.updateMany({
        where: { id: { not: promo.id } },
        data: { featuredOnHero: false },
      });
    }

    await logAudit({
      actorId: session.userId!,
      actorRole: "admin",
      entity: "promo_code",
      entityId: promo.id,
      action: body.id ? "update" : "create",
      newValue: promo,
    });

    return NextResponse.json({ success: true, data: promo });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    if (message === "Unauthorized")
      return NextResponse.json({ success: false, error: message }, { status: 401 });
    if (message === "Forbidden")
      return NextResponse.json({ success: false, error: message }, { status: 403 });
    if (message.includes("Unique constraint"))
      return NextResponse.json(
        { success: false, error: "Promo code already exists" },
        { status: 409 },
      );
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await requireAdmin();
    const { id } = (await request.json()) as { id: string };

    if (!id) {
      return NextResponse.json({ success: false, error: "id is required" }, { status: 400 });
    }

    await db.promoCode.delete({ where: { id } });

    await logAudit({
      actorId: session.userId!,
      actorRole: "admin",
      entity: "promo_code",
      entityId: id,
      action: "delete",
    });

    return NextResponse.json({ success: true });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    if (message === "Unauthorized")
      return NextResponse.json({ success: false, error: message }, { status: 401 });
    if (message === "Forbidden")
      return NextResponse.json({ success: false, error: message }, { status: 403 });
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
