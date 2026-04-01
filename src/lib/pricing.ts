import { db } from "./db";
import type { Game } from "@prisma/client";
import { normalizePricingPhase } from "./pricingPhases";

const TM_PRICES_URLS: Record<Game, string> = {
  CS2: "https://market.csgo.com/api/v2/prices/USD.json",
  DOTA2: "https://market.dota2.net/api/v2/prices/USD.json",
  TF2: "https://tf2.tm/api/v2/prices/USD.json",
  RUST: "https://rust.tm/api/v2/prices/USD.json",
};
const CACHE_TTL = 10 * 60 * 1000;

export interface ItemPrice {
  externalId: string;
  name: string;
  basePrice: number;
  buyoutPrice: number;
  currency: string;
  available: boolean;
}

export type BulkPriceInput = {
  id: string;
  name: string;
  game: Game;
  phase?: string | null;
};

const tmPriceCaches = new Map<Game, { map: Map<string, number>; ts: number }>();

async function loadTmPrices(game: Game): Promise<Map<string, number>> {
  const cached = tmPriceCaches.get(game);
  if (cached && Date.now() - cached.ts < CACHE_TTL) {
    return cached.map;
  }

  const url = TM_PRICES_URLS[game];
  try {
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) throw new Error(`TM API ${res.status} for ${game}`);
    const data = await res.json();
    const map = new Map<string, number>();
    if (Array.isArray(data?.items)) {
      for (const item of data.items) {
        const price = parseFloat(item.price);
        if (price > 0) {
          map.set(item.market_hash_name, price);
        }
      }
    }
    tmPriceCaches.set(game, { map, ts: Date.now() });
    return map;
  } catch {
    return cached?.map ?? new Map();
  }
}

export async function searchTmMarketHashNames(
  game: Game,
  query: string,
  limit = 150,
): Promise<string[]> {
  const map = await loadTmPrices(game);
  const keys = [...map.keys()];
  const q = query.trim().toLowerCase();
  const filtered = q
    ? keys.filter((k) => k.toLowerCase().includes(q))
    : keys;
  filtered.sort((a, b) => a.localeCompare(b));
  return filtered.slice(0, limit);
}

interface PricingRuleRow {
  game: Game | null;
  itemExternalId: string | null;
  phase: string | null;
  adjustmentType: string;
  adjustmentValue: unknown;
  isExcluded: boolean;
}

async function loadAllPricingRules(
  game: Game,
  itemNames: string[],
): Promise<PricingRuleRow[]> {
  if (itemNames.length === 0) return [];
  try {
    return await db.pricingRule.findMany({
      where: {
        OR: [
          { game: null, itemExternalId: null },
          { game, itemExternalId: null },
          { itemExternalId: { in: itemNames } },
        ],
      },
      orderBy: [
        { game: { sort: "asc", nulls: "first" } },
        { itemExternalId: { sort: "asc", nulls: "first" } },
        { phase: { sort: "asc", nulls: "first" } },
      ],
    });
  } catch {
    return [];
  }
}

function ruleMatchesItem(
  rule: PricingRuleRow,
  itemName: string,
  itemPhaseNorm: string | null,
): boolean {
  if (rule.itemExternalId !== itemName) return false;
  const rulePhaseNorm = normalizePricingPhase(rule.phase);
  if (rulePhaseNorm === null) return true;
  return itemPhaseNorm !== null && itemPhaseNorm === rulePhaseNorm;
}

function applyRulesInMemory(
  basePrice: number,
  itemName: string,
  game: Game,
  itemPhase: string | null,
  allRules: PricingRuleRow[],
): { price: number; excluded: boolean } {
  let price = basePrice;
  let excluded = false;
  const itemPhaseNorm = normalizePricingPhase(itemPhase);

  for (const rule of allRules) {
    const matchesGlobal = rule.game === null && rule.itemExternalId === null;
    const matchesGame = rule.game === game && rule.itemExternalId === null;
    const matchesItem = ruleMatchesItem(rule, itemName, itemPhaseNorm);

    if (!matchesGlobal && !matchesGame && !matchesItem) continue;

    if (rule.isExcluded) {
      excluded = true;
      continue;
    }
    const value = Number(rule.adjustmentValue);
    if (rule.adjustmentType === "percentage") {
      price = price * (1 + value / 100);
    } else {
      price = price + value;
    }
  }

  return { price: Math.max(0, Math.round(price * 100) / 100), excluded };
}

export async function getBulkPrices(
  items: BulkPriceInput[],
): Promise<Map<string, ItemPrice>> {
  const priceMap = new Map<string, ItemPrice>();
  if (items.length === 0) return priceMap;

  const game = items[0].game;

  let tmPrices: Map<string, number>;
  let allRules: PricingRuleRow[] = [];

  const uniqueNames = [...new Set(items.map((i) => i.name))];

  try {
    const results = await Promise.allSettled([
      loadTmPrices(game),
      loadAllPricingRules(game, uniqueNames),
    ]);

    tmPrices = results[0].status === "fulfilled" ? results[0].value : new Map();
    allRules = results[1].status === "fulfilled" ? results[1].value : [];

    if (results[0].status === "rejected") console.error(`[pricing] TM load failed:`, results[0].reason);
    if (results[1].status === "rejected") console.error(`[pricing] Rules load failed:`, results[1].reason);
  } catch (e) {
    console.error(`[pricing] Init failed:`, e);
    tmPrices = new Map();
  }

  const DEFAULT_BUYOUT_RATE = 0.92;

  for (const item of items) {
    try {
      const tmPrice = tmPrices.get(item.name);
      if (tmPrice && tmPrice > 0) {
        let buyout = tmPrice * DEFAULT_BUYOUT_RATE;
        if (allRules.length > 0) {
          const adjusted = applyRulesInMemory(
            tmPrice,
            item.name,
            item.game,
            item.phase ?? null,
            allRules,
          );
          buyout = adjusted.price;
          if (adjusted.excluded) continue;
        }
        priceMap.set(item.id, {
          externalId: item.id,
          name: item.name,
          basePrice: tmPrice,
          buyoutPrice: Math.round(buyout * 100) / 100,
          currency: "USD",
          available: true,
        });
      }
    } catch (e) {
      console.error(`[pricing] Error pricing ${item.name}:`, e);
    }
  }

  return priceMap;
}
