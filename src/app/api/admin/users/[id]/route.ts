import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    await requireAdmin();
    const { id } = await context.params;

    const user = await db.user.findUnique({
      where: { id },
      include: {
        orders: { orderBy: { createdAt: "desc" }, take: 20 },
        balanceTransactions: { orderBy: { createdAt: "desc" }, take: 50 },
        cashoutRequests: { orderBy: { createdAt: "desc" }, take: 20 },
      },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({ success: true, data: user });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    if (message === "Unauthorized")
      return NextResponse.json({ success: false, error: message }, { status: 401 });
    if (message === "Forbidden")
      return NextResponse.json({ success: false, error: message }, { status: 403 });
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

type PatchBody = {
  status?: "ACTIVE" | "BLOCKED";
  blockReason?: string;
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

    const existing = await db.user.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 },
      );
    }

    const updated = await db.user.update({
      where: { id },
      data: {
        ...(body.status && { status: body.status }),
        ...(body.blockReason !== undefined && {
          blockReason: body.blockReason || null,
        }),
      },
    });

    const action =
      body.status === "BLOCKED"
        ? ("block" as const)
        : body.status === "ACTIVE"
          ? ("unblock" as const)
          : ("update" as const);

    await logAudit({
      actorId: session.userId,
      actorRole: "admin",
      entity: "user",
      entityId: id,
      action,
      oldValue: { status: existing.status, blockReason: existing.blockReason },
      newValue: { status: updated.status, blockReason: updated.blockReason },
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
