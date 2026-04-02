import { requireAuth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getBulkPrices } from "@/lib/pricing";
import { getSteamInventory } from "@/lib/steam";
import type { Game } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

export const maxDuration = 60;

const ALLOWED_GAMES = ["CS2", "DOTA2", "TF2", "RUST"] as const;
type AllowedGame = (typeof ALLOWED_GAMES)[number];

function isAllowedGame(g: string): g is AllowedGame {
  return (ALLOWED_GAMES as readonly string[]).includes(g);
}

export async function GET(request: NextRequest) {
  const t0 = Date.now();
  try {
    const session = await requireAuth();
    if (!session.steamId) {
      return NextResponse.json(
        { success: false, error: "Steam ID not linked" },
        { status: 400 },
      );
    }

    const gameParam =
      request.nextUrl.searchParams.get("game")?.toUpperCase() ?? "CS2";
    if (!isAllowedGame(gameParam)) {
      return NextResponse.json(
        { success: false, error: "Invalid game. Use CS2, DOTA2, TF2, or RUST." },
        { status: 400 },
      );
    }


    const game = gameParam as Game;
    const t1 = Date.now();
    const { items, error } = await getSteamInventory(session.steamId, gameParam);

    if (error === "inventory_private") {
      return NextResponse.json(
        { success: false, error: "Inventory is private or unavailable" },
        { status: 403 },
      );
    }
    if (error === "rate_limited") {
      return NextResponse.json(
        { success: false, error: "Rate limited. Try again later." },
        { status: 429 },
      );
    }
    if (error === "fetch_failed") {
      return NextResponse.json(
        { success: false, error: "Failed to fetch inventory" },
        { status: 502 },
      );
    }

    type InvItem = {
      name: string;
      assetId: string;
      phase?: string | null;
    };
    const invItems = items as InvItem[];

    let priceMap = new Map<string, { buyoutPrice: number }>();
    if (invItems.length > 0) {
      try {
        const priceInputs = invItems.map((item) => ({
          id: item.assetId,
          name: item.name,
          game,
          phase: item.phase ?? null,
        }));
        const rawMap = await getBulkPrices(priceInputs);
        priceMap = rawMap as Map<string, { buyoutPrice: number }>;
      } catch (e) {
        console.error(`[inventory] Pricing failed:`, e);
      }
    }

    const itemsWithPrices = invItems.map((item) => ({
      ...item,
      price: priceMap.get(item.assetId)?.buyoutPrice ?? null,
    }));

    let minPrice = 0;
    try {
      const row = await db.siteSettings.findUnique({ where: { key: "min_item_price_usd" } });
      if (row) minPrice = parseFloat(row.value) || 0;
    } catch {}

    return NextResponse.json({ success: true, data: { items: itemsWithPrices, minPrice } });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    console.error(`[inventory] Error after ${Date.now() - t0}ms:`, message);
    if (message === "Unauthorized") return NextResponse.json({ success: false, error: message }, { status: 401 });
    if (message === "Blocked") return NextResponse.json({ success: false, error: "Your account has been blocked" }, { status: 403 });
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
