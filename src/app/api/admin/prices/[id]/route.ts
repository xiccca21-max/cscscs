import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { NextRequest, NextResponse } from "next/server";

function errRes(e: unknown) {
  const msg = e instanceof Error ? e.message : "Unknown error";
  const status = msg === "Unauthorized" ? 401 : msg === "Forbidden" ? 403 : 500;
  return NextResponse.json({ success: false, error: msg }, { status });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requireAdmin();
    const { id } = await params;
    const existing = await db.pricingRule.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });
    await db.pricingRule.delete({ where: { id } });
    await logAudit({
      actorId: session.userId,
      actorRole: "admin",
      entity: "pricing_rule",
      entityId: id,
      action: "delete",
      oldValue: existing,
    });
    return NextResponse.json({ success: true });
  } catch (e) {
    return errRes(e);
  }
}
