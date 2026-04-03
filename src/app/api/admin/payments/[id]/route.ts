import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { Prisma } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

const SYSTEM_TYPES = new Set([
  "balance", "card", "paypal", "crypto", "btc", "usdt-trc20", "usdt-erc20", "eth", "ltc", "bank",
]);

type PatchBody = {
  name?: string;
  commission?: number;
  minAmount?: number;
  isActive?: boolean;
  currencies?: string[];
  requiredFields?: Prisma.InputJsonValue;
  sortOrder?: number;
};

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requireAdmin();
    const { id } = await context.params;

    let body: PatchBody;
    try {
      body = (await request.json()) as PatchBody;
    } catch {
      return NextResponse.json(
        { success: false, error: "Invalid JSON body" },
        { status: 400 },
      );
    }

    const existing = await db.paymentMethod.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Payment method not found" },
        { status: 404 },
      );
    }

    const updated = await db.paymentMethod.update({
      where: { id },
      data: {
        ...(body.name !== undefined && { name: body.name }),
        ...(body.commission !== undefined && {
          commission: new Prisma.Decimal(Number(body.commission).toFixed(2)),
        }),
        ...(body.minAmount !== undefined && {
          minAmount: new Prisma.Decimal(Number(body.minAmount).toFixed(2)),
        }),
        ...(body.isActive !== undefined && { isActive: body.isActive }),
        ...(body.currencies !== undefined && { currencies: body.currencies }),
        ...(body.requiredFields !== undefined && {
          requiredFields: body.requiredFields,
        }),
        ...(body.sortOrder !== undefined && { sortOrder: body.sortOrder }),
      },
    });

    await logAudit({
      actorId: session.userId,
      actorRole: "admin",
      entity: "payment_method",
      entityId: id,
      action: "update",
      oldValue: existing,
      newValue: updated,
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    if (message === "Unauthorized")
      return NextResponse.json({ success: false, error: message }, { status: 401 });
    if (message === "Forbidden")
      return NextResponse.json({ success: false, error: message }, { status: 403 });
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requireAdmin();
    const { id } = await context.params;

    const existing = await db.paymentMethod.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Payment method not found" },
        { status: 404 },
      );
    }

    if (SYSTEM_TYPES.has(existing.type)) {
      return NextResponse.json(
        { success: false, error: "Системный метод оплаты нельзя удалить" },
        { status: 403 },
      );
    }

    await db.paymentMethod.delete({ where: { id } });

    await logAudit({
      actorId: session.userId,
      actorRole: "admin",
      entity: "payment_method",
      entityId: id,
      action: "delete",
      oldValue: existing,
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
