const STEAM_OPENID_URL = "https://steamcommunity.com/openid/login";
const STEAM_API_URL = "https://api.steampowered.com";

const STEAM_GAME_APP_IDS: Record<string, number> = {
  CS2: 730,
  DOTA2: 570,
  TF2: 440,
  RUST: 252490,
};

export function getSteamLoginUrl(returnUrl: string): string {
  const params = new URLSearchParams({
    "openid.ns": "http://specs.openid.net/auth/2.0",
    "openid.mode": "checkid_setup",
    "openid.return_to": returnUrl,
    "openid.realm": new URL(returnUrl).origin,
    "openid.identity":
      "http://specs.openid.net/auth/2.0/identifier_select",
    "openid.claimed_id":
      "http://specs.openid.net/auth/2.0/identifier_select",
  });
  return `${STEAM_OPENID_URL}?${params.toString()}`;
}

export async function verifySteamLogin(
  params: URLSearchParams,
): Promise<string | null> {
  const validationParams = new URLSearchParams(params);
  validationParams.set("openid.mode", "check_authentication");

  const response = await fetch(STEAM_OPENID_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: validationParams.toString(),
  });

  const text = await response.text();
  if (!text.includes("is_valid:true")) return null;

  const claimedId = params.get("openid.claimed_id");
  if (!claimedId) return null;

  const match = claimedId.match(/\/id\/(\d+)$/);
  return match ? match[1] : null;
}

export async function getSteamProfile(steamId: string) {
  const apiKey = process.env.STEAM_API_KEY;
  if (!apiKey) throw new Error("STEAM_API_KEY is not configured");

  const url = `${STEAM_API_URL}/ISteamUser/GetPlayerSummaries/v2/?key=${apiKey}&steamids=${steamId}`;
  const res = await fetch(url);
  const data = await res.json();
  const player = data?.response?.players?.[0];
  if (!player) return null;

  return {
    steamId: player.steamid as string,
    personaName: player.personaname as string,
    avatar: player.avatarfull as string,
    profileUrl: player.profileurl as string,
  };
}

export async function getSteamInventory(
  steamId: string,
  game: keyof typeof STEAM_GAME_APP_IDS,
) {
  const appId = STEAM_GAME_APP_IDS[game];
  if (!appId) throw new Error(`Unknown game: ${game}`);

  const url = `https://steamcommunity.com/inventory/${steamId}/${appId}/2?l=english&count=5000`;

  const res = await fetch(url, {
    headers: { Accept: "application/json" },
  });

  if (!res.ok) {
    if (res.status === 403) return { items: [], error: "inventory_private" as const };
    if (res.status === 429) return { items: [], error: "rate_limited" as const };
    return { items: [], error: "fetch_failed" as const };
  }

  const data = await res.json();

  if (!data.descriptions || !data.assets) {
    return { items: [], error: null };
  }

  const descriptionsMap = new Map<string, Record<string, unknown>>();
  for (const desc of data.descriptions) {
    descriptionsMap.set(`${desc.classid}_${desc.instanceid}`, desc);
  }

  type SteamTag = { category: string; localized_tag_name: string };

  const items = data.assets
    .map((asset: Record<string, string>) => {
      const desc = descriptionsMap.get(
        `${asset.classid}_${asset.instanceid}`,
      ) as Record<string, unknown> | undefined;
      return {
        assetId: asset.assetid,
        classId: asset.classid,
        instanceId: asset.instanceid,
        name:
          (desc?.market_hash_name as string) ||
          (desc?.name as string) ||
          "Unknown",
        iconUrl: desc?.icon_url
          ? `https://steamcommunity-a.akamaihd.net/economy/image/${desc.icon_url}`
          : null,
        tradable: (desc?.tradable as number) === 1,
        condition: extractCondition(desc?.market_hash_name as string),
        quality: (desc?.tags as SteamTag[] | undefined)?.find(
          (t) => t.category === "Quality",
        )?.localized_tag_name ?? null,
      };
    })
    .filter((item: { tradable: boolean }) => item.tradable);

  return { items, error: null };
}

function extractCondition(name?: string): string | null {
  if (!name) return null;
  const match = name.match(
    /\((Factory New|Minimal Wear|Field-Tested|Well-Worn|Battle-Scarred)\)/,
  );
  return match ? match[1] : null;
}
