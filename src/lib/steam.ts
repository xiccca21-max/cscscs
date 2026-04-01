const STEAM_OPENID_URL = "https://steamcommunity.com/openid/login";
const STEAM_API_URL = "https://api.steampowered.com";

const STEAM_GAME_APP_IDS: Record<string, number> = {
  CS2: 730,
  DOTA2: 570,
  TF2: 440,
  RUST: 252490,
};

const INVENTORY_CACHE_TTL = 3 * 60 * 1000;

interface CachedInventory {
  items: ReturnType<typeof parseInventoryItems>;
  error: "inventory_private" | "rate_limited" | "fetch_failed" | null;
  timestamp: number;
}

const inventoryCache = new Map<string, CachedInventory>();

function cleanupInventoryCache() {
  const now = Date.now();
  for (const [key, entry] of inventoryCache) {
    if (now - entry.timestamp > INVENTORY_CACHE_TTL * 2) {
      inventoryCache.delete(key);
    }
  }
}

setInterval(cleanupInventoryCache, 60_000).unref?.();

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

const STEAMAPIS_KEYS_BY_APPID: Record<number, string> = {
  730: "STEAMAPIS_KEY",
  570: "STEAMAPIS_KEY_DOTA2",
  440: "STEAMAPIS_KEY_TF2",
  252490: "STEAMAPIS_KEY_RUST",
};

async function fetchViaSteamApis(
  steamId: string,
  appId: number,
): Promise<{ data: Record<string, unknown> | null; error: string | null }> {
  const envKey = STEAMAPIS_KEYS_BY_APPID[appId] ?? "STEAMAPIS_KEY";
  const apiKey = process.env[envKey] || process.env.STEAMAPIS_KEY;
  if (!apiKey) return { data: null, error: "no_key" };

  const url = `https://api.steamapis.com/steam/inventory/${steamId}/${appId}/2?api_key=${apiKey}`;
  const t = Date.now();

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 20000);
    const res = await fetch(url, {
      signal: controller.signal,
      cache: "no-store",
    });
    clearTimeout(timeout);

    if (res.status === 403) return { data: null, error: "inventory_private" };
    if (!res.ok) return { data: null, error: `api_error_${res.status}` };

    const data = await res.json();
    return { data, error: null };
  } catch (e) {
    console.error(`[steam] SteamApis error:`, e instanceof Error ? e.message : e);
    return { data: null, error: "fetch_failed" };
  }
}

async function fetchViaSteamDirect(
  steamId: string,
  appId: number,
): Promise<{ data: Record<string, unknown> | null; error: string | null }> {
  const MAX_RETRIES = 2;
  const RETRY_DELAYS = [3000, 8000];

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    try {
      const url = `https://steamcommunity.com/inventory/${steamId}/${appId}/2?l=english&count=5000`;
      const t = Date.now();
      const res = await fetch(url, {
        headers: {
          "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
          "Accept-Language": "en-US,en;q=0.9",
          "Referer": "https://steamcommunity.com/",
          "Sec-Fetch-Dest": "document",
          "Sec-Fetch-Mode": "navigate",
          "Sec-Fetch-Site": "same-origin",
        },
        signal: controller.signal,
        cache: "no-store",
      });
      clearTimeout(timeout);

      if (res.status === 403) return { data: null, error: "inventory_private" };
      if (res.status === 429 || res.status === 400) {
        if (attempt < MAX_RETRIES - 1) {
          await new Promise((r) => setTimeout(r, RETRY_DELAYS[attempt]));
          continue;
        }
        return { data: null, error: "rate_limited" };
      }
      if (!res.ok) {
        if (attempt < MAX_RETRIES - 1) {
          await new Promise((r) => setTimeout(r, RETRY_DELAYS[attempt]));
          continue;
        }
        return { data: null, error: "fetch_failed" };
      }

      const data = await res.json();
      return { data, error: null };
    } catch (e) {
      clearTimeout(timeout);
      if (attempt < MAX_RETRIES - 1) {
        await new Promise((r) => setTimeout(r, RETRY_DELAYS[attempt]));
        continue;
      }
      return { data: null, error: "fetch_failed" };
    }
  }
  return { data: null, error: "fetch_failed" };
}

type SteamTag = { category: string; localized_tag_name: string };

function parseInventoryItems(data: Record<string, unknown>) {
  if (!data.descriptions || !data.assets) {
    return [];
  }

  const descriptionsMap = new Map<string, Record<string, unknown>>();
  for (const desc of data.descriptions as Record<string, unknown>[]) {
    descriptionsMap.set(`${desc.classid}_${desc.instanceid}`, desc);
  }

  return (data.assets as Record<string, string>[])
    .map((asset) => {
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
    .filter((item) => item.tradable);
}

export async function getSteamInventory(
  steamId: string,
  game: keyof typeof STEAM_GAME_APP_IDS,
) {
  const appId = STEAM_GAME_APP_IDS[game];
  if (!appId) throw new Error(`Unknown game: ${game}`);

  const cacheKey = `${steamId}:${appId}`;
  const cached = inventoryCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < INVENTORY_CACHE_TTL) {
    return { items: cached.items, error: cached.error };
  }

  let result = await fetchViaSteamApis(steamId, appId);

  if (result.error === "no_key" || result.error === "fetch_failed") {
    result = await fetchViaSteamDirect(steamId, appId);
  }

  if (result.error === "inventory_private") {
    inventoryCache.set(cacheKey, { items: [], error: "inventory_private", timestamp: Date.now() });
    return { items: [], error: "inventory_private" as const };
  }
  if (result.error === "rate_limited") {
    return { items: [], error: "rate_limited" as const };
  }
  if (result.error || !result.data) {
    return { items: [], error: "fetch_failed" as const };
  }

  const items = parseInventoryItems(result.data);

  inventoryCache.set(cacheKey, { items, error: null, timestamp: Date.now() });
  return { items, error: null };
}

function extractCondition(name?: string): string | null {
  if (!name) return null;
  const match = name.match(
    /\((Factory New|Minimal Wear|Field-Tested|Well-Worn|Battle-Scarred)\)/,
  );
  return match ? match[1] : null;
}
