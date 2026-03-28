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

const MOCK_CS2_ITEMS = [
  { name: "AK-47 | Redline", weapon: "AK-47", skinName: "Redline", wear: "Field-Tested", wearShort: "FT", float: 0.21, price: 12.50, rarity: "#d32ce6", image: "https://community.steamstatic.com/economy/image/-9a81dlWLwJ2UXnSI5fOlMRdXOzjkh5HMhHiCpEOcF58gfbcDkNtfIpStkifEg7vSuKMIzRQ0s6BuUIWEBSQOH2m4echVx1OARH4v2gKgxu0PvMyKkCkIW0xNeCz6KhYu2AxzgFuZd337GXrN6g2wa_80I_YGimJYPEdwY3YVHZ_wO5w-i805e06Z7AzXIx6HYq7WGdwUJTMbKxxA" },
  { name: "AWP | Asiimov", weapon: "AWP", skinName: "Asiimov", wear: "Field-Tested", wearShort: "FT", float: 0.28, price: 32.00, rarity: "#d32ce6", image: "https://community.steamstatic.com/economy/image/-9a81dlWLwJ2UXnSI5fOlMRdXOzjkh5HMhHiCpEOcF58gfbcDkNtfIpStkifEg7vCuJ2WxTw_g9BBAODuXEAfTih6tCh1Bpbop4v63wFlY07ObcTjlH7du6kb-YlvD1PYTTl2VQ58hOhuDH8d-hixDi_UM4YGv2ctOSJgY3N1iG5BLplde605K1ot2XnHVmuGB27XaLnQv330-tOKWzxA" },
  { name: "M4A4 | Howl", weapon: "M4A4", skinName: "Howl", wear: "Minimal Wear", wearShort: "MW", float: 0.09, price: 4200.00, rarity: "#eb4b4b", image: "https://community.steamstatic.com/economy/image/-9a81dlWLwJ2UXnSI5fOlMRdXOzjkh5HMhHiCpEOcF58gfbcDkNtfIpStkifEg7vSuJ3mxTjPQPcFBaBx1bSl-C3MHEp2R3IgRm5ODaOQZu1MzEcC9F6eOxkYGbz6OtZe2Jx28AucAm0uvFpI721QDh_0NrZm37LI6SdwQ5fxiO8gOe5lO26gJfuup_KzyRr7CIltyrDnhS1hBtSLrs4LmrS1dU" },
  { name: "USP-S | Kill Confirmed", weapon: "USP-S", skinName: "Kill Confirmed", wear: "Factory New", wearShort: "FN", float: 0.03, price: 85.00, rarity: "#d32ce6", image: "https://community.steamstatic.com/economy/image/-9a81dlWLwJ2UXnSI5fOlMRdXOzjkh5HMhHiCpEOcF58gfbcDkNtfIpStkifEg7vSuJzx9QjcJ_BhOSLf7ZSliimOHHQFx1JgdYubulKlpn1r2adz0b7oW1xteIw6OhMOiHkmpD7cFo37yYotqlilC3_kVtZj3zJ4DCdQ8_YVnT_VK_xunu0cDpvsvLnSdkvCgltCzDyhSwhxpSLrs4YufB1pY" },
  { name: "Glock-18 | Fade", weapon: "Glock-18", skinName: "Fade", wear: "Factory New", wearShort: "FN", float: 0.01, price: 620.00, rarity: "#eb4b4b", image: "https://community.steamstatic.com/economy/image/-9a81dlWLwJ2UXnSI5fOlMRdXOzjkh5HMhHiCpEOcF58gfbcDkNtfIpStkifEg7vSuLzxZTQecdcl5bA0peVOG_wcbQVmN5OAdatYulKgZu1fD3djFN7dC1kteIkqTxMLrfkmJB7fp9j_2Zrd2g3wa3_UdtZ2v7dtSVJwZsY17T-Va-l-vr1JLt7p_BwHdlpGB27SvZzRbm0B4daOdxxavbMic20KMGbQ" },
  { name: "Desert Eagle | Blaze", weapon: "Desert Eagle", skinName: "Blaze", wear: "Factory New", wearShort: "FN", float: 0.008, price: 380.00, rarity: "#eb4b4b", image: "https://community.steamstatic.com/economy/image/-9a81dlWLwJ2UXnSI5fOlMRdXOzjkh5HMhHiCpEOcF58gfbcDkNtfIpStkifEg7vSuJ1x5Uw_g9BBAODuXEAfTih6tCh1BpZ-Jx4v23eFRg06r3dDBAuI3ukYaKhfX9DLbUhFRd4cByi7mWoYig2FDl-0ZtMG_2cIKQdlRvMFnUqQO5w-bs1JG1v5_IySYx6XIj5CzYkBOxgR9SOeFwxavbMhGa_3Yc" },
  { name: "AK-47 | Fire Serpent", weapon: "AK-47", skinName: "Fire Serpent", wear: "Minimal Wear", wearShort: "MW", float: 0.12, price: 780.00, rarity: "#d32ce6", image: "https://community.steamstatic.com/economy/image/-9a81dlWLwJ2UXnSI5fOlMRdXOzjkh5HMhHiCpEOcF58gfbcDkNtfIpStkifEg7vSuJ1x5Xw_g9BBAODu3EAfTih6tCh1BpZ-Jx4v23eFVs0urfcjBO49_hkdSIxPOhMLuIx2tf6sp3j-yY8Y6j0RqxoEFqYzzwS9bAdgM6ZlmG-Fblwu-80MCuv8nMy3ZhvSEn5XyIlwv330-vKa3kmQ" },
  { name: "Knife | Doppler", weapon: "Karambit", skinName: "Doppler Phase 2", wear: "Factory New", wearShort: "FN", float: 0.02, price: 1450.00, rarity: "#e4ae39", image: "https://community.steamstatic.com/economy/image/-9a81dlWLwJ2UXnSI5fOlMRdXOzjkh5HMhHiCpEOcF58gfbcDkNtfIpStkifEg7vSuJzx1MjcDnA4ORQ0oXU-W_3MHcRj1La1Js5ORcIw9h3P_NYjBD09m7hJSOzfu0YemJlz0I6sEgibiTpIj32g3h-ENkMG7wcICQIFJqMFvV_1jqxem71Z61v8-bnXBkuSEgsSnYyhSygR9SLrs4p-KFxxg" },
  { name: "M4A1-S | Hyper Beast", weapon: "M4A1-S", skinName: "Hyper Beast", wear: "Field-Tested", wearShort: "FT", float: 0.19, price: 18.50, rarity: "#d32ce6", image: "https://community.steamstatic.com/economy/image/-9a81dlWLwJ2UXnSI5fOlMRdXOzjkh5HMhHiCpEOcF58gfbcDkNtfIpStkifEg7vSuJ1x5XwPQ9BBAODu7LBN60h6LCWFJ5KgFo5Kb3e1Y07aKczIBua-2kYSZkfXxIYTck29Y_cBOhuzFo96h3gTl-kU_am73dtOSdQ87NlyC9gPvtlJS5p5K9v5SfnHMyuCcj7SrRmBLk0xlXarc-JQ" },
  { name: "AWP | Dragon Lore", weapon: "AWP", skinName: "Dragon Lore", wear: "Battle-Scarred", wearShort: "BS", float: 0.52, price: 2800.00, rarity: "#e4ae39", image: "https://community.steamstatic.com/economy/image/-9a81dlWLwJ2UXnSI5fOlMRdXOzjkh5HMhHiCpEOcF58gfbcDkNtfIpStkifEg7vSuJzx9MjcDnA4ORQ0oXU-W_3MHcRj1La1Js5ORcIw9h3P_NYjBD09C7hJSOzfu0Y-iFlz0G6sAl2LjCpYqs3AXt_BBtZm-hI4OLMlhpM1zX8we_kOy71ZW_uJrKz3BhvyMm4XqPlxTigBwcaLI_hqSAHELXOo0m9w" },
  { name: "P250 | Asiimov", weapon: "P250", skinName: "Asiimov", wear: "Field-Tested", wearShort: "FT", float: 0.30, price: 4.20, rarity: "#8847ff", image: "https://community.steamstatic.com/economy/image/-9a81dlWLwJ2UXnSI5fOlMRdXOzjkh5HMhHiCpEOcF58gfbcDkNtfIpStkifEg7vSuJlxdUEMOCOnxXdV_fV-W_3MbGRm99JQVYubekOQZu0aaLIjgSuIrjzdnakfKkMrqGz24G7cYh2r2Ro9qt0Q2x80c5ZmChLYDAIA9tZlzS-AC9wr2505a06cvNziRguHIl4H-LnECyhkpNaeQ_l6HNP8eMfg" },
  { name: "AK-47 | Vulcan", weapon: "AK-47", skinName: "Vulcan", wear: "Minimal Wear", wearShort: "MW", float: 0.10, price: 28.00, rarity: "#d32ce6", image: "https://community.steamstatic.com/economy/image/-9a81dlWLwJ2UXnSI5fOlMRdXOzjkh5HMhHiCpEOcF58gfbcDkNtfIpStkifEg7vSuJ1x5Uw_g9BBAODuXEAfTih6tCh1BpZ-Jx4v23eFRg0v2DNjdb7dKykdeKk_SgYb-BwjsJvMRyr72SrY-h31Xt_UBkZ27xJ4aXelBvYQ3Y-VC_w-i71sS66s_Mzndm7ScisyzblxTm1hxSLrs4p-KFxxg" },
  { name: "Butterfly Knife | Fade", weapon: "Butterfly Knife", skinName: "Fade", wear: "Factory New", wearShort: "FN", float: 0.01, price: 2100.00, rarity: "#e4ae39", image: "https://community.steamstatic.com/economy/image/-9a81dlWLwJ2UXnSI5fOlMRdXOzjkh5HMhHiCpEOcF58gfbcDkNtfIpStkifEg7vSuJzx1MjcDnA4ORQ0oXU-W_3MHcRj1La1Js5ORcIw9h3P_NYjBD09m7hJSOzfukYeiFxGpS7Ztjj7CYpI6h2gTi-UE-Zm_wdI-XIA48N1CG8FG4yO3shcDo78nPznMyuSci5XnZnxbigExKaeI_lqSAHB_edqtP7bE" },
  { name: "Operation Breakout Weapon Case", weapon: "", skinName: "Operation Breakout Weapon Case", wear: "", wearShort: "", float: 0, price: 7.28, rarity: "#6496e1", image: "https://community.steamstatic.com/economy/image/-9a81dlWLwJ2UXnSI5fOlMRdXOzjkh5HMhHiCpEOcF58gfbcDkNtfIpStkifEg7vSuJ0x9SgYhYlpSu-CrOHkvCoO-aQA9PKBZ5v73YelU2066dKjhG7NC1kNOOwfOmNrnHkDIIu8By3bjAodmk2Qfk_RBuamjwJ4HEdwY7aF3U-AW2lLzphce4upOYyCc26Sgj5mGdwUIkSYdMCQ" },
  { name: "Chroma 2 Case", weapon: "", skinName: "Chroma 2 Case", wear: "", wearShort: "", float: 0, price: 3.35, rarity: "#6496e1", image: "https://community.steamstatic.com/economy/image/-9a81dlWLwJ2UXnSI5fOlMRdXOzjkh5HMhHiCpEOcF58gfbcDkNtfIpStkifEg7vSuJ0x9SgYhYlpSu-CrOHkvCoO-aQA9PKBZ5v73YelU2066dKjhG7Niyk9bbwPOmNbnHkDIIu8ByiLiYpNyg3AHs-0dsZGr1J4ORdAA7aFjV_FLqkL251JK4v53ByXIw6yIm5WGIZ0LL1mlDjw" },
  { name: "P2000 | Imperial", weapon: "P2000", skinName: "Imperial", wear: "Normal", wearShort: "", float: 0, price: 4.10, rarity: "#8847ff", image: "https://community.steamstatic.com/economy/image/-9a81dlWLwJ2UXnSI5fOlMRdXOzjkh5HMhHiCpEOcF58gfbcDkNtfIpStkifEg7vSuJzx9QjcJ_BhOSLf7ZSliimOHHQFx1Nwdb5rG3FAFk3P_NdjhU6IjlxtbawKOmY7-HxW4Gu50gjruU89qg2wDi-UZoMW36IoSRdgY5MlzV-Vi-kOi6h5S_u8_Iy3IwvnZ04GGdwUI83I_8Ig" },
  { name: "Operation Wildfire Case", weapon: "", skinName: "Operation Wildfire Case", wear: "", wearShort: "", float: 0, price: 3.45, rarity: "#6496e1", image: "https://community.steamstatic.com/economy/image/-9a81dlWLwJ2UXnSI5fOlMRdXOzjkh5HMhHiCpEOcF58gfbcDkNtfIpStkifEg7vSuJ0x9SgYhYlpSu-CrOHkvCoO-aQA9PKBZ5v73YelU2066dKjhG7Ni1k9DbwfKkN7jXkDIEvscg07-Xrdi3ilHl_0tsZmj2JdPAcFJqaVzY_QK5yOi8jJC4vp-bnHVruCkh7SqJnEGx1R4ca7dvxqSEH_CedxEi8g" },
  { name: "Chroma 3 Case", weapon: "", skinName: "Chroma 3 Case", wear: "", wearShort: "", float: 0, price: 2.90, rarity: "#6496e1", image: "https://community.steamstatic.com/economy/image/-9a81dlWLwJ2UXnSI5fOlMRdXOzjkh5HMhHiCpEOcF58gfbcDkNtfIpStkifEg7vSuJ0x9SgYhYlpSu-CrOHkvCoO-aQA9PKBZ5v73YelU2066dKjhG7NC1kNOOwfOmNrnHkDIIu8By2OjHot6t3FDi-kRkZmjwLI_BdVU-YQ6D_lW5w7-7jcXu7sjJzCNm6yQh7CyOzxKy1htSLrs4HOy30Q" },
  { name: "M4A4 | Neo-Noir", weapon: "M4A4", skinName: "Neo-Noir", wear: "Factory New", wearShort: "FN", float: 0.04, price: 45.00, rarity: "#d32ce6", image: "https://community.steamstatic.com/economy/image/-9a81dlWLwJ2UXnSI5fOlMRdXOzjkh5HMhHiCpEOcF58gfbcDkNtfIpStkifEg7vSuJlx9ajt5Rw_kzBh-QQP7n0t_CQFJ9Jgdo5Or3e1Y07aKczIBua-2kYaOhfX9DLbUhFRd4cByi7mWoYig2FDl-kU_am73cIeVdlRvMVnUqQO5w-bs1JG1v5_IySYx6XIj5CzYkBOxgR9SOeFwxavbMhGa_3Yc" },
  { name: "AK-47 | Neon Rider", weapon: "AK-47", skinName: "Neon Rider", wear: "Minimal Wear", wearShort: "MW", float: 0.11, price: 38.00, rarity: "#d32ce6", image: "https://community.steamstatic.com/economy/image/-9a81dlWLwJ2UXnSI5fOlMRdXOzjkh5HMhHiCpEOcF58gfbcDkNtfIpStkifEg7vSuJ1x5Uw_g9BBAODuXEAfTih6tCh1BpZ-Jx4v23eFRh1_OJdjNBuYS3xtfcwKenN7iGxDkBucZ03rnEo9_231Dl_UM4YG-nd4fGcVRrM1jU-FbplefsgMTt7M_IzCBi7Scg5GGdwUI-5yh2Fw" },
  { name: "AWP | Fade", weapon: "AWP", skinName: "Fade", wear: "Factory New", wearShort: "FN", float: 0.02, price: 1100.00, rarity: "#eb4b4b", image: "https://community.steamstatic.com/economy/image/-9a81dlWLwJ2UXnSI5fOlMRdXOzjkh5HMhHiCpEOcF58gfbcDkNtfIpStkifEg7vCuJ1x5Xw_g9BBAODuXLBd-3xdiCEFp5OgVo4q-hKlVf08qaczlOIGVx9jcxfKkZL6HxDsBuJZ00LuSrI6njBqxpHJ8IGH2c-WLMwI5f1yG8FPskOy-h5a7v5vOnXBiuCx24CrelEepyhBRa-c-hPDe1pZPAJkP" },
];

const MOCK_DOTA2_ITEMS = [
  { name: "Dragonclaw Hook", weapon: "Pudge", skinName: "Dragonclaw Hook", wear: "", wearShort: "", float: 0, price: 750.00, rarity: "#e4ae39", image: "https://community.steamstatic.com/economy/image/-9a81dlWLwJ2UXnSI5fOlMRdXOzjkh5HMhHiCpEOcF58gfbcDkNtfIpStkifEg7vSuJlx9YjsYmvRRSHrbeSl_j3spcUBNlHxRksqqeFZhXo7OdcThH_xCmsYy0mvX7YeKIwD8IuJdy07jFp4ii3g3t-0ZvZT-nLNOSdlI7YwnW-Ve2wOjshce_vc-ay3Bh6yUp4nvUzBLm0xofaLZvxqOcG0OVJLgzkQ" },
  { name: "Genuine Perceptions of the Eternal Mind", weapon: "Phantom Assassin", skinName: "Perceptions of the Eternal Mind", wear: "", wearShort: "", float: 0, price: 25.00, rarity: "#d32ce6", image: "https://community.steamstatic.com/economy/image/-9a81dlWLwJ2UXnSI5fOlMRdXOzjkh5HMhHiCpEOcF58gfbcDkNtfIpStkifEg7vSuJ0xdVjsHeDl5SH0zbRl2owMDCUF95dARYuauiJBVhn6TFdGkU_YblxYaDwaaiN7CFxGkEuJN337yTp42j3gLh-hA4MG36JoGRdlQ5YliD-FS7k7vpjcC9v8ycnSdruCEm4HfD" },
];

function getMockItems(game: string) {
  const id = (prefix: string, i: number) => `${prefix}-mock-${i}`;
  if (game === "CS2") return MOCK_CS2_ITEMS.map((item, i) => ({ ...item, id: id("cs2", i), game: "cs2", type: "weapon" }));
  if (game === "DOTA2") return MOCK_DOTA2_ITEMS.map((item, i) => ({ ...item, id: id("dota2", i), game: "dota2", type: "weapon" }));
  return [];
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

    let items: Record<string, unknown>[] = [];
    let fetchError: string | null = null;

    try {
      const result = await getSteamInventory(session.steamId, gameParam);
      items = result.items as Record<string, unknown>[];
      fetchError = result.error;
    } catch {
      fetchError = "fetch_failed";
    }

    if (fetchError || items.length === 0) {
      const mockItems = getMockItems(gameParam);
      if (mockItems.length > 0) {
        console.log(`[inventory] Using ${mockItems.length} mock items for ${gameParam}`);
        return NextResponse.json({ success: true, data: { items: mockItems } });
      }
    }

    console.log(`[inventory] Steam fetch: ${Date.now() - t1}ms, items: ${items.length}, error: ${fetchError}`);

    if (fetchError === "inventory_private") {
      return NextResponse.json(
        { success: false, error: "Inventory is private or unavailable" },
        { status: 403 },
      );
    }
    if (fetchError === "rate_limited") {
      return NextResponse.json(
        { success: false, error: "Rate limited. Try again later." },
        { status: 429 },
      );
    }
    if (fetchError === "fetch_failed") {
      return NextResponse.json(
        { success: false, error: "Failed to fetch inventory" },
        { status: 502 },
      );
    }

    type InvItem = { name: string };
    const invItems = items as unknown as InvItem[];

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
