import { requireAuth } from "@/lib/auth";
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

    console.log(`[inventory] Fetching ${gameParam} for ${session.steamId}`);

    const game = gameParam as Game;
    const t1 = Date.now();
    const { items, error } = await getSteamInventory(session.steamId, gameParam);
    console.log(`[inventory] Steam fetch: ${Date.now() - t1}ms, items: ${items.length}, error: ${error}`);

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

    type InvItem = { name: string };
    const invItems = items as InvItem[];

    let priceMap = new Map<string, { buyoutPrice: number }>();
    if (invItems.length > 0) {
      try {
        const t2 = Date.now();
        const priceInputs = invItems.map((item) => ({
          name: item.name,
          game,
        }));
        const rawMap = await getBulkPrices(priceInputs);
        priceMap = rawMap as Map<string, { buyoutPrice: number }>;
        console.log(`[inventory] Pricing: ${Date.now() - t2}ms, priced: ${priceMap.size}/${invItems.length}`);
      } catch (e) {
        console.error(`[inventory] Pricing failed:`, e);
      }
    }

    const itemsWithPrices = invItems.map((item) => ({
      ...item,
      price: priceMap.get(item.name)?.buyoutPrice ?? null,
    }));

    console.log(`[inventory] Total: ${Date.now() - t0}ms, returning ${itemsWithPrices.length} items`);
    return NextResponse.json({ success: true, data: { items: itemsWithPrices } });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    console.error(`[inventory] Error after ${Date.now() - t0}ms:`, message);
    if (message === "Unauthorized") {
      return NextResponse.json({ success: false, error: message }, { status: 401 });
    }
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
