import { requireAdmin } from "@/lib/auth";
import { searchTmMarketHashNames } from "@/lib/pricing";
import type { Game } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

const GAMES = new Set<string>(["CS2", "DOTA2", "TF2", "RUST"]);

export async function GET(request: NextRequest) {
  try {
    await requireAdmin();
    const gameParam = request.nextUrl.searchParams.get("game")?.toUpperCase() ?? "";
    if (!GAMES.has(gameParam)) {
      return NextResponse.json(
        { success: false, error: "Invalid or missing game (CS2, DOTA2, TF2, RUST)" },
        { status: 400 },
      );
    }
    const game = gameParam as Game;
    const q = request.nextUrl.searchParams.get("q") ?? "";
    const limitRaw = request.nextUrl.searchParams.get("limit");
    const limit = Math.min(200, Math.max(1, parseInt(limitRaw ?? "150", 10) || 150));

    const names = await searchTmMarketHashNames(game, q, limit);
    return NextResponse.json({ success: true, data: names });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    if (message === "Unauthorized") {
      return NextResponse.json({ success: false, error: message }, { status: 401 });
    }
    if (message === "Forbidden") {
      return NextResponse.json({ success: false, error: message }, { status: 403 });
    }
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
