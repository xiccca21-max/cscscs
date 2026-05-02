import { detectCs2PhaseFromIconUrl } from "./csPhase";

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
  if (!text.includes("is_valid:true")) {
    console.error(
      "[steam] OpenID check_authentication failed, body head:",
      text.slice(0, 600).replace(/\s+/g, " "),
    );
    return null;
  }

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
  if (!res.ok) {
    console.error("[steam] GetPlayerSummaries HTTP", res.status, await res.text().then((t) => t.slice(0, 300)));
    return null;
  }
  const data = await res.json();
  const player = data?.response?.players?.[0];
  if (!player) {
    console.error("[steam] GetPlayerSummaries empty players", steamId, JSON.stringify(data).slice(0, 400));
    return null;
  }

  return {
    steamId: player.steamid as string,
    personaName: player.personaname as string,
    avatar: player.avatarfull as string,
    profileUrl: player.profileurl as string,
  };
}

async function fetchViaSteamApis(
  steamId: string,
  appId: number,
): Promise<{ data: Record<string, unknown> | null; error: string | null }> {
  const apiKey = process.env.STEAMAPIS_KEY?.trim();
  if (!apiKey) return { data: null, error: "no_key" };

  const urls = [
    `https://api.steamapis.com/v2/steam/users/${steamId}/inventory/${appId}/2`,
    `https://api.steamapis.com/steam/inventory/${steamId}/${appId}/2?api_key=${encodeURIComponent(apiKey)}`,
  ];

  for (const [idx, url] of urls.entries()) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 20000);
      const res = await fetch(url, {
        signal: controller.signal,
        cache: "no-store",
        headers: idx === 0 ? { "x-api-key": apiKey } : undefined,
      });
      clearTimeout(timeout);

      const body = (await res.json().catch(() => null)) as
        | Record<string, unknown>
        | null;

      if (res.status === 403) return { data: null, error: "inventory_private" };
      if (!res.ok) {
        console.error(
          `[steam] SteamApis HTTP ${res.status} for app ${appId}. body=${JSON.stringify(body).slice(0, 500)}`,
        );
        continue;
      }

      const successRaw = body?.success;
      const hasExplicitFailure = successRaw === false || successRaw === 0;
      if (hasExplicitFailure) {
        console.error(
          `[steam] SteamApis payload failure for app ${appId}. body=${JSON.stringify(body).slice(0, 500)}`,
        );
        return { data: null, error: "fetch_failed" };
      }

      const payload = ((body?.result as Record<string, unknown> | undefined) ??
        body) as Record<string, unknown> | null;
      const assets = payload?.assets;
      const descriptions = payload?.descriptions;
      if (!Array.isArray(assets) || !Array.isArray(descriptions)) {
        console.error(
          `[steam] SteamApis malformed payload for app ${appId}. body=${JSON.stringify(body).slice(0, 500)}`,
        );
        return { data: null, error: "fetch_failed" };
      }

      return { data: payload, error: null };
    } catch (e) {
      console.error(
        `[steam] SteamApis fetch error for app ${appId}:`,
        e instanceof Error ? e.message : e,
      );
    }
  }

  return { data: null, error: "fetch_failed" };
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

function toKeyPart(value: unknown): string {
  if (value === null || value === undefined) return "";
  return String(value);
}

function isTradableValue(value: unknown): boolean {
  if (value === 1 || value === "1" || value === true) return true;
  return false;
}

function parseInventoryItems(
  data: Record<string, unknown>,
  game: keyof typeof STEAM_GAME_APP_IDS,
) {
  if (!data.descriptions || !data.assets) {
    return [];
  }

  const descriptionsMap = new Map<string, Record<string, unknown>>();
  for (const desc of data.descriptions as Record<string, unknown>[]) {
    const classId = toKeyPart(desc.classid);
    const instanceId = toKeyPart(desc.instanceid);
    descriptionsMap.set(`${classId}_${instanceId}`, desc);
  }

  const parsed = (data.assets as Record<string, unknown>[])
    .map((asset) => {
      const classId = toKeyPart(asset.classid);
      const instanceId = toKeyPart(asset.instanceid);
      const desc = descriptionsMap.get(`${classId}_${instanceId}`) as
        | Record<string, unknown>
        | undefined;
      const iconPath = desc?.icon_url as string | undefined;
      const fullIconUrl = iconPath
        ? `https://steamcommunity-a.akamaihd.net/economy/image/${iconPath}`
        : null;
      return {
        assetId: toKeyPart(asset.assetid),
        classId,
        instanceId,
        name:
          (desc?.market_hash_name as string) ||
          (desc?.name as string) ||
          "Unknown",
        iconUrl: fullIconUrl,
        phase:
          game === "CS2" ? detectCs2PhaseFromIconUrl(fullIconUrl) : null,
        tradable: isTradableValue(desc?.tradable),
        condition: extractCondition(desc?.market_hash_name as string),
        quality: (desc?.tags as SteamTag[] | undefined)?.find(
          (t) => t.category === "Quality",
        )?.localized_tag_name ?? null,
      };
    })
    .filter((item) => item.tradable);

  if (parsed.length === 0 && (data.assets as unknown[]).length > 0) {
    const sample = (data.descriptions as Record<string, unknown>[])
      .slice(0, 10)
      .map((d) => d.tradable);
    console.warn(
      `[steam] Parsed 0 tradable items for ${game}. assets=${(data.assets as unknown[]).length}, descriptions=${(data.descriptions as unknown[]).length}, sample tradable values=${JSON.stringify(sample)}`,
    );
  }

  return parsed;
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

  const items = parseInventoryItems(result.data, game);

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
