import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const session = await requireAdmin();
    if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

    const count = await db.orderMessage.count({
      where: { authorRole: "user", readAt: null },
    });

    return NextResponse.json({ success: true, data: { count } });
  } catch (e: any) {
    if (e?.message === "Unauthorized" || e?.message === "Forbidden") {
      return NextResponse.json({ success: false, error: e.message }, { status: 401 });
    }
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 });
  }
}
