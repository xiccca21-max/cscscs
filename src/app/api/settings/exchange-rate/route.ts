import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const settings = await db.siteSettings.findMany({
      where: { key: { in: ["exchange_rate_usd_rub", "exchange_rate_usd_eur"] } },
    });
    const map: Record<string, string> = {};
    for (const s of settings) map[s.key] = s.value;

    const rub = parseFloat(map.exchange_rate_usd_rub) || 92;
    const eur = parseFloat(map.exchange_rate_usd_eur) || 0.92;

    return NextResponse.json({ success: true, data: { rub, eur } });
  } catch {
    return NextResponse.json({ success: true, data: { rub: 92, eur: 0.92 } });
  }
}
