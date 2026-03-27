import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { Prisma } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  try {
    await requireAdmin();
    const methods = await db.paymentMethod.findMany({
      orderBy: { sortOrder: "asc" },
    });
    return NextResponse.json({ success: true, data: methods });
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

type CreatePaymentBody = {
  name: string;
  type: string;
  commission: number;
  minAmount: number;
  currencies: string[];
  requiredFields: Prisma.InputJsonValue;
  sortOrder?: number;
};

export async function POST(request: NextRequest) {
  try {
    const session = await requireAdmin();

    let body: CreatePaymentBody;
    try {
      body = (await request.json()) as CreatePaymentBody;
    } catch {
      return NextResponse.json(
        { success: false, error: "Invalid JSON body" },
        { status: 400 },
      );
    }

    if (!body.name || !body.type) {
      return NextResponse.json(
        { success: false, error: "name and type are required" },
        { status: 400 },
      );
    }

    const created = await db.paymentMethod.create({
      data: {
        name: body.name,
        type: body.type,
        commission: new Prisma.Decimal(Number(body.commission).toFixed(2)),
        minAmount: new Prisma.Decimal(Number(body.minAmount ?? 0).toFixed(2)),
        currencies: body.currencies ?? [],
        requiredFields: body.requiredFields ?? {},
        sortOrder: body.sortOrder ?? 0,
      },
    });

    await logAudit({
      actorId: session.userId!,
      actorRole: "admin",
      entity: "payment_method",
      entityId: created.id,
      action: "create",
      newValue: created,
    });

    return NextResponse.json({ success: true, data: created });
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
