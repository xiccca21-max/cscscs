import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const locale = req.nextUrl.searchParams.get("locale") ?? "en";
    const reviews = await db.review.findMany({
      where: {
        isActive: true,
        ...(locale === "ru" ? { textRu: { not: "" } } : { textEn: { not: "" } }),
      },
      orderBy: { sortOrder: "asc" },
    });
    return NextResponse.json({ success: true, data: reviews });
  } catch (e) {
    return NextResponse.json(
      { success: false, error: e instanceof Error ? e.message : "Unknown" },
      { status: 500 },
    );
  }
}
