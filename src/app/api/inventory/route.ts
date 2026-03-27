import { requireAuth } from "@/lib/auth";
import { getBulkPrices } from "@/lib/pricing";
import { getSteamInventory } from "@/lib/steam";
import type { Game } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

const ALLOWED_GAMES = ["CS2", "DOTA2", "TF2", "RUST"] as const;
type AllowedGame = (typeof ALLOWED_GAMES)[number];

function isAllowedGame(g: string): g is AllowedGame {
  return (ALLOWED_GAMES as readonly string[]).includes(g);
}

export async function GET(request: NextRequest) {
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

    type InvItem = { name: string };
    const invItems = items as InvItem[];

    const priceInputs = invItems.map((item) => ({
      name: item.name,
      game,
    }));
    const priceMap = await getBulkPrices(priceInputs);

    const itemsWithPrices = invItems.map((item) => ({
      ...item,
      price: priceMap.get(item.name) ?? null,
    }));

    return NextResponse.json({ success: true, data: { items: itemsWithPrices } });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    if (message === "Unauthorized") {
      return NextResponse.json({ success: false, error: message }, { status: 401 });
    }
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
