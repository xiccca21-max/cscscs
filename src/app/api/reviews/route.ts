import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const reviews = await db.review.findMany({
      where: { isActive: true },
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
