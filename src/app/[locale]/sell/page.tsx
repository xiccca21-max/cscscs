"use client";

import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from "react";
import { useSession } from "@/components/session-provider";

interface InventoryItem {
  id: string;
  game: string;
  name: string;
  weapon?: string;
  skinName?: string;
  price: number;
  wear?: string;
  wearShort?: string;
  float?: number;
  image: string;
  rarity: string;
  type?: string;
  stickers?: number;
}

const WEAR_MAP: Record<string, string> = {
  "Factory New": "FN",
  "Minimal Wear": "MW",
  "Field-Tested": "FT",
  "Well-Worn": "WW",
  "Battle-Scarred": "BS",
};

const COMMISSION: Record<string, number> = {
  balance: 0,
  crypto: 0.01,
  card: 0.025,
  bank: 0.03,
};

const TRADE_URL_RE =
  /^https:\/\/steamcommunity\.com\/tradeoffer\/new\/\?partner=\d+&token=.+$/;

type SortKey =
  | "price-desc"
  | "price-asc"
  | "name-asc"
  | "name-desc"
  | "float-asc"
  | "float-desc";

const SORT_LABELS: Record<SortKey, string> = {
  "price-desc": "High to Low",
  "price-asc": "Low to High",
  "name-asc": "Name A - Z",
  "name-desc": "Name Z - A",
  "float-asc": "Float - Best",
  "float-desc": "Float - Worst",
};

function getWearShort(item: InventoryItem) {
  return item.wearShort || (item.wear ? WEAR_MAP[item.wear] : undefined);
}

function formatPrice(price: number) {
  const [whole, cents] = price.toFixed(2).split(".");
  return { whole, cents };
}

export default function SellPage() {
  const { user, loading: sessionLoading } = useSession();

  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loadingInventory, setLoadingInventory] = useState(false);

  const [activeGame, setActiveGame] = useState("cs2");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeWear, setActiveWear] = useState("all");
  const [sort, setSort] = useState<SortKey>("price-desc");
  const [sortOpen, setSortOpen] = useState(false);
  const [priceMin, setPriceMin] = useState("");
  const [priceMax, setPriceMax] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const [selectedItems, setSelectedItems] = useState<InventoryItem[]>([]);

  const [tradeUrl, setTradeUrl] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("balance");
  const [submitting, setSubmitting] = useState(false);

  const offerItemsRef = useRef<HTMLDivElement>(null);

  /* ---- fetch inventory ---- */
  const fetchGame = useCallback(async (game: string) => {
    const gameApiMap: Record<string, string> = { cs2: "CS2", dota2: "DOTA2", tf2: "TF2", rust: "RUST" };
    const res = await fetch(`/api/inventory?game=${gameApiMap[game] || "CS2"}`);
    const json = await res.json();
    if (!json.success || !json.data?.items) return [];
    const wearMap: Record<string, string> = { "Factory New": "FN", "Minimal Wear": "MW", "Field-Tested": "FT", "Well-Worn": "WW", "Battle-Scarred": "BS" };
    return json.data.items.map((item: Record<string, unknown>) => {
      const name = (item.name as string) || "Unknown";
      const parts = name.split(" | ");
      const condition = (item.condition as string) || null;
      return {
        id: (item.assetId as string) || String(Math.random()),
        game,
        name,
        weapon: parts.length > 1 ? parts[0] : undefined,
        skinName: parts.length > 1 ? parts[1]?.replace(/\s*\(.*\)$/, "") : undefined,
        price: (item.price as number) ?? 0,
        wear: condition || undefined,
        wearShort: condition ? wearMap[condition] : undefined,
        float: undefined,
        image: (item.iconUrl as string) || "",
        rarity: "#6366f1",
        type: (item.quality as string) || undefined,
      } as InventoryItem;
    });
  }, []);

  useEffect(() => {
    if (!user) return;
    setLoadingInventory(true);
    Promise.all([
      fetchGame("cs2"),
      fetchGame("dota2"),
      fetchGame("tf2"),
      fetchGame("rust"),
    ])
      .then(([cs2, dota2, tf2, rust]) => {
        setInventory([...cs2, ...dota2, ...tf2, ...rust]);
      })
      .catch(() => {})
      .finally(() => setLoadingInventory(false));
  }, [user, fetchGame]);

  /* ---- derived ---- */
  const gameCounts = useMemo(() => {
    const c: Record<string, number> = { cs2: 0, dota2: 0, tf2: 0, rust: 0 };
    for (const item of inventory) if (c[item.game] !== undefined) c[item.game]++;
    return c;
  }, [inventory]);

  const filteredItems = useMemo(() => {
    let items = inventory.filter((i) => i.game === activeGame);
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      items = items.filter((i) => i.name.toLowerCase().includes(q));
    }
    if (activeWear !== "all") {
      items = items.filter((i) => getWearShort(i) === activeWear);
    }
    if (priceMin) {
      const v = parseFloat(priceMin);
      if (!isNaN(v)) items = items.filter((i) => i.price >= v);
    }
    if (priceMax) {
      const v = parseFloat(priceMax);
      if (!isNaN(v)) items = items.filter((i) => i.price <= v);
    }
    items.sort((a, b) => {
      switch (sort) {
        case "price-desc":
          return b.price - a.price;
        case "price-asc":
          return a.price - b.price;
        case "name-asc":
          return a.name.localeCompare(b.name);
        case "name-desc":
          return b.name.localeCompare(a.name);
        case "float-asc":
          return (a.float ?? 1) - (b.float ?? 1);
        case "float-desc":
          return (b.float ?? 0) - (a.float ?? 0);
        default:
          return 0;
      }
    });
    return items;
  }, [inventory, activeGame, searchQuery, activeWear, sort, priceMin, priceMax]);

  const statsTotal = useMemo(
    () => filteredItems.reduce((s, i) => s + i.price, 0),
    [filteredItems],
  );

  const selectedTotal = useMemo(
    () => selectedItems.reduce((s, i) => s + i.price, 0),
    [selectedItems],
  );

  const commission = COMMISSION[paymentMethod] ?? 0;
  const youReceive = selectedTotal * (1 - commission);
  const tradeUrlValid = TRADE_URL_RE.test(tradeUrl);

  const step1Done = selectedItems.length > 0;
  const step2Done = tradeUrlValid;
  const step3Done = !!paymentMethod;
  const progressPercent =
    step1Done && step2Done && step3Done
      ? 100
      : step1Done && step2Done
        ? 66
        : step1Done
          ? 33
          : 0;

  const canSubmit = step1Done && step2Done && step3Done && !submitting;

  const isLoggedIn = !sessionLoading && !!user;
  const isGuest = !sessionLoading && !user;

  /* ---- handlers ---- */
  const toggleItem = useCallback((item: InventoryItem) => {
    setSelectedItems((prev) =>
      prev.find((i) => i.id === item.id)
        ? prev.filter((i) => i.id !== item.id)
        : [...prev, item],
    );
  }, []);

  const selectAll = useCallback(() => {
    setSelectedItems((prev) => {
      const ids = new Set(prev.map((i) => i.id));
      return [...prev, ...filteredItems.filter((i) => !ids.has(i.id))];
    });
  }, [filteredItems]);

  const clearAll = useCallback(() => setSelectedItems([]), []);

  const scrollOffer = useCallback((dir: "left" | "right") => {
    offerItemsRef.current?.scrollBy({
      left: dir === "left" ? -200 : 200,
      behavior: "smooth",
    });
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    try {
      const gameApiMap: Record<string, string> = { cs2: "CS2", dota2: "DOTA2", tf2: "TF2", rust: "RUST" };
      const commissionRate = paymentMethod === "balance" ? 0 : paymentMethod === "card" ? 0.05 : paymentMethod === "crypto" ? 0.03 : 0.07;
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: selectedItems.map((item) => ({
            game: gameApiMap[item.game] || "CS2",
            name: item.name,
            externalId: item.id,
            imageUrl: item.image || undefined,
            basePrice: item.price,
            buyoutPrice: +(item.price * (1 - commissionRate)).toFixed(2),
            currency: "USD",
          })),
          tradeUrl,
          paymentMethodId: paymentMethod,
          currency: "USD",
        }),
      });
      const json = await res.json();
      if (json.success && json.data?.orderId) {
        window.location.href = `/order/${json.data.orderId}`;
      }
    } catch {
      /* handled by caller */
    } finally {
      setSubmitting(false);
    }
  }, [canSubmit, selectedItems, tradeUrl, paymentMethod]);

  /* close sort dropdown on outside click */
  useEffect(() => {
    if (!sortOpen) return;
    const handler = (e: MouseEvent) => {
      if (!(e.target as HTMLElement).closest("#sortWrap")) setSortOpen(false);
    };
    document.addEventListener("click", handler);
    return () => document.removeEventListener("click", handler);
  }, [sortOpen]);

  /* ================================================================ JSX */
  return (
    <>
    {/* Full-screen login overlay for guests */}
    {isGuest && (
      <div className="sell-login-overlay active" id="sellLoginOverlay">
        <div className="sell-login">
          <div className="sell-login__accent"></div>
          <div className="sell-login__body">
            <div className="sell-login__icon">
              <svg width="30" height="30" viewBox="0 0 496 512" fill="currentColor"><path d="M496 256c0 137-111.2 248-248.4 248-113.3 0-209-76.6-237-180.2l95.2 39.3c6.4 32.1 34.9 56.4 68.9 56.4 39.2 0 71.1-32.2 70.5-71.4l84.9-60.6c50.6.3 91.9-41.1 91.9-91.9 0-50.8-41.3-92-92-92s-92 41.2-92 92v2.1l-60.1 85.4c-13.2-.5-25.8 3.2-36.5 10L48.9 256H0C0 119 111 8 248 8s248 111 248 248z"/></svg>
            </div>
            <h2 className="sell-login__title">Sign In to Sell Skins</h2>
            <p className="sell-login__desc">Connect your Steam account to access your inventory and start selling skins instantly.</p>
            <a href="/api/auth/steam" className="sell-login__btn" id="sellSignInBtn">
              <svg width="18" height="18" viewBox="0 0 496 512" fill="currentColor"><path d="M496 256c0 137-111.2 248-248.4 248-113.3 0-209-76.6-237-180.2l95.2 39.3c6.4 32.1 34.9 56.4 68.9 56.4 39.2 0 71.1-32.2 70.5-71.4l84.9-60.6c50.6.3 91.9-41.1 91.9-91.9 0-50.8-41.3-92-92-92s-92 41.2-92 92v2.1l-60.1 85.4c-13.2-.5-25.8 3.2-36.5 10L48.9 256H0C0 119 111 8 248 8s248 111 248 248z"/></svg>
              <span>Sign In via Steam</span>
            </a>
            <span className="sell-login__note">We never see or store your Steam password</span>
          </div>
        </div>
      </div>
    )}
    <div className="sell-page-wrap">

      {/* ═══ TOP ROW: Offer + Steps ═══ */}
      <div className="sell-topbar">
        <div className="sell-offer" id="sellOffer">
          <div className="sell-offer__header">
            <span className="sell-offer__total" id="offerTotal">
              {selectedTotal.toFixed(2)}$
            </span>
            <span className="sell-offer__toggle">
              You Offer
              <span className="sell-offer__count" id="offerCount">
                {selectedItems.length}
              </span>
            </span>
          </div>
          <div className="sell-offer__body">
            <button
              className="sell-offer__arrow sell-offer__arrow--left"
              id="offerArrowL"
              title="Scroll left"
              onClick={() => scrollOffer("left")}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 18 9 12 15 6" /></svg>
            </button>
            <div className="sell-offer__items" id="offerItems" ref={offerItemsRef}>
              {selectedItems.length === 0 ? (
                <div className="sell-offer__empty">
                  <svg className="sell-offer__empty-icon" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" /><line x1="3" y1="6" x2="21" y2="6" /><path d="M16 10a4 4 0 01-8 0" /></svg>
                  <span className="sell-offer__empty-text">Select items from inventory below</span>
                </div>
              ) : (
                selectedItems.map((item) => {
                  const { whole, cents } = formatPrice(item.price);
                  return (
                    <div
                      key={item.id}
                      className="inv-card inv-card--mini"
                      style={{ "--rarity": item.rarity } as React.CSSProperties}
                      onClick={() => toggleItem(item)}
                    >
                      <div className="inv-card__rarity-line" />
                      <div className="inv-card__img">
                        <img className="inv-card__skin" src={item.image} alt={item.name} loading="lazy" />
                      </div>
                      <div className="inv-card__info">
                        <span className="inv-card__name">{item.name}</span>
                        <span className="inv-card__price">
                          {whole}<span className="inv-card__cents">.{cents}</span>
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
            <button
              className="sell-offer__arrow sell-offer__arrow--right"
              id="offerArrowR"
              title="Scroll right"
              onClick={() => scrollOffer("right")}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 18 15 12 9 6" /></svg>
            </button>
          </div>
        </div>

        <div className="sell-steps" id="sellProgress">
          <div className={`sell-step active`} data-step="1">
            <span className="sell-step__num">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3h2l.4 2M7 13h10l4-8H5.4" /><circle cx="7.5" cy="20" r="1.5" /><circle cx="17.5" cy="20" r="1.5" /></svg>
            </span>
            <span className="sell-step__label">Select Skins</span>
          </div>
          <div className="sell-step__line">
            <span className="sell-step__line-fill" />
          </div>
          <div className={`sell-step${step1Done ? " active" : ""}`} data-step="2">
            <span className="sell-step__num">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" /><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" /></svg>
            </span>
            <span className="sell-step__label">Trade URL</span>
          </div>
          <div className="sell-step__line">
            <span className="sell-step__line-fill" />
          </div>
          <div className={`sell-step${step1Done && step2Done ? " active" : ""}`} data-step="3">
            <span className="sell-step__num">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="20" height="16" rx="2" /><path d="M2 10h20" /><path d="M6 16h4" /></svg>
            </span>
            <span className="sell-step__label">Get Paid</span>
          </div>
          <div className="sell-steps__progress">
            <div
              className="sell-steps__progress-fill"
              id="stepsProgressFill"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </div>

      <div className="sell-layout">

        {/* ── LEFT: Inventory ── */}
        <div className="sell-inventory">

          {/* Unified control panel */}
          <div className="sell-controls">
            {/* Header + Stats + Tabs */}
            <div className="sell-inventory__header">
              <h2 className="sell-inventory__title">Your Inventory</h2>
              <div className="sell-stats" id="sellStats">
                <div className="sell-stats__item">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" /><line x1="7" y1="7" x2="7.01" y2="7" /></svg>
                  <span><strong id="statsCount">{filteredItems.length}</strong> items</span>
                </div>
                <div className="sell-stats__divider" />
                <div className="sell-stats__item">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg>
                  <span>Total: <strong id="statsTotal">{statsTotal.toFixed(2)}$</strong></span>
                </div>
              </div>
            </div>

            <div className="sell-inventory__game-tabs" id="gameTabs">
              <button
                className={`game-tab${activeGame === "cs2" ? " active" : ""}`}
                data-game="cs2"
                onClick={() => setActiveGame("cs2")}
              >
                <img className="game-tab__icon" src="/icons/cs2.png" alt="CS2" width={18} height={18} />
                CS2 <span className="game-tab__count" data-game-count="cs2">{gameCounts.cs2}</span>
              </button>
              <button
                className={`game-tab${activeGame === "dota2" ? " active" : ""}`}
                data-game="dota2"
                onClick={() => setActiveGame("dota2")}
              >
                <img className="game-tab__icon" src="/icons/dota2.png" alt="Dota 2" width={18} height={18} />
                Dota 2 <span className="game-tab__count" data-game-count="dota2">{gameCounts.dota2}</span>
              </button>
              <button
                className={`game-tab${activeGame === "tf2" ? " active" : ""}`}
                data-game="tf2"
                onClick={() => setActiveGame("tf2")}
              >
                <img className="game-tab__icon" src="/icons/tf2.png" alt="TF2" width={18} height={18} />
                TF2 <span className="game-tab__count" data-game-count="tf2">{gameCounts.tf2}</span>
              </button>
              <button
                className={`game-tab${activeGame === "rust" ? " active" : ""}`}
                data-game="rust"
                onClick={() => setActiveGame("rust")}
              >
                <svg className="game-tab__icon game-tab__icon--svg" viewBox="0 0 48 48" width={18} height={18} fill="currentColor"><polygon points="18,3 30,3 28,16 20,16" /><polygon points="18,3 30,3 28,16 20,16" transform="rotate(120,24,24)" /><polygon points="18,3 30,3 28,16 20,16" transform="rotate(240,24,24)" /><rect x="21.5" y="21.5" width="5" height="5" rx="1" transform="rotate(45,24,24)" /><rect x="22.5" y="12.5" width="3" height="3" rx="0.7" transform="rotate(60,24,24)" /><rect x="22.5" y="12.5" width="3" height="3" rx="0.7" transform="rotate(180,24,24)" /><rect x="22.5" y="12.5" width="3" height="3" rx="0.7" transform="rotate(300,24,24)" /></svg>
                Rust <span className="game-tab__count" data-game-count="rust">{gameCounts.rust}</span>
              </button>
            </div>

            {/* Search + Toolbar combined */}
            <div className="sell-toolbar" id="sellToolbar">
              <div className="sell-inventory__search">
                <div className="search-wrap">
                  <svg className="search-wrap__icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
                  <input
                    type="text"
                    className="input"
                    id="inventorySearch"
                    placeholder="Search..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  <button
                    className="search-wrap__clear"
                    id="searchClear"
                    type="button"
                    aria-label="Clear search"
                    style={{ display: searchQuery ? undefined : "none" }}
                    onClick={() => setSearchQuery("")}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                  </button>
                </div>
              </div>
              <div className="sell-toolbar__left">
                <div className="sell-toolbar__wear-filters" id="wearFilters">
                  {(["all", "FN", "MW", "FT", "WW", "BS"] as const).map((w) => (
                    <button
                      key={w}
                      className={`wear-pill${activeWear === w ? " active" : ""}`}
                      data-wear={w}
                      onClick={() => setActiveWear(w)}
                    >
                      {w === "all" ? "All" : w}
                    </button>
                  ))}
                </div>
                <div className="sell-toolbar__price-range">
                  <input
                    type="number"
                    className="input input--sm"
                    id="priceMin"
                    placeholder="Min $"
                    min={0}
                    step={0.01}
                    value={priceMin}
                    onChange={(e) => setPriceMin(e.target.value)}
                  />
                  <span className="sell-toolbar__dash">&mdash;</span>
                  <input
                    type="number"
                    className="input input--sm"
                    id="priceMax"
                    placeholder="Max $"
                    min={0}
                    step={0.01}
                    value={priceMax}
                    onChange={(e) => setPriceMax(e.target.value)}
                  />
                </div>
                <div className="sell-toolbar__sort" id="sortWrap">
                  <button
                    className="sort-trigger"
                    id="sortTrigger"
                    onClick={() => setSortOpen((v) => !v)}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 5h10M11 9h7M11 13h4M3 17l3 3 3-3M6 18V4" /></svg>
                    <span id="sortLabel">{SORT_LABELS[sort]}</span>
                    <svg className="sort-trigger__chevron" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="6 9 12 15 18 9" /></svg>
                  </button>
                  <div
                    className="sort-dropdown"
                    id="sortDropdown"
                    style={{ display: sortOpen ? "block" : "none" }}
                  >
                    {(Object.keys(SORT_LABELS) as SortKey[]).map((key) => (
                      <button
                        key={key}
                        className={`sort-dropdown__item${sort === key ? " active" : ""}`}
                        data-sort={key}
                        onClick={() => {
                          setSort(key);
                          setSortOpen(false);
                        }}
                      >
                        {SORT_LABELS[key]}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <div className="sell-toolbar__right">
                <button className="toolbar-btn" id="selectAllBtn" onClick={selectAll}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 11 12 14 22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" /></svg>
                  Select All
                </button>
                <button className="toolbar-btn" id="clearAllBtn" onClick={clearAll}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                  Clear
                </button>
                <span className="sell-toolbar__count" id="inventoryCount">{filteredItems.length} items</span>
                <div className="view-toggle" id="viewToggle">
                  <button
                    className={`view-toggle__btn${viewMode === "grid" ? " active" : ""}`}
                    data-view="grid"
                    title="Grid view"
                    onClick={() => setViewMode("grid")}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /></svg>
                  </button>
                  <button
                    className={`view-toggle__btn${viewMode === "list" ? " active" : ""}`}
                    data-view="list"
                    title="List view"
                    onClick={() => setViewMode("list")}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" /><line x1="3" y1="6" x2="3.01" y2="6" /><line x1="3" y1="12" x2="3.01" y2="12" /><line x1="3" y1="18" x2="3.01" y2="18" /></svg>
                  </button>
                </div>
              </div>
            </div>
          </div>{/* /.sell-controls */}

          {/* Scrollable inventory area */}
          <div className="sell-inventory__scroll" id="inventoryScroll">

            {/* Guest overlay — inline, inside scroll area */}
            {isGuest && (
              <div className="sell-guest-overlay" id="guestOverlay">
                <div className="sell-guest-overlay__content">
                  <div className="sell-guest-overlay__icon">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" /><polyline points="10 17 15 12 10 7" /><line x1="15" y1="12" x2="3" y2="12" /></svg>
                  </div>
                  <h3>Sign in to view your inventory</h3>
                  <p>Connect your Steam account to start selling skins</p>
                  <a href="/api/auth/steam" className="btn btn--primary btn--lg" id="guestSignIn">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" /><polyline points="10 17 15 12 10 7" /><line x1="15" y1="12" x2="3" y2="12" /></svg>
                    Sign in with Steam
                  </a>
                </div>
              </div>
            )}

            {/* Empty state */}
            {isLoggedIn && !loadingInventory && filteredItems.length === 0 && (
              <div className="sell-empty" id="emptyState">
                <div className="sell-empty__icon">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /><line x1="8" y1="11" x2="14" y2="11" /></svg>
                </div>
                <h4>No items found</h4>
                <p>Try adjusting your filters or search query</p>
              </div>
            )}

            {/* Scroll shadow */}
            <div className="sell-inventory__scroll-shadow" id="scrollShadow" />

            {/* Inventory grid */}
            <div className={`sell-inventory__grid${viewMode === "list" ? " sell-inventory__grid--list" : ""}`} id="inventoryGrid">
              {filteredItems.map((item) => {
                const wearShort = getWearShort(item);
                const floatPct = item.float != null ? (item.float * 100).toFixed(2) : null;
                const { whole, cents } = formatPrice(item.price);
                const isSelected = selectedItems.some((s) => s.id === item.id);

                return (
                  <div
                    key={item.id}
                    className={`inv-card${isSelected ? " selected" : ""}`}
                    data-game={item.game}
                    data-name={item.name}
                    data-price={item.price}
                    data-wear={item.wear}
                    data-float={item.float}
                    style={{ "--rarity": item.rarity } as React.CSSProperties}
                    onClick={() => toggleItem(item)}
                  >
                    <div className="inv-card__rarity-line" />
                    <div className="inv-card__img">
                      {wearShort && <span className="inv-card__wear">{wearShort}</span>}
                      <img className="inv-card__skin" src={item.image} alt={item.name} loading="lazy" />
                    </div>
                    <div className="inv-card__info">
                      <span className="inv-card__name">
                        {item.weapon ? (
                          <>
                            <span className="inv-card__weapon">{item.weapon}</span>{" "}
                            <span className="inv-card__skin-name">{item.skinName}</span>
                          </>
                        ) : (
                          item.name
                        )}
                      </span>
                      {item.float != null && floatPct != null && (
                        <div className="inv-card__float-bar">
                          <div className="float-bar__track">
                            <div className="float-bar__fill" style={{ width: `${floatPct}%` }} />
                            <div className="float-bar__marker" style={{ left: `${floatPct}%` }} />
                          </div>
                          <span className="float-bar__val">{item.float.toFixed(4)}</span>
                        </div>
                      )}
                      {item.type && <span className="inv-card__type">{item.type}</span>}
                      <span className="inv-card__price">
                        {whole}<span className="inv-card__cents">.{cents}</span>
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>{/* /.sell-inventory__scroll */}
        </div>

        {/* ── RIGHT: Payment Details ── */}
        <div className="sell-sidebar">

          {/* Trade URL */}
          <div className="sidebar-tradeurl">
            <div className="sidebar-tradeurl__header">
              <span className="sidebar-tradeurl__label">Trade Link</span>
              <a
                href="https://steamcommunity.com/my/tradeoffers/privacy#trade_offer_access_url"
                target="_blank"
                rel="noreferrer"
                className="sidebar-tradeurl__find"
              >
                Find it here
              </a>
            </div>
            <div className="sidebar-tradeurl__input-wrap">
              <input
                type="text"
                className="sidebar-tradeurl__input"
                id="tradeUrl"
                placeholder="https://steamcommunity.com/tradeoffer/new/?partner=012345678&token=ABCDEFG12"
                value={tradeUrl}
                onChange={(e) => setTradeUrl(e.target.value)}
              />
            </div>
            <div className="sell-tradeurl__status" id="tradeUrlStatus">
              {tradeUrl && (tradeUrlValid ? "\u2713 Valid trade URL" : "\u2717 Invalid trade URL")}
            </div>
          </div>

          {/* Payment panel */}
          <div className="sell-pay" id="sellPanel">
            <h3 className="sell-pay__title">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="20" height="16" rx="2" /><path d="M2 10h20" /></svg>
              Your Payment Details
            </h3>

            {/* Payment method grid */}
            <div className="sell-pay__methods" id="paymentMethods">
              <div className="pay-grid">
                <button
                  className={`pay-btn${paymentMethod === "balance" ? " active" : ""}`}
                  data-method="balance"
                  data-tooltip="Fee: 0%"
                  onClick={() => setPaymentMethod("balance")}
                >
                  <span className="pay-btn__icon">
                    <img src="/icons/pay-balance.png" alt="Balance" className="pay-btn__img pay-btn__img--circle" />
                  </span>
                  <span>Balance</span>
                </button>
                <button
                  className={`pay-btn${paymentMethod === "card" ? " active" : ""}`}
                  data-method="card"
                  data-tooltip="Fee: 2.5%"
                  onClick={() => setPaymentMethod("card")}
                >
                  <span className="pay-btn__icon pay-btn__icon--card">
                    <img src="/icons/pay-card.png" alt="Debit Card" className="pay-btn__img" />
                  </span>
                  <span>Debit Card</span>
                </button>
                <button
                  className={`pay-btn${paymentMethod === "crypto" ? " active" : ""}`}
                  data-method="crypto"
                  data-tooltip="Fee: 1%"
                  onClick={() => setPaymentMethod("crypto")}
                >
                  <span className="pay-btn__icon">
                    <img src="/icons/pay-crypto.png" alt="Crypto" className="pay-btn__img pay-btn__img--circle pay-btn__img--crypto" />
                  </span>
                  <span>Crypto</span>
                </button>
                <button
                  className={`pay-btn${paymentMethod === "bank" ? " active" : ""}`}
                  data-method="bank"
                  data-tooltip="Fee: 3%"
                  onClick={() => setPaymentMethod("bank")}
                >
                  <span className="pay-btn__icon pay-btn__icon--bank">
                    <img src="/icons/pay-bank.png" alt="Bank" className="pay-btn__img" />
                  </span>
                  <span>Bank</span>
                </button>
              </div>
            </div>

            {/* Bottom section with gradient */}
            <div className="sell-pay__bottom">
              <div className="sell-pay__summary">
                <div className="pay-summary-row">
                  <span className="pay-summary-row__label">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M12 6v12" /><path d="M15.5 9.5a3 3 0 00-3-2.5H11a3 3 0 000 6h2a3 3 0 010 6h-.5a3 3 0 01-3-2.5" /></svg>
                    Amount
                  </span>
                  <span id="summaryItems">{selectedTotal.toFixed(2)}$</span>
                </div>
                <div className="pay-summary-row pay-summary-row--total">
                  <span className="pay-summary-row__label">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /><path d="M20 21H4" /></svg>
                    You Receive
                  </span>
                  <span id="summaryTotal">{youReceive.toFixed(2)}$</span>
                </div>
              </div>

              <button
                className="sell-btn"
                id="submitOrder"
                disabled={!canSubmit}
                onClick={handleSubmit}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" /></svg>
                {submitting ? "PROCESSING..." : "SELL YOUR SKINS NOW"}
              </button>

              <div className="sell-pay__promo">
                <div className="promo-input-wrap">
                  <svg className="promo-input__icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 12v10H4V12" /><path d="M2 7h20v5H2z" /><path d="M12 22V7" /><path d="M12 7H7.5a2.5 2.5 0 010-5C11 2 12 7 12 7z" /><path d="M12 7h4.5a2.5 2.5 0 000-5C13 2 12 7 12 7z" /></svg>
                  <input type="text" className="promo-input" placeholder="Enter promo code" />
                  <button className="promo-input__btn" onClick={() => {
                    const input = document.querySelector<HTMLInputElement>('.promo-input');
                    if (input && input.value.trim()) {
                      input.classList.add('promo-input--applied');
                      const btn = input.nextElementSibling as HTMLElement;
                      if (btn) { btn.textContent = 'Applied!'; setTimeout(() => { btn.textContent = 'Apply'; }, 2000); }
                    }
                  }}>Apply</button>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>

    </div>
    </>
  );
}
