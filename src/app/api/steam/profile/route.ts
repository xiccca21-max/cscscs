import { NextRequest, NextResponse } from "next/server";

const STEAM_API_KEY = process.env.STEAM_API_KEY ?? "";

async function resolveSteamId(profileUrl: string): Promise<string | null> {
  const profilesMatch = profileUrl.match(/\/profiles\/(\d{17})/);
  if (profilesMatch) return profilesMatch[1];

  const idMatch = profileUrl.match(/\/id\/([^\/\s?]+)/);
  if (!idMatch) return null;

  const vanityName = idMatch[1];
  try {
    const r = await fetch(
      `https://api.steampowered.com/ISteamUser/ResolveVanityURL/v1/?key=${STEAM_API_KEY}&vanityurl=${vanityName}`,
    );
    const json = await r.json();
    if (json.response?.success === 1) return json.response.steamid;
  } catch {}
  return null;
}

export async function GET(req: NextRequest) {
  const steamProfileUrl = req.nextUrl.searchParams.get("url");
  const steamIdParam = req.nextUrl.searchParams.get("steamId");

  if (!steamProfileUrl && !steamIdParam) {
    return NextResponse.json({ success: false, error: "url or steamId required" }, { status: 400 });
  }

  let steamId = steamIdParam;
  if (!steamId && steamProfileUrl) {
    steamId = await resolveSteamId(steamProfileUrl);
  }

  if (!steamId) {
    return NextResponse.json({ success: false, error: "Could not resolve Steam ID" }, { status: 400 });
  }

  try {
    const [summaryRes, levelRes] = await Promise.all([
      fetch(
        `https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v2/?key=${STEAM_API_KEY}&steamids=${steamId}`,
      ),
      fetch(
        `https://api.steampowered.com/IPlayerService/GetSteamLevel/v1/?key=${STEAM_API_KEY}&steamid=${steamId}`,
      ),
    ]);

    const summaryJson = await summaryRes.json();
    const levelJson = await levelRes.json();

    const player = summaryJson.response?.players?.[0];
    if (!player) {
      return NextResponse.json({ success: false, error: "Player not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: {
        steamId: player.steamid,
        name: player.personaname,
        avatarUrl: player.avatarfull || player.avatarmedium || player.avatar,
        profileUrl: player.profileurl,
        level: levelJson.response?.player_level ?? 0,
      },
    });
  } catch (e) {
    return NextResponse.json(
      { success: false, error: "Failed to fetch Steam data" },
      { status: 500 },
    );
  }
}
