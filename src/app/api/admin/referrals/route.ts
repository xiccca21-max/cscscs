import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  try {
    await requireAdmin();

    const referrals = await db.referral.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        _count: { select: { users: true } },
      },
    });

    const data = referrals.map(({ _count, ...rest }) => ({
      ...rest,
      userCount: _count.users,
    }));

    return NextResponse.json({ success: true, data });
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

type CreateReferralBody = {
  name: string;
  code: string;
  password: string;
};

export async function POST(request: NextRequest) {
  try {
    const session = await requireAdmin();

    let body: CreateReferralBody;
    try {
      body = (await request.json()) as CreateReferralBody;
    } catch {
      return NextResponse.json(
        { success: false, error: "Invalid JSON body" },
        { status: 400 },
      );
    }

    if (!body.name || !body.code || !body.password) {
      return NextResponse.json(
        { success: false, error: "name, code, and password are required" },
        { status: 400 },
      );
    }

    const created = await db.referral.create({
      data: {
        name: body.name,
        code: body.code,
        password: body.password,
      },
    });

    await logAudit({
      actorId: session.userId!,
      actorRole: "admin",
      entity: "referral",
      entityId: created.id,
      action: "create",
      newValue: { ...created, password: "[redacted]" },
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
