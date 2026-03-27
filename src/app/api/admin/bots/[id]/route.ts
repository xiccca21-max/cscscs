import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { NextRequest, NextResponse } from "next/server";

type PatchBody = {
  name?: string;
  isActive?: boolean;
  comment?: string | null;
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

    const existing = await db.botAccount.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Bot not found" },
        { status: 404 },
      );
    }

    const updated = await db.botAccount.update({
      where: { id },
      data: {
        ...(body.name !== undefined && { name: body.name }),
        ...(body.isActive !== undefined && { isActive: body.isActive }),
        ...(body.comment !== undefined && { comment: body.comment }),
      },
    });

    await logAudit({
      actorId: session.userId,
      actorRole: "admin",
      entity: "bot_account",
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

    const existing = await db.botAccount.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Bot not found" },
        { status: 404 },
      );
    }

    await db.botAccount.delete({ where: { id } });

    await logAudit({
      actorId: session.userId,
      actorRole: "admin",
      entity: "bot_account",
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
