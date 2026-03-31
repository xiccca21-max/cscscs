import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    await requireAdmin();
    const { id } = await context.params;
    const body = await request.json();

    const data: Record<string, unknown> = {};
    if (body.user !== undefined) data.user = body.user;
    if (body.steam !== undefined) data.steam = body.steam;
    if (body.avatar !== undefined) data.avatar = body.avatar;
    if (body.textEn !== undefined) data.textEn = body.textEn;
    if (body.textRu !== undefined) data.textRu = body.textRu;
    if (body.game !== undefined) data.game = body.game;
    if (body.stars !== undefined) data.stars = Math.min(5, Math.max(1, Number(body.stars)));
    if (body.isActive !== undefined) data.isActive = body.isActive;
    if (body.sortOrder !== undefined) data.sortOrder = Number(body.sortOrder);

    const review = await db.review.update({ where: { id }, data });
    return NextResponse.json({ success: true, data: review });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    await requireAdmin();
    const { id } = await context.params;
    await db.review.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
