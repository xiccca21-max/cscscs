import { db } from "./db";
import type { Game } from "@prisma/client";

const TM_PRICES_URL = "https://market.csgo.com/api/v2/prices/USD.json";
const CACHE_TTL = 10 * 60 * 1000;

export interface ItemPrice {
  externalId: string;
  name: string;
  basePrice: number;
  buyoutPrice: number;
  currency: string;
  available: boolean;
}

let tmPriceCache: Map<string, number> | null = null;
let tmCacheTimestamp = 0;

async function loadTmPrices(): Promise<Map<string, number>> {
  if (tmPriceCache && Date.now() - tmCacheTimestamp < CACHE_TTL) {
    return tmPriceCache;
  }

  try {
    const res = await fetch(TM_PRICES_URL, { cache: "no-store" });
    if (!res.ok) throw new Error(`TM API ${res.status}`);
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
    tmPriceCache = map;
    tmCacheTimestamp = Date.now();
    return map;
  } catch {
    return tmPriceCache ?? new Map();
  }
}

interface PricingRuleRow {
  game: Game | null;
  itemExternalId: string | null;
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
      ],
    });
  } catch {
    return [];
  }
}

function applyRulesInMemory(
  basePrice: number,
  itemName: string,
  game: Game,
  allRules: PricingRuleRow[],
): { price: number; excluded: boolean } {
  let price = basePrice;
  let excluded = false;

  for (const rule of allRules) {
    const matchesGlobal = rule.game === null && rule.itemExternalId === null;
    const matchesGame = rule.game === game && rule.itemExternalId === null;
    const matchesItem = rule.itemExternalId === itemName;

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
  items: { name: string; game: Game }[],
): Promise<Map<string, ItemPrice>> {
  const priceMap = new Map<string, ItemPrice>();
  if (items.length === 0) return priceMap;

  const game = items[0].game;
  const t0 = Date.now();

  let tmPrices: Map<string, number>;
  let allRules: PricingRuleRow[] = [];

  try {
    const results = await Promise.allSettled([
      loadTmPrices(),
      loadAllPricingRules(game, items.map((i) => i.name)),
    ]);

    tmPrices = results[0].status === "fulfilled" ? results[0].value : new Map();
    allRules = results[1].status === "fulfilled" ? results[1].value : [];

    if (results[0].status === "rejected") console.error(`[pricing] TM load failed:`, results[0].reason);
    if (results[1].status === "rejected") console.error(`[pricing] Rules load failed:`, results[1].reason);
  } catch (e) {
    console.error(`[pricing] Init failed:`, e);
    tmPrices = new Map();
  }

  console.log(`[pricing] TM+rules loaded in ${Date.now() - t0}ms, tm=${tmPrices.size}, rules=${allRules.length}`);

  const DEFAULT_BUYOUT_RATE = 0.92;

  for (const item of items) {
    try {
      const tmPrice = tmPrices.get(item.name);
      if (tmPrice && tmPrice > 0) {
        let buyout = tmPrice * DEFAULT_BUYOUT_RATE;
        if (allRules.length > 0) {
          const adjusted = applyRulesInMemory(tmPrice, item.name, item.game, allRules);
          buyout = adjusted.price;
          if (adjusted.excluded) continue;
        }
        priceMap.set(item.name, {
          externalId: item.name,
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

  console.log(`[pricing] TM matched ${priceMap.size}/${items.length} in ${Date.now() - t0}ms`);
  return priceMap;
}
