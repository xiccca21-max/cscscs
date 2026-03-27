import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  try {
    await requireAdmin();
    const bots = await db.botAccount.findMany({
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ success: true, data: bots });
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

type CreateBotBody = {
  steamId: string;
  steamProfileUrl: string;
  name: string;
  comment?: string | null;
};

export async function POST(request: NextRequest) {
  try {
    const session = await requireAdmin();

    let body: CreateBotBody;
    try {
      body = (await request.json()) as CreateBotBody;
    } catch {
      return NextResponse.json(
        { success: false, error: "Invalid JSON body" },
        { status: 400 },
      );
    }

    if (!body.steamId || !body.steamProfileUrl || !body.name) {
      return NextResponse.json(
        { success: false, error: "steamId, steamProfileUrl, and name are required" },
        { status: 400 },
      );
    }

    const created = await db.botAccount.create({
      data: {
        steamId: body.steamId,
        steamProfileUrl: body.steamProfileUrl,
        name: body.name,
        comment: body.comment ?? null,
      },
    });

    await logAudit({
      actorId: session.userId!,
      actorRole: "admin",
      entity: "bot_account",
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
