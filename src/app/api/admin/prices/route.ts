import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { normalizePricingPhase } from "@/lib/pricingPhases";
import type { Game } from "@prisma/client";
import { Prisma } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  try {
    await requireAdmin();
    const rules = await db.pricingRule.findMany({
      orderBy: { updatedAt: "desc" },
    });
    return NextResponse.json({ success: true, data: rules });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    if (message === "Unauthorized") {
      return NextResponse.json({ success: false, error: message }, { status: 401 });
    }
    if (message === "Forbidden") {
      return NextResponse.json({ success: false, error: message }, { status: 403 });
    }
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

type PriceRuleBody = {
  id?: string;
  game?: Game | null;
  itemExternalId?: string | null;
  phase?: string | null;
  adjustmentType: string;
  adjustmentValue: number;
  isExcluded?: boolean;
};

export async function POST(request: NextRequest) {
  try {
    const session = await requireAdmin();

    let body: PriceRuleBody;
    try {
      body = (await request.json()) as PriceRuleBody;
    } catch {
      return NextResponse.json(
        { success: false, error: "Invalid JSON body" },
        { status: 400 },
      );
    }

    if (!body.adjustmentType || body.adjustmentValue === undefined) {
      return NextResponse.json(
        { success: false, error: "adjustmentType and adjustmentValue are required" },
        { status: 400 },
      );
    }

    const phaseNorm = normalizePricingPhase(body.phase);
    if (phaseNorm && !(body.itemExternalId && String(body.itemExternalId).trim())) {
      return NextResponse.json(
        { success: false, error: "itemExternalId is required when phase is set" },
        { status: 400 },
      );
    }

    const rule = body.id
      ? await db.pricingRule.update({
          where: { id: body.id },
          data: {
            ...(body.game !== undefined ? { game: body.game } : {}),
            ...(body.itemExternalId !== undefined ? { itemExternalId: body.itemExternalId } : {}),
            ...(body.phase !== undefined ? { phase: phaseNorm } : {}),
            adjustmentType: body.adjustmentType,
            adjustmentValue: new Prisma.Decimal(Number(body.adjustmentValue).toFixed(4)),
            ...(body.isExcluded !== undefined ? { isExcluded: body.isExcluded } : {}),
          },
        })
      : await db.pricingRule.create({
          data: {
            game: body.game ?? null,
            itemExternalId: body.itemExternalId ?? null,
            phase: phaseNorm,
            adjustmentType: body.adjustmentType,
            adjustmentValue: new Prisma.Decimal(Number(body.adjustmentValue).toFixed(4)),
            isExcluded: body.isExcluded ?? false,
          },
        });

    await logAudit({
      actorId: session.userId!,
      actorRole: "admin",
      entity: "pricing_rule",
      entityId: rule.id,
      action: body.id ? "update" : "create",
      newValue: rule,
    });

    return NextResponse.json({ success: true, data: rule });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    if (message === "Unauthorized") {
      return NextResponse.json({ success: false, error: message }, { status: 401 });
    }
    if (message === "Forbidden") {
      return NextResponse.json({ success: false, error: message }, { status: 403 });
    }
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
