import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const setting = await db.siteSettings.findUnique({
      where: { key: "exchange_rate_usd_rub" },
    });
    const rate = setting ? parseFloat(setting.value) : 92;
    return NextResponse.json({ success: true, data: { rate: rate || 92 } });
  } catch {
    return NextResponse.json({ success: true, data: { rate: 92 } });
  }
}
