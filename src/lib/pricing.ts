import { db } from "./db";
import type { Game } from "@prisma/client";

const TM_API_BASE = "https://market.csgo.com/api/v2";

export interface ItemPrice {
  externalId: string;
  name: string;
  basePrice: number;
  buyoutPrice: number;
  currency: string;
  available: boolean;
}

export async function getItemPrice(
  marketHashName: string,
  game: Game,
): Promise<ItemPrice | null> {
  const apiKey = process.env.TM_MARKET_API_KEY;
  if (!apiKey) throw new Error("TM_MARKET_API_KEY is not configured");

  try {
    const encoded = encodeURIComponent(marketHashName);
    const res = await fetch(
      `${TM_API_BASE}/prices/class_instance/${encoded}?key=${apiKey}`,
      { next: { revalidate: 300 } },
    );
    if (!res.ok) return null;

    const data = await res.json();
    const price = parseFloat(data?.data?.price || "0");
    if (price <= 0) return null;

    const adjusted = await applyPricingRules(marketHashName, game, price);

    return {
      externalId: marketHashName,
      name: marketHashName,
      basePrice: price,
      buyoutPrice: adjusted.price,
      currency: "USD",
      available: !adjusted.excluded,
    };
  } catch {
    return null;
  }
}

async function applyPricingRules(
  itemName: string,
  game: Game,
  basePrice: number,
): Promise<{ price: number; excluded: boolean }> {
  const rules = await db.pricingRule.findMany({
    where: {
      OR: [
        { game: null, itemExternalId: null },
        { game, itemExternalId: null },
        { itemExternalId: itemName },
      ],
    },
    orderBy: [
      { game: { sort: "asc", nulls: "first" } },
      { itemExternalId: { sort: "asc", nulls: "first" } },
    ],
  });

  let price = basePrice;
  let excluded = false;

  for (const rule of rules) {
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
  const results = await Promise.allSettled(
    items.map((item) => getItemPrice(item.name, item.game)),
  );
  results.forEach((result, i) => {
    if (result.status === "fulfilled" && result.value) {
      priceMap.set(items[i].name, result.value);
    }
  });
  return priceMap;
}
