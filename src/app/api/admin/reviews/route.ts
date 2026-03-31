import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  try {
    await requireAdmin();
    const reviews = await db.review.findMany({ orderBy: { sortOrder: "asc" } });
    return NextResponse.json({ success: true, data: reviews });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown";
    return NextResponse.json({ success: false, error: msg }, { status: msg === "Forbidden" ? 403 : 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAdmin();
    const body = await request.json();
    const { user, steam, avatar, textEn, textRu, game, stars } = body;
    if (!user || !steam || !textEn || !textRu)
      return NextResponse.json({ success: false, error: "Missing fields" }, { status: 400 });

    const maxSort = await db.review.aggregate({ _max: { sortOrder: true } });
    const review = await db.review.create({
      data: {
        user,
        steam,
        avatar: avatar || "",
        textEn,
        textRu,
        game: game || "CS2",
        stars: Math.min(5, Math.max(1, Number(stars) || 5)),
        sortOrder: (maxSort._max.sortOrder ?? 0) + 1,
      },
    });
    return NextResponse.json({ success: true, data: review });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
