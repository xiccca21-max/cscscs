import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const settings = await db.siteSettings.findMany({
      where: { key: { startsWith: "social_" } },
    });
    const links: Record<string, string> = {};
    for (const s of settings) {
      links[s.key.replace("social_", "")] = s.value;
    }
    return NextResponse.json({ success: true, data: links });
  } catch {
    return NextResponse.json({ success: true, data: {} });
  }
}
