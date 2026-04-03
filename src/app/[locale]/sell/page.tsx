"use client";

import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from "react";
import { useSession } from "@/components/session-provider";
import { useCurrency } from "@/components/currency-provider";
import { useTranslations, useLocale } from "next-intl";

interface InventoryItem {
  id: string;
  game: string;
  name: string;
  phase?: string | null;
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

const COMMISSION_FALLBACK: Record<string, number> = {
  balance: 0,
  crypto: 0.01,
  card: 0.025,
  paypal: 0.025,
  bank: 0.03,
};

const PAY_ICONS: Record<string, { src: string; cls: string }> = {
  balance:      { src: "/icons/pay-balance.png", cls: "pay-btn__img pay-btn__img--circle" },
  card:         { src: "/icons/pay-card.png",    cls: "pay-btn__img" },
  paypal:       { src: "/icons/pay-paypal.svg", cls: "pay-btn__img" },
  crypto:       { src: "/icons/pay-crypto.png",  cls: "pay-btn__img pay-btn__img--circle pay-btn__img--crypto" },
  btc:          { src: "/icons/pay-crypto.png",  cls: "pay-btn__img pay-btn__img--circle pay-btn__img--crypto" },
  "usdt-trc20": { src: "/icons/tether.png",      cls: "pay-btn__img pay-btn__img--circle" },
  "usdt-erc20": { src: "/icons/tether.png",      cls: "pay-btn__img pay-btn__img--circle" },
  eth:          { src: "/icons/pay-crypto.png",  cls: "pay-btn__img pay-btn__img--circle pay-btn__img--crypto" },
  ltc:          { src: "/icons/pay-crypto.png",  cls: "pay-btn__img pay-btn__img--circle pay-btn__img--crypto" },
  bank:         { src: "/icons/pay-bank.png",    cls: "pay-btn__img" },
  sbp:          { src: "/icons/pay-bank.png",    cls: "pay-btn__img" },
  qiwi:         { src: "/icons/pay-balance.png", cls: "pay-btn__img pay-btn__img--circle" },
  yoomoney:     { src: "/icons/pay-balance.png", cls: "pay-btn__img pay-btn__img--circle" },
  other:        { src: "/icons/pay-balance.png", cls: "pay-btn__img pay-btn__img--circle" },
};

const ICON_WRAP_CLS: Record<string, string> = {
  card: "pay-btn__icon pay-btn__icon--card",
  paypal: "pay-btn__icon pay-btn__icon--paypal",
  bank: "pay-btn__icon pay-btn__icon--bank",
};

const PAYPAL_EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const CRYPTO_TYPES = new Set(["crypto", "btc", "usdt-trc20", "usdt-erc20", "eth", "ltc"]);

function CryptoInlineSvg({ type }: { type: string }) {
  const s = 22;
  switch (type) {
    case "btc": case "crypto":
      return <svg width={s} height={s} viewBox="0 0 32 32"><circle cx="16" cy="16" r="16" fill="#F7931A" /><path d="M22.5 14c.3-2-1.2-3.1-3.3-3.8l.7-2.7-1.6-.4-.6 2.6c-.4-.1-.9-.2-1.3-.3l.7-2.6-1.7-.4-.7 2.7c-.4-.1-.7-.2-1-.2v-.1l-2.3-.6-.4 1.8s1.2.3 1.2.3c.7.2.8.6.8 1l-.8 3.2c0 .1.1.1.1.1h-.1l-1.2 4.7c-.1.2-.3.6-.8.4 0 0-1.2-.3-1.2-.3l-.8 1.9 2.2.5c.4.1.8.2 1.2.3l-.7 2.8 1.6.4.7-2.7c.4.1.9.2 1.3.3l-.7 2.7 1.7.4.7-2.8c2.8.5 5 .3 5.9-2.2.7-2-.1-3.2-1.5-3.9 1.1-.3 1.9-1 2.1-2.6zm-3.7 5.2c-.5 2.1-4.1 1-5.3.7l1-3.8c1.1.3 4.9.8 4.3 3.1zm.5-5.3c-.5 1.9-3.5.9-4.4.7l.8-3.4c1 .2 4.1.7 3.6 2.7z" fill="#fff" /></svg>;
    case "usdt-trc20": case "usdt-erc20":
      return <svg width={s} height={s} viewBox="0 0 32 32"><circle cx="16" cy="16" r="16" fill="#26A17B" /><path d="M17.9 17.2v0c-.1 0-.7.1-2 .1-1 0-1.7 0-1.9-.1v0c-3.8-.2-6.6-.8-6.6-1.6s2.8-1.5 6.6-1.6v2.6c.3 0 1 .1 2 .1 1.2 0 1.8-.1 1.9-.1v-2.6c3.8.2 6.6.8 6.6 1.6s-2.8 1.4-6.6 1.6zm0-3.5V11h5.3V8H8.9v3h5.3v2.7c-4.3.2-7.5 1.1-7.5 2.1s3.2 1.9 7.5 2.1v7.6h3.7v-7.6c4.3-.2 7.5-1.1 7.5-2.1s-3.2-1.9-7.5-2.1z" fill="#fff" /></svg>;
    case "eth":
      return <svg width={s} height={s} viewBox="0 0 32 32"><circle cx="16" cy="16" r="16" fill="#627eea"/><path d="M16.5 4v8.87l7.5 3.35L16.5 4z" fill="#fff" opacity=".6"/><path d="M16.5 4L9 16.22l7.5-3.35V4z" fill="#fff"/><path d="M16.5 21.97v6.03L24 17.62l-7.5 4.35z" fill="#fff" opacity=".6"/><path d="M16.5 28V21.97L9 17.62 16.5 28z" fill="#fff"/></svg>;
    case "ltc":
      return <svg width={s} height={s} viewBox="0 0 32 32"><circle cx="16" cy="16" r="16" fill="#bfbbbb"/><path d="M16 5l-1 .4v14.2l1 .6 7-4.1L16 5z" fill="#fff" opacity=".5"/><path d="M16 5L9 16.1l7 4.1V5z" fill="#fff"/><path d="M16 21.5l-.1.1v5.4l.1.3 7-9.8-7 4z" fill="#fff" opacity=".5"/><path d="M16 27.3v-5.8L9 17.5l7 9.8z" fill="#fff"/></svg>;
    default:
      return <svg width={s} height={s} viewBox="0 0 32 32"><circle cx="16" cy="16" r="16" fill="#F7931A" /><path d="M16 8v16M10 16h12" stroke="#fff" strokeWidth="2.5" strokeLinecap="round"/></svg>;
  }
}

const TRADE_URL_RE =
  /^https:\/\/steamcommunity\.com\/tradeoffer\/new\/\?partner=\d+&token=.+$/;

const COUNTRIES = [
  { code: "AF", name: "Afghanistan" },
  { code: "AL", name: "Albania" },
  { code: "DZ", name: "Algeria" },
  { code: "AR", name: "Argentina" },
  { code: "AM", name: "Armenia" },
  { code: "AU", name: "Australia" },
  { code: "AT", name: "Austria" },
  { code: "AZ", name: "Azerbaijan" },
  { code: "BY", name: "Belarus" },
  { code: "BE", name: "Belgium" },
  { code: "BR", name: "Brazil" },
  { code: "BG", name: "Bulgaria" },
  { code: "CA", name: "Canada" },
  { code: "CL", name: "Chile" },
  { code: "CN", name: "China" },
  { code: "CO", name: "Colombia" },
  { code: "HR", name: "Croatia" },
  { code: "CY", name: "Cyprus" },
  { code: "CZ", name: "Czech Republic" },
  { code: "DK", name: "Denmark" },
  { code: "EG", name: "Egypt" },
  { code: "EE", name: "Estonia" },
  { code: "FI", name: "Finland" },
  { code: "FR", name: "France" },
  { code: "GE", name: "Georgia" },
  { code: "DE", name: "Germany" },
  { code: "GR", name: "Greece" },
  { code: "HK", name: "Hong Kong" },
  { code: "HU", name: "Hungary" },
  { code: "IS", name: "Iceland" },
  { code: "IN", name: "India" },
  { code: "ID", name: "Indonesia" },
  { code: "IR", name: "Iran" },
  { code: "IQ", name: "Iraq" },
  { code: "IE", name: "Ireland" },
  { code: "IL", name: "Israel" },
  { code: "IT", name: "Italy" },
  { code: "JP", name: "Japan" },
  { code: "KZ", name: "Kazakhstan" },
  { code: "KR", name: "South Korea" },
  { code: "KG", name: "Kyrgyzstan" },
  { code: "LV", name: "Latvia" },
  { code: "LT", name: "Lithuania" },
  { code: "LU", name: "Luxembourg" },
  { code: "MY", name: "Malaysia" },
  { code: "MX", name: "Mexico" },
  { code: "MD", name: "Moldova" },
  { code: "MN", name: "Mongolia" },
  { code: "ME", name: "Montenegro" },
  { code: "MA", name: "Morocco" },
  { code: "NL", name: "Netherlands" },
  { code: "NZ", name: "New Zealand" },
  { code: "NG", name: "Nigeria" },
  { code: "NO", name: "Norway" },
  { code: "PK", name: "Pakistan" },
  { code: "PE", name: "Peru" },
  { code: "PH", name: "Philippines" },
  { code: "PL", name: "Poland" },
  { code: "PT", name: "Portugal" },
  { code: "RO", name: "Romania" },
  { code: "RU", name: "Russia" },
  { code: "SA", name: "Saudi Arabia" },
  { code: "RS", name: "Serbia" },
  { code: "SG", name: "Singapore" },
  { code: "SK", name: "Slovakia" },
  { code: "SI", name: "Slovenia" },
  { code: "ZA", name: "South Africa" },
  { code: "ES", name: "Spain" },
  { code: "SE", name: "Sweden" },
  { code: "CH", name: "Switzerland" },
  { code: "TW", name: "Taiwan" },
  { code: "TJ", name: "Tajikistan" },
  { code: "TH", name: "Thailand" },
  { code: "TR", name: "Turkey" },
  { code: "TM", name: "Turkmenistan" },
  { code: "UA", name: "Ukraine" },
  { code: "AE", name: "United Arab Emirates" },
  { code: "GB", name: "United Kingdom" },
  { code: "US", name: "United States" },
  { code: "UZ", name: "Uzbekistan" },
  { code: "VN", name: "Vietnam" },
];

function flagUrl(code: string) {
  return `https://flagcdn.com/w40/${code.toLowerCase()}.png`;
}

type SortKey =
  | "price-desc"
  | "price-asc"
  | "name-asc"
  | "name-desc"
  | "float-asc"
  | "float-desc";

function getWearShort(item: InventoryItem) {
  return item.wearShort || (item.wear ? WEAR_MAP[item.wear] : undefined);
}

export default function SellPage() {
  const { user, loading: sessionLoading } = useSession();
  const { format, formatParts, symbol, convert } = useCurrency();
  const t = useTranslations("sell");
  const locale = useLocale();

  const SORT_LABELS: Record<SortKey, string> = {
    "price-desc": t("high2low"),
    "price-asc": t("low2high"),
    "name-asc": t("nameAZ"),
    "name-desc": t("nameZA"),
    "float-asc": t("floatBest"),
    "float-desc": t("floatWorst"),
  };

  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loadingInventory, setLoadingInventory] = useState(false);
  const [minItemPrice, setMinItemPrice] = useState(0);

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
  const [tradeUrlSaved, setTradeUrlSaved] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("balance");
  const [selectedCrypto, setSelectedCrypto] = useState<string | null>(null);
  const [cryptoDropOpen, setCryptoDropOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [dbPaymentMethods, setDbPaymentMethods] = useState<any[]>([]);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [payDetails, setPayDetails] = useState<Record<string, string>>({});
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [mobilePayStep, setMobilePayStep] = useState<1 | 2>(1);
  const [countryOpen, setCountryOpen] = useState(false);
  const [countrySearch, setCountrySearch] = useState("");
  const countryRef = useRef<HTMLDivElement>(null);
  const cryptoDropRef = useRef<HTMLDivElement>(null);

  const offerItemsRef = useRef<HTMLDivElement>(null);

  const [submitError, setSubmitError] = useState<string | null>(null);
  const [gameMixPopup, setGameMixPopup] = useState<"cs2" | "other" | null>(null);

  const [promoCode, setPromoCode] = useState("");
  const [promoDiscount, setPromoDiscount] = useState<number | null>(null);
  const [promoError, setPromoError] = useState<string | null>(null);
  const [promoLoading, setPromoLoading] = useState(false);
  const [promoApplied, setPromoApplied] = useState<string | null>(null);

  /* ---- fetch inventory ---- */
  const fetchGame = useCallback(async (game: string) => {
    const gameApiMap: Record<string, string> = { cs2: "CS2", dota2: "DOTA2", tf2: "TF2", rust: "RUST" };
    let res: Response;
    try {
      res = await fetch(`/api/inventory?game=${gameApiMap[game] || "CS2"}`);
    } catch {
      return [];
    }
    let json: { success?: boolean; data?: { items?: Record<string, unknown>[]; minPrice?: number } };
    try {
      json = await res.json();
    } catch {
      return [];
    }
    if (!json.success || !json.data?.items) return [];
    if (typeof json.data.minPrice === "number" && json.data.minPrice > 0) {
      setMinItemPrice((prev) => Math.max(prev, json.data!.minPrice!));
    }
    const wearMap: Record<string, string> = { "Factory New": "FN", "Minimal Wear": "MW", "Field-Tested": "FT", "Well-Worn": "WW", "Battle-Scarred": "BS" };
    return json.data.items.map((item: Record<string, unknown>) => {
      const name = (item.name as string) || "Unknown";
      const parts = name.split(" | ");
      const condition = (item.condition as string) || null;
      return {
        id: (item.assetId as string) || String(Math.random()),
        game,
        name,
        phase: (item.phase as string | null | undefined) ?? null,
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
    let cancelled = false;
    setLoadingInventory(true);

    const loadAll = async () => {
      const games = ["cs2", "dota2", "tf2", "rust"] as const;
      let allItems: InventoryItem[] = [];

      for (const game of games) {
        if (cancelled) break;
        try {
          const items = await fetchGame(game);
          if (cancelled) break;
          allItems = [...allItems, ...items];
          setInventory([...allItems]);
          if (allItems.length > 0 && !cancelled) setLoadingInventory(false);
        } catch {
          // skip failed game
        }
      }
    };

    loadAll().finally(() => {
      if (!cancelled) setLoadingInventory(false);
    });

    return () => { cancelled = true; };
  }, [user, fetchGame]);

  useEffect(() => {
    fetch("/api/payment-methods")
      .then((r) => r.json())
      .then((d) => {
        if (d.success && Array.isArray(d.data) && d.data.length > 0) {
          setDbPaymentMethods(d.data);
          const first = d.data.find((m: any) => !CRYPTO_TYPES.has(m.type));
          setPaymentMethod(first?.type ?? "balance");
          const firstCrypto = d.data.find((m: any) => CRYPTO_TYPES.has(m.type));
          if (firstCrypto) setSelectedCrypto(firstCrypto.type);
        }
      })
      .catch(() => {});
  }, []);

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
      if (!isNaN(v)) items = items.filter((i) => convert(i.price) >= v);
    }
    if (priceMax) {
      const v = parseFloat(priceMax);
      if (!isNaN(v)) items = items.filter((i) => convert(i.price) <= v);
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
  }, [inventory, activeGame, searchQuery, activeWear, sort, priceMin, priceMax, convert]);

  const statsTotal = useMemo(
    () => filteredItems.reduce((s, i) => s + i.price, 0),
    [filteredItems],
  );

  const selectedTotal = useMemo(
    () => selectedItems.reduce((s, i) => s + i.price, 0),
    [selectedItems],
  );

  const effectivePayType = paymentMethod === "crypto" && selectedCrypto ? selectedCrypto : paymentMethod;

  const cryptoMethods = useMemo(
    () => dbPaymentMethods.filter((m) => CRYPTO_TYPES.has(m.type)),
    [dbPaymentMethods],
  );
  const mainMethods = useMemo(
    () => dbPaymentMethods.filter((m) => !CRYPTO_TYPES.has(m.type)),
    [dbPaymentMethods],
  );

  const commission = useMemo(() => {
    const fromDb = dbPaymentMethods.find((m) => m.type === effectivePayType);
    if (fromDb) return parseFloat(fromDb.commission) / 100;
    return COMMISSION_FALLBACK[effectivePayType] ?? COMMISSION_FALLBACK[paymentMethod] ?? 0;
  }, [effectivePayType, paymentMethod, dbPaymentMethods]);
  const promoMultiplier = promoDiscount ? 1 + promoDiscount / 100 : 1;
  const youReceive = selectedTotal * (1 - commission) * promoMultiplier;
  const tradeUrlValid = TRADE_URL_RE.test(tradeUrl);

  const step1Done = selectedItems.length > 0;
  const step2Done = tradeUrlValid;
  const step3Done = !!paymentMethod;
  const step3Active = step1Done && step2Done && checkoutOpen;
  const progressPercent =
    step3Active
      ? 100
      : step1Done && step2Done
        ? 66
        : step1Done
          ? 33
          : 0;

  const canSubmit = step1Done && step2Done && step3Done && !submitting;
  const hasCs2Items = selectedItems.some((i) => i.game === "cs2");
  const isBalanceMethod = paymentMethod === "balance";

  const isLoggedIn = !sessionLoading && !!user;
  const isGuest = !sessionLoading && !user;

  /* ---- handlers ---- */
  const toggleItem = useCallback((item: InventoryItem) => {
    if (minItemPrice > 0 && item.price < minItemPrice) return;
    setSelectedItems((prev) => {
      if (prev.find((i) => i.id === item.id)) return prev.filter((i) => i.id !== item.id);
      const hasCs2 = prev.some((i) => i.game === "cs2");
      const hasOther = prev.some((i) => i.game !== "cs2");
      if (item.game === "cs2" && hasOther) {
        setGameMixPopup("cs2");
        return prev;
      }
      if (item.game !== "cs2" && hasCs2) {
        setGameMixPopup("other");
        return prev;
      }
      return [...prev, item];
    });
  }, [minItemPrice]);

  const selectAll = useCallback(() => {
    setSelectedItems((prev) => {
      const hasCs2 = prev.some((i) => i.game === "cs2");
      const hasOther = prev.some((i) => i.game !== "cs2");
      const ids = new Set(prev.map((i) => i.id));
      const toAdd = filteredItems.filter((i) => {
        if (ids.has(i.id)) return false;
        if (minItemPrice > 0 && i.price < minItemPrice) return false;
        if (i.game === "cs2" && hasOther) return false;
        if (i.game !== "cs2" && hasCs2) return false;
        return true;
      });
      const combined = [...prev, ...toAdd];
      const combinedHasCs2 = combined.some((i) => i.game === "cs2");
      const combinedHasOther = combined.some((i) => i.game !== "cs2");
      if (combinedHasCs2 && combinedHasOther) return prev;
      return combined;
    });
  }, [filteredItems, minItemPrice]);

  const clearAll = useCallback(() => setSelectedItems([]), []);

  const scrollOffer = useCallback((dir: "left" | "right") => {
    const el = offerItemsRef.current;
    if (!el) return;
    const delta = dir === "left" ? -200 : 200;
    el.scrollTo({ left: el.scrollLeft + delta, behavior: "smooth" });
  }, []);

  const validateFields = useCallback((): boolean => {
    const errs: Record<string, string> = {};
    const req = (key: string, label: string) => {
      if (!payDetails[key]?.trim()) errs[key] = `${label} is required`;
    };
    if (paymentMethod === "card") {
      req("cardNumber", "Card number");
      req("cardName", "Cardholder name");
    } else if (paymentMethod === "paypal") {
      const em = payDetails.paypalEmail?.trim() ?? "";
      if (!em) errs.paypalEmail = t("paypalEmailRequired");
      else if (!PAYPAL_EMAIL_RE.test(em)) errs.paypalEmail = t("paypalEmailInvalid");
    } else if (paymentMethod === "crypto") {
      if (!payDetails.network) errs.network = "Select a network";
      req("walletAddress", "Wallet address");
    } else if (paymentMethod === "bank") {
      req("iban", "IBAN");
      req("swift", "SWIFT / BIC");
      req("recipientName", "Recipient name");
    }
    const pm = dbPaymentMethods.find((m) => m.type === effectivePayType);
    const minAmt = pm ? parseFloat(pm.minAmount) : 0;
    if (minAmt > 0 && youReceive < minAmt) {
      errs._minAmount = `Minimum amount: $${minAmt.toFixed(2)}`;
    }
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  }, [paymentMethod, payDetails, effectivePayType, dbPaymentMethods, youReceive, t]);

  const handleSubmit = useCallback(async () => {
    if (!canSubmit) return;
    if (!validateFields()) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      const gameApiMap: Record<string, string> = { cs2: "CS2", dota2: "DOTA2", tf2: "TF2", rust: "RUST" };
      const fromDb = dbPaymentMethods.find((m) => m.type === effectivePayType);
      const commissionRate = fromDb ? parseFloat(fromDb.commission) / 100 : (COMMISSION_FALLBACK[effectivePayType] ?? COMMISSION_FALLBACK[paymentMethod] ?? 0);
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: selectedItems.map((item) => ({
            game: gameApiMap[item.game] || "CS2",
            name: item.name,
            externalId: item.id,
            phase: item.phase ?? null,
            imageUrl: item.image || undefined,
            basePrice: item.price,
            buyoutPrice: +(item.price * (1 - commissionRate)).toFixed(2),
            currency: "USD",
          })),
          tradeUrl,
          paymentMethodId: fromDb?.id ?? paymentMethod,
          currency: "USD",
          paymentDetails: payDetails,
        }),
      });
      const json = await res.json();
      if (json.success && json.data?.orderId) {
        window.location.href = `/${locale}/order/${json.data.orderId}`;
      } else {
        setSubmitError(json.error ?? "Something went wrong. Please try again.");
        setSubmitting(false);
      }
    } catch {
      setSubmitError("Network error. Please check your connection and try again.");
      setSubmitting(false);
    }
  }, [canSubmit, validateFields, selectedItems, tradeUrl, paymentMethod, effectivePayType, dbPaymentMethods, payDetails, locale]);

  useEffect(() => {
    if (!user) return;
    const saved = localStorage.getItem("sw_tradeUrl");
    if (saved) setTradeUrl(saved);
  }, [user]);

  const pasteTradeUrl = useCallback(async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setTradeUrl(text);
        setTradeUrlSaved(false);
      }
    } catch { /* clipboard access denied */ }
  }, []);

  const saveTradeUrl = useCallback(() => {
    if (!tradeUrlValid) return;
    localStorage.setItem("sw_tradeUrl", tradeUrl);
    setTradeUrlSaved(true);
    setTimeout(() => setTradeUrlSaved(false), 2000);
  }, [tradeUrl, tradeUrlValid]);

  useEffect(() => {
    if (!sortOpen) return;
    const handler = (e: MouseEvent) => {
      if (!(e.target as HTMLElement).closest("#sortWrap")) setSortOpen(false);
    };
    document.addEventListener("click", handler);
    return () => document.removeEventListener("click", handler);
  }, [sortOpen]);

  useEffect(() => {
    if (!countryOpen) return;
    const handler = (e: Event) => {
      if (countryRef.current && !countryRef.current.contains(e.target as Node)) setCountryOpen(false);
    };
    document.addEventListener("mousedown", handler);
    document.addEventListener("touchstart", handler);
    return () => { document.removeEventListener("mousedown", handler); document.removeEventListener("touchstart", handler); };
  }, [countryOpen]);

  useEffect(() => {
    if (!cryptoDropOpen) return;
    const handler = (e: Event) => {
      if (cryptoDropRef.current && !cryptoDropRef.current.contains(e.target as Node)) setCryptoDropOpen(false);
    };
    document.addEventListener("mousedown", handler);
    document.addEventListener("touchstart", handler);
    return () => { document.removeEventListener("mousedown", handler); document.removeEventListener("touchstart", handler); };
  }, [cryptoDropOpen]);

  const filteredCountries = useMemo(() => {
    if (!countrySearch) return COUNTRIES;
    const q = countrySearch.toLowerCase();
    return COUNTRIES.filter(c => c.name.toLowerCase().includes(q));
  }, [countrySearch]);

  const selectedCountry = COUNTRIES.find(c => c.code === payDetails.country);


  /* ================================================================ JSX */
  return (
    <div className={`sell-page-wrap${mobilePayStep === 2 ? " sell-page-wrap--step2" : ""}`}>

      {isGuest && (
        <div className="sell-guest-overlay" id="guestOverlay">
          <div className="sell-guest-overlay__content">
            <div className="sell-guest-overlay__icon">
              <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><polyline points="9 12 11 14 15 10"/></svg>
            </div>
            <h3>{t("loginOverlayTitle")}</h3>
            <p>{t("loginOverlayDesc")}</p>
            <div className="sell-guest-overlay__divider" />
            <a href="/api/auth/steam" className="sell-guest-overlay__steam-btn" id="guestSignIn">
              <img src="https://community.cloudflare.steamstatic.com/public/shared/images/header/logo_steam.svg?t=962016" alt="Steam" className="sell-guest-overlay__steam-logo" />
              {t("loginOverlayBtn")}
            </a>
            <a href="/" className="sell-guest-overlay__home">{t("loginOverlayHome")}</a>
            <div className="sell-guest-overlay__trust">
              <span>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
                SSL Secure
              </span>
              <span>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
                Instant
              </span>
              <span>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                24/7
              </span>
            </div>
            <p className="sell-guest-overlay__note">{t("loginOverlayNote")}</p>
          </div>
        </div>
      )}

      {/* ═══ TOP ROW: Offer + Steps ═══ */}
      <div className="sell-topbar">
        <div className="sell-offer" id="sellOffer">
          <div className="sell-offer__header">
            <span className="sell-offer__total" id="offerTotal">
              {format(selectedTotal)}
            </span>
            <span className="sell-offer__toggle">
              {t("offerLabel")}
              <span className={`sell-offer__count${selectedItems.length > 0 ? ' has-items' : ''}`} id="offerCount">
                {selectedItems.length}
              </span>
            </span>
          </div>
          <div className="sell-offer__body">
            <button
              type="button"
              className="sell-offer__arrow sell-offer__arrow--left"
              id="offerArrowL"
              title="Scroll left"
              onClick={(e) => { e.stopPropagation(); scrollOffer("left"); }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 18 9 12 15 6" /></svg>
            </button>
            <div className="sell-offer__items" id="offerItems" ref={offerItemsRef}>
              {selectedItems.length === 0 ? (
                <div className="sell-offer__empty">
                  <svg className="sell-offer__empty-icon" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" /><line x1="3" y1="6" x2="21" y2="6" /><path d="M16 10a4 4 0 01-8 0" /></svg>
                  <span className="sell-offer__empty-text">{t("offerEmpty")}</span>
                </div>
              ) : (
                selectedItems.map((item) => {
                  const { whole, cents } = formatParts(item.price);
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
                          {whole}<span className="inv-card__cents">.{cents}</span><span className="inv-card__currency">{symbol}</span>
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
            <button
              type="button"
              className="sell-offer__arrow sell-offer__arrow--right"
              id="offerArrowR"
              title="Scroll right"
              onClick={(e) => { e.stopPropagation(); scrollOffer("right"); }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 18 15 12 9 6" /></svg>
            </button>
          </div>
        </div>

      </div>

      <div className="sell-layout">

        {/* ── LEFT: Inventory ── */}
        <div className={`sell-inventory${mobilePayStep === 2 ? " sell-inventory--hidden-mobile" : ""}`}>

          {/* Steps - mobile only */}
          <div className="sell-steps--mobile">
            <div className="sell-steps" id="sellProgressMobile">
              <div className={`sell-step${step1Done ? " done" : ""}`} data-step="1">
                <span className="sell-step__icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3h2l.4 2M7 13h10l4-8H5.4"/><circle cx="7.5" cy="20" r="1.5"/><circle cx="17.5" cy="20" r="1.5"/></svg>
                </span>
                <span className="sell-step__label">{t("stepSelect")}</span>
              </div>
              <span className="sell-step__chev" />
              <div className={`sell-step${step1Done && step2Done ? " done" : ""}`} data-step="2">
                <span className="sell-step__icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/></svg>
                </span>
                <span className="sell-step__label">{t("stepTradeUrl")}</span>
              </div>
              <span className="sell-step__chev" />
              <div className={`sell-step${step3Active ? " done" : ""}`} data-step="3">
                <span className="sell-step__icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="M2 10h20"/><path d="M6 16h4"/></svg>
                </span>
                <span className="sell-step__label">{t("stepGetPaid")}</span>
              </div>
            </div>
          </div>

          {/* Trade URL - mobile only (above inventory) */}
          <div className="sell-tradeurl--mobile">
            <div className="sidebar-tradeurl">
              <div className="sidebar-tradeurl__header">
                <span className="sidebar-tradeurl__label">{t("tradeUrl")}</span>
                <a
                  href="https://steamcommunity.com/my/tradeoffers/privacy#trade_offer_access_url"
                  target="_blank"
                  rel="noreferrer"
                  className="sidebar-tradeurl__find"
                >
                  {t("findTradeUrl")}
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                </a>
              </div>
              <div className="sidebar-tradeurl__input-wrap">
                <input
                  type="text"
                  className="sidebar-tradeurl__input"
                  placeholder={t("tradeUrlPlaceholder")}
                  value={tradeUrl}
                  onChange={(e) => { setTradeUrl(e.target.value); setTradeUrlSaved(false); }}
                />
                {tradeUrlValid ? (
                  <button type="button" className={`sidebar-tradeurl__save${tradeUrlSaved ? " saved" : ""}`} onClick={saveTradeUrl}>
                    {tradeUrlSaved ? (
                      <><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg> {t("saved")}</>
                    ) : (
                      <><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg> {t("save")}</>
                    )}
                  </button>
                ) : (
                  <button type="button" className="sidebar-tradeurl__paste" onClick={pasteTradeUrl}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>
                    {t("paste")}
                  </button>
                )}
              </div>
              <div className="sidebar-tradeurl__actions">
                <div className={`sell-tradeurl__status${tradeUrl ? (tradeUrlValid ? " valid" : " invalid") : ""}`}>
                  {tradeUrl && tradeUrlValid && (
                    <><svg width="14" height="14" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" fill="#22c55e"/><polyline points="8 12 11 15 16 9" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg> {t("validTradeUrl")}</>
                  )}
                  {tradeUrl && !tradeUrlValid && (
                    <><svg width="14" height="14" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" fill="#ef4444"/><line x1="15" y1="9" x2="9" y2="15" stroke="#fff" strokeWidth="2.5" strokeLinecap="round"/><line x1="9" y1="9" x2="15" y2="15" stroke="#fff" strokeWidth="2.5" strokeLinecap="round"/></svg> {t("invalidTradeUrl")}</>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="sell-controls">
            <div className="sell-inventory__header">
              <h2 className="sell-inventory__title">
                <svg className="sell-inventory__title-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>
                {t("inventory")}
              </h2>
              <div className="sell-stats" id="sellStats">
                <div className="sell-stats__item">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" /><line x1="7" y1="7" x2="7.01" y2="7" /></svg>
                  <span><strong id="statsCount">{filteredItems.length}</strong> {t("itemsCount")}</span>
                </div>
                <div className="sell-stats__divider" />
                <div className="sell-stats__item">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg>
                  <span>{t("totalAmount")} <strong id="statsTotal">{format(statsTotal)}</strong></span>
                </div>
              </div>
            </div>

            <div className="sell-inventory__game-tabs" id="gameTabs">
              <button
                className={`game-tab${activeGame === "cs2" ? " active" : ""}`}
                data-game="cs2"
                onClick={() => { setActiveGame("cs2"); setActiveWear("all"); }}
              >
                <img className="game-tab__icon" src="/icons/cs2.png" alt="CS2" width={18} height={18} />
                CS2 <span className="game-tab__count" data-game-count="cs2">{gameCounts.cs2}</span>
              </button>
              <button
                className={`game-tab${activeGame === "dota2" ? " active" : ""}`}
                data-game="dota2"
                onClick={() => { setActiveGame("dota2"); setActiveWear("all"); }}
              >
                <img className="game-tab__icon" src="/icons/dota2.png" alt="Dota 2" width={18} height={18} />
                Dota 2 <span className="game-tab__count" data-game-count="dota2">{gameCounts.dota2}</span>
              </button>
              <button
                className={`game-tab${activeGame === "tf2" ? " active" : ""}`}
                data-game="tf2"
                onClick={() => { setActiveGame("tf2"); setActiveWear("all"); }}
              >
                <img className="game-tab__icon" src="/icons/tf2.png" alt="TF2" width={18} height={18} />
                TF2 <span className="game-tab__count" data-game-count="tf2">{gameCounts.tf2}</span>
              </button>
              <button
                className={`game-tab${activeGame === "rust" ? " active" : ""}`}
                data-game="rust"
                onClick={() => { setActiveGame("rust"); setActiveWear("all"); }}
              >
                <svg className="game-tab__icon game-tab__icon--svg" viewBox="0 0 48 48" width={18} height={18} fill="currentColor"><polygon points="18,3 30,3 28,16 20,16" /><polygon points="18,3 30,3 28,16 20,16" transform="rotate(120,24,24)" /><polygon points="18,3 30,3 28,16 20,16" transform="rotate(240,24,24)" /><rect x="21.5" y="21.5" width="5" height="5" rx="1" transform="rotate(45,24,24)" /><rect x="22.5" y="12.5" width="3" height="3" rx="0.7" transform="rotate(60,24,24)" /><rect x="22.5" y="12.5" width="3" height="3" rx="0.7" transform="rotate(180,24,24)" /><rect x="22.5" y="12.5" width="3" height="3" rx="0.7" transform="rotate(300,24,24)" /></svg>
                Rust <span className="game-tab__count" data-game-count="rust">{gameCounts.rust}</span>
              </button>
            </div>

            <div className="sell-toolbar" id="sellToolbar">
              <div className="sell-toolbar__top">
                <div className="sell-inventory__search">
                  <div className="search-wrap">
                    <svg className="search-wrap__icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
                    <input
                      type="text"
                      className="input"
                      id="inventorySearch"
                      placeholder={t("searchPlaceholder")}
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
                <div className="sell-toolbar__right">
                  <button className="toolbar-btn toolbar-btn--accent" id="selectAllBtn" onClick={selectAll}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 11 12 14 22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" /></svg>
                    {t("selectAll")}
                  </button>
                  <span className="sell-toolbar__count" id="inventoryCount">{filteredItems.length} {t("itemsCount")}</span>
                  <button className="toolbar-btn" id="clearAllBtn" onClick={clearAll}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                    {t("clearAll")}
                  </button>
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
              <div className="sell-toolbar__left">
                {activeGame === "cs2" && (
                  <div className="sell-toolbar__wear-filters" id="wearFilters">
                    {(["all", "FN", "MW", "FT", "WW", "BS"] as const).map((w) => {
                      const tooltips: Record<string, string> = { all: "All Conditions", FN: "Factory New", MW: "Minimal Wear", FT: "Field-Tested", WW: "Well-Worn", BS: "Battle-Scarred" };
                      return (
                        <button
                          key={w}
                          className={`wear-pill${activeWear === w ? " active" : ""}`}
                          data-wear={w}
                          data-tooltip={tooltips[w]}
                          onClick={() => setActiveWear(w)}
                        >
                          {w === "all" ? t("all") : w}
                        </button>
                      );
                    })}
                  </div>
                )}
                <div className="sell-toolbar__price-range">
                  <span className="sell-toolbar__price-icon">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
                  </span>
                  <input
                    type="number"
                    className="input input--sm"
                    id="priceMin"
                    placeholder={t("min")}
                    min={0}
                    step={0.01}
                    value={priceMin}
                    onChange={(e) => setPriceMin(e.target.value)}
                  />
                  <span className="sell-toolbar__dash">-</span>
                  <input
                    type="number"
                    className="input input--sm"
                    id="priceMax"
                    placeholder={t("max")}
                    min={0}
                    step={0.01}
                    value={priceMax}
                    onChange={(e) => setPriceMax(e.target.value)}
                  />
                </div>
                <div className={`sell-toolbar__sort${sortOpen ? " open" : ""}`} id="sortWrap">
                  <button
                    className="sort-trigger"
                    id="sortTrigger"
                    onClick={() => setSortOpen((v) => !v)}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 5h10M11 9h7M11 13h4M3 17l3 3 3-3M6 18V4" /></svg>
                    <span id="sortLabel">{SORT_LABELS[sort]}</span>
                    <svg className="sort-trigger__chevron" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="6 9 12 15 18 9" /></svg>
                  </button>
                  <div className="sort-dropdown" id="sortDropdown">
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
            </div>
          </div>{/* /.sell-controls */}

          <div className="sell-inventory__scroll" id="inventoryScroll">


            {isLoggedIn && loadingInventory && (
              <div className={`sell-inventory__grid`} id="inventoryGridSkeleton">
                {Array.from({ length: 12 }).map((_, i) => (
                  <div key={i} className="inv-card inv-card--skeleton">
                    <div className="inv-card__rarity-line skeleton-pulse" />
                    <div className="inv-card__img skeleton-pulse" />
                    <div className="inv-card__info">
                      <span className="skeleton-line skeleton-line--name skeleton-pulse" />
                      <span className="skeleton-line skeleton-line--price skeleton-pulse" />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {isLoggedIn && !loadingInventory && filteredItems.length === 0 && inventory.length === 0 && (
              <div className="sell-empty" id="emptyState">
                <div className="sell-empty__icon">
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
                    <path d="M21 3v5h-5" />
                    <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
                    <path d="M3 21v-5h5" />
                  </svg>
                </div>
                <h4>{t("noItemsLoaded")}</h4>
                <p>{t("noItemsLoadedDesc")}</p>
                <button className="sell-empty__reload" onClick={() => {
                  setInventory([]);
                  setLoadingInventory(true);
                  const loadAll = async () => {
                    const games = ["cs2", "dota2", "tf2", "rust"] as const;
                    let allItems: InventoryItem[] = [];
                    for (const game of games) {
                      try {
                        const items = await fetchGame(game);
                        allItems = [...allItems, ...items];
                        setInventory([...allItems]);
                        if (allItems.length > 0) setLoadingInventory(false);
                      } catch {}
                    }
                    setLoadingInventory(false);
                  };
                  loadAll();
                }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
                    <path d="M21 3v5h-5" />
                    <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
                    <path d="M3 21v-5h5" />
                  </svg>
                  {t("reloadInventory")}
                </button>
              </div>
            )}

            {isLoggedIn && !loadingInventory && filteredItems.length === 0 && inventory.length > 0 && (
              <div className="sell-empty" id="emptyState">
                <div className="sell-empty__icon sell-empty__icon--search">
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="11" cy="11" r="8" />
                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                    <line x1="8" y1="11" x2="14" y2="11" />
                  </svg>
                </div>
                <h4>{t("noItemsFound")}</h4>
                <p>{t("noItemsDesc")}</p>
              </div>
            )}

            {!loadingInventory && <div className="sell-inventory__scroll-shadow" id="scrollShadow" />}

            <div className={`sell-inventory__grid${viewMode === "list" ? " list-view" : ""}`} id="inventoryGrid" style={loadingInventory ? { display: "none" } : undefined}>
              {filteredItems.map((item) => {
                const wearShort = getWearShort(item);
                const floatPct = item.float != null ? (item.float * 100).toFixed(2) : null;
                const { whole, cents } = formatParts(item.price);
                const isSelected = selectedItems.some((s) => s.id === item.id);
                const isBelowMin = minItemPrice > 0 && item.price < minItemPrice;

                return (
                  <div
                    key={item.id}
                    className={`inv-card${isSelected ? " selected" : ""}${isBelowMin ? " unavailable" : ""}`}
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
                      {item.type && item.type.toLowerCase() !== "normal" && <span className="inv-card__type">{item.type}</span>}
                      <span className="inv-card__price">
                        {whole}<span className="inv-card__cents">.{cents}</span><span className="inv-card__currency">{symbol}</span>
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>{/* /.sell-inventory__scroll */}

          {/* Continue button - mobile only */}
          {selectedItems.length > 0 && (
            <button
              className="sell-mobile-continue"
              onClick={() => { setMobilePayStep(2); requestAnimationFrame(() => { window.scrollTo(0, 0); document.documentElement.scrollTop = 0; document.body.scrollTop = 0; }); }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
              {t("continueToPayment")} ({selectedItems.length} {t("itemsCount")} - {format(selectedTotal)})
            </button>
          )}
        </div>

        {/* ── RIGHT: Payment Details ── */}
        <div className={`sell-sidebar${mobilePayStep === 2 ? " sell-sidebar--mobile-active" : ""}`}>

          {/* Back button - mobile step 2 */}
          <button
            className="sell-mobile-back"
            onClick={() => setMobilePayStep(1)}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
            {t("backToItems")}
          </button>

          <div className="sell-steps" id="sellProgress">
            <div className={`sell-step${step1Done ? " done" : ""}`} data-step="1">
              <span className="sell-step__icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3h2l.4 2M7 13h10l4-8H5.4"/><circle cx="7.5" cy="20" r="1.5"/><circle cx="17.5" cy="20" r="1.5"/></svg>
              </span>
              <span className="sell-step__label">{t("stepSelect")}</span>
            </div>
            <span className="sell-step__chev" />
            <div className={`sell-step${step1Done && step2Done ? " done" : ""}`} data-step="2">
              <span className="sell-step__icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/></svg>
              </span>
              <span className="sell-step__label">{t("stepTradeUrl")}</span>
            </div>
            <span className="sell-step__chev" />
            <div className={`sell-step${step3Active ? " done" : ""}`} data-step="3">
              <span className="sell-step__icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="M2 10h20"/><path d="M6 16h4"/></svg>
              </span>
              <span className="sell-step__label">{t("stepGetPaid")}</span>
            </div>
          </div>

          <div className="sidebar-tradeurl sidebar-tradeurl--desktop">
            <div className="sidebar-tradeurl__header">
              <span className="sidebar-tradeurl__label">{t("tradeUrl")}</span>
              <a
                href="https://steamcommunity.com/my/tradeoffers/privacy#trade_offer_access_url"
                target="_blank"
                rel="noreferrer"
                className="sidebar-tradeurl__find"
              >
                {t("findTradeUrl")}
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
              </a>
            </div>
            <div className="sidebar-tradeurl__input-wrap">
              <input
                type="text"
                className="sidebar-tradeurl__input"
                id="tradeUrl"
                placeholder={t("tradeUrlPlaceholder")}
                value={tradeUrl}
                onChange={(e) => { setTradeUrl(e.target.value); setTradeUrlSaved(false); }}
              />
              {tradeUrlValid ? (
                <button type="button" className={`sidebar-tradeurl__save${tradeUrlSaved ? " saved" : ""}`} onClick={saveTradeUrl}>
                  {tradeUrlSaved ? (
                    <><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg> {t("saved")}</>
                  ) : (
                    <><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg> {t("save")}</>
                  )}
                </button>
              ) : (
                <button type="button" className="sidebar-tradeurl__paste" onClick={pasteTradeUrl}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>
                  {t("paste")}
                </button>
              )}
            </div>
            <div className="sidebar-tradeurl__actions">
              <div className={`sell-tradeurl__status${tradeUrl ? (tradeUrlValid ? " valid" : " invalid") : ""}`} id="tradeUrlStatus">
                {tradeUrl && tradeUrlValid && (
                  <><svg width="14" height="14" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" fill="#22c55e"/><polyline points="8 12 11 15 16 9" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg> {t("validTradeUrl")}</>
                )}
                {tradeUrl && !tradeUrlValid && (
                  <><svg width="14" height="14" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" fill="#ef4444"/><line x1="15" y1="9" x2="9" y2="15" stroke="#fff" strokeWidth="2.5" strokeLinecap="round"/><line x1="9" y1="9" x2="15" y2="15" stroke="#fff" strokeWidth="2.5" strokeLinecap="round"/></svg> {t("invalidTradeUrl")}</>
                )}
              </div>
            </div>
          </div>

          <div className="sell-pay" id="sellPanel">
            <h3 className="sell-pay__title">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
              <span className="sell-pay__title-text">{t("paySidebarTitle")}<span className="sell-pay__subtitle">Secure & instant</span></span>
            </h3>


            <div className="sell-pay__methods" id="paymentMethods">
              <div className="pay-grid">
                {/* Balance */}
                {(() => {
                  const balPm = mainMethods.find((m) => m.type === "balance");
                  return (
                    <button className={`pay-btn${paymentMethod === "balance" ? " active" : ""}`} data-method="balance" onClick={() => { setPaymentMethod("balance"); setCryptoDropOpen(false); }}>
                      <span className="pay-btn__icon"><img src="/icons/pay-balance.png" alt="Balance" className="pay-btn__img pay-btn__img--circle" /></span>
                      <span className="pay-btn__name">{balPm?.name ?? t("payBalance")}{(!balPm || parseFloat(balPm.commission) === 0) && <span className="pay-btn__best-dot" />}</span>
                    </button>
                  );
                })()}
                {/* Card */}
                {(() => {
                  const cardPm = mainMethods.find((m) => m.type === "card");
                  return (
                    <button className={`pay-btn${paymentMethod === "card" ? " active" : ""}`} data-method="card" onClick={() => { setPaymentMethod("card"); setCryptoDropOpen(false); }}>
                      <span className="pay-btn__icon pay-btn__icon--card"><img src="/icons/pay-card.png" alt="Card" className="pay-btn__img" /></span>
                      <span className="pay-btn__name">{cardPm?.name ?? t("payCard")}</span>
                    </button>
                  );
                })()}
                {(() => {
                  const paypalPm = mainMethods.find((m) => m.type === "paypal");
                  return (
                    <button className={`pay-btn${paymentMethod === "paypal" ? " active" : ""}`} data-method="paypal" onClick={() => { setPaymentMethod("paypal"); setCryptoDropOpen(false); }}>
                      <span className="pay-btn__icon pay-btn__icon--paypal"><img src="/icons/pay-paypal.svg" alt="PayPal" className="pay-btn__img" /></span>
                      <span className="pay-btn__name">{paypalPm?.name ?? t("payPaypal")}</span>
                    </button>
                  );
                })()}
                {/* Crypto (grouped) */}
                <button className={`pay-btn${paymentMethod === "crypto" ? " active" : ""}`} data-method="crypto" onClick={() => { setPaymentMethod("crypto"); }}>
                  <span className="pay-btn__icon"><img src="/icons/pay-crypto.png" alt="Crypto" className="pay-btn__img pay-btn__img--circle pay-btn__img--crypto" /></span>
                  <span className="pay-btn__name">{t("payCrypto")}</span>
                </button>
                {/* Bank */}
                {(() => {
                  const bankPm = mainMethods.find((m) => m.type === "bank");
                  return (
                    <button className={`pay-btn${paymentMethod === "bank" ? " active" : ""}`} data-method="bank" onClick={() => { setPaymentMethod("bank"); setCryptoDropOpen(false); }}>
                      <span className="pay-btn__icon pay-btn__icon--bank"><img src="/icons/pay-bank.png" alt="Bank" className="pay-btn__img" /></span>
                      <span className="pay-btn__name">{bankPm?.name ?? t("payBank")}</span>
                    </button>
                  );
                })()}
              </div>


              {/* Info bar */}
              <div className="pay-info-bar" data-method={paymentMethod}>
                <span className="pay-info-bar__icon">%</span>
                {(() => {
                  const pm = dbPaymentMethods.find((m: any) => m.type === effectivePayType);
                  if (pm) {
                    const commPct = parseFloat(pm.commission);
                    const minAmt = parseFloat(pm.minAmount);
                    return <span>{t("feeLabel")}: {commPct}% · {t("minLabel")}: {format(minAmt)}</span>;
                  }
                  if (paymentMethod === "balance") return <span>{t("fee0")}</span>;
                  if (paymentMethod === "card") return <span>{t("fee25")} · {t("minLabel")}: {format(1)}</span>;
                  if (paymentMethod === "paypal") return <span>{t("fee25")} · {t("minLabel")}: {format(1)}</span>;
                  if (paymentMethod === "crypto") return <span>{t("fee1")} · {t("minLabel")}: {format(5)}</span>;
                  if (paymentMethod === "bank") return <span>{t("fee3")} · {t("minLabel")}: {format(10)}</span>;
                  return null;
                })()}
              </div>
            </div>

            <div className="sell-pay__bottom">
              <div className="sell-pay__summary">
                <div className="pay-summary-row">
                  <span className="pay-summary-row__label">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M12 6v12" /><path d="M15.5 9.5a3 3 0 00-3-2.5H11a3 3 0 000 6h2a3 3 0 010 6h-.5a3 3 0 01-3-2.5" /></svg>
                    {t("summaryAmount")}
                  </span>
                  <span className="pay-summary-row__value" id="summaryItems">{format(selectedTotal)}</span>
                </div>
                <div className="pay-summary-row pay-summary-row--fee">
                  <span className="pay-summary-row__label">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>
                    Commission
                  </span>
                  <span className="pay-summary-row__value pay-summary-row__value--fee">
                    -{format(selectedTotal * commission)}
                  </span>
                </div>
                {promoApplied && promoDiscount && (
                  <div className="pay-summary-row pay-summary-row--promo">
                    <span className="pay-summary-row__label">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 12v10H4V12" /><path d="M2 7h20v5H2z" /><path d="M12 22V7" /></svg>
                      Promo ({promoApplied})
                    </span>
                    <span className="pay-summary-row__value pay-summary-row__value--promo">
                      +{format(selectedTotal * (1 - commission) * (promoDiscount / 100))}
                    </span>
                  </div>
                )}
                <div className="pay-summary-row pay-summary-row--total">
                  <span className="pay-summary-row__label">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /><path d="M20 21H4" /></svg>
                    {t("youReceive")}
                  </span>
                  <span className="pay-summary-row__value" id="summaryTotal">{format(youReceive)}</span>
                </div>
              </div>

              {hasCs2Items && (
                <div className="sell-pay__hold-warn">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                  <span>{t("tradeHoldWarning")}</span>
                </div>
              )}
              {isBalanceMethod && selectedItems.length > 0 && (
                <div className="sell-pay__hold-warn sell-pay__hold-warn--info">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
                  <span>{t("balanceFrozenNote")}</span>
                </div>
              )}

              <button
                className="sell-btn"
                id="submitOrder"
                disabled={!canSubmit}
                onClick={() => { setPayDetails({}); setFieldErrors({}); setCheckoutOpen(true); }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" /></svg>
                {t("sellNow")}
              </button>

              <div className="sell-pay__promo">
                <div className={`promo-input-wrap${promoApplied ? " promo-input-wrap--applied" : ""}${promoError ? " promo-input-wrap--error" : ""}`}>
                  <svg className="promo-input__icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 12v10H4V12" /><path d="M2 7h20v5H2z" /><path d="M12 22V7" /><path d="M12 7H7.5a2.5 2.5 0 010-5C11 2 12 7 12 7z" /><path d="M12 7h4.5a2.5 2.5 0 000-5C13 2 12 7 12 7z" /></svg>
                  <input
                    type="text"
                    className={`promo-input${promoApplied ? " promo-input--applied" : ""}`}
                    placeholder={t("promoPlaceholder")}
                    value={promoCode}
                    onChange={(e) => { setPromoCode(e.target.value.toUpperCase()); setPromoError(null); }}
                    disabled={!!promoApplied}
                  />
                  {promoApplied ? (
                    <button className="promo-input__btn promo-input__btn--remove" onClick={() => {
                      setPromoApplied(null);
                      setPromoDiscount(null);
                      setPromoCode("");
                      setPromoError(null);
                    }}>✕</button>
                  ) : (
                    <button className="promo-input__btn" disabled={promoLoading || !promoCode.trim()} onClick={async () => {
                      setPromoLoading(true);
                      setPromoError(null);
                      try {
                        const res = await fetch("/api/promo/validate", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ code: promoCode.trim() }),
                        });
                        const json = await res.json();
                        if (json.success) {
                          setPromoDiscount(json.data.discount);
                          setPromoApplied(json.data.code);
                        } else {
                          setPromoError(json.error || "Invalid code");
                        }
                      } catch {
                        setPromoError("Network error");
                      }
                      setPromoLoading(false);
                    }}>{promoLoading ? "..." : t("promoApply")}</button>
                  )}
                </div>
                {promoApplied && promoDiscount && (
                  <div className="promo-applied-msg">+{promoDiscount}% bonus applied</div>
                )}
                {promoError && (
                  <div className="promo-error-msg">{promoError}</div>
                )}
              </div>

              <div className="sell-pay__trust">
                <div className="trust-badge">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                  <span>SSL Secure</span>
                </div>
                <div className="trust-badge">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                  <span>Verified</span>
                </div>
                <div className="trust-badge">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                  <span>24/7 Support</span>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* ── Checkout Modal ── */}
      {checkoutOpen && (
        <div className="checkout-overlay" onClick={(e) => { if (e.target === e.currentTarget) setCheckoutOpen(false); }}>
          <div className="checkout-modal" data-method={paymentMethod}>
            <button className="checkout-modal__close" onClick={() => setCheckoutOpen(false)}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>

            <div className="checkout-modal__header">
              <div className="checkout-modal__icon">
                {paymentMethod === "balance" && (
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12V7H5a2 2 0 010-4h14v4"/><path d="M3 5v14a2 2 0 002 2h16v-5"/><path d="M18 12a2 2 0 100 4 2 2 0 000-4z"/></svg>
                )}
                {paymentMethod === "card" && (
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
                )}
                {paymentMethod === "paypal" && (
                  <img src="/icons/pay-paypal.svg" alt="" width={36} height={36} className="checkout-modal__paypal-mark" />
                )}
                {paymentMethod === "crypto" && (
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>
                )}
                {paymentMethod === "bank" && (
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 21h18"/><path d="M3 10h18"/><path d="M5 6l7-3 7 3"/><line x1="4" y1="10" x2="4" y2="21"/><line x1="20" y1="10" x2="20" y2="21"/><line x1="8" y1="14" x2="8" y2="17"/><line x1="12" y1="14" x2="12" y2="17"/><line x1="16" y1="14" x2="16" y2="17"/></svg>
                )}
                {!["balance", "card", "paypal", "crypto", "bank"].includes(paymentMethod) && (
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
                )}
              </div>
              <h3 className="checkout-modal__title">{t("checkoutTitle")}</h3>
              <p className="checkout-modal__subtitle">{t("checkoutSub")}</p>
            </div>

            <div className="checkout-modal__summary">
              <div className="checkout-modal__summary-row">
                <span>{selectedItems.length} {t("itemsCount")}</span>
                <span className="checkout-modal__summary-price">{format(youReceive)}</span>
              </div>
              <div className="checkout-modal__summary-row checkout-modal__summary-method">
                <span>{t("paymentMethod")}</span>
                <span className="checkout-modal__method-badge">
                  {paymentMethod === "balance" && (<><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12V7H5a2 2 0 010-4h14v4"/><path d="M3 5v14a2 2 0 002 2h16v-5"/><path d="M18 12a2 2 0 100 4 2 2 0 000-4z"/></svg> Balance</>)}
                  {paymentMethod === "card" && (<><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg> {t("payCard")}</>)}
                  {paymentMethod === "paypal" && (<><img src="/icons/pay-paypal.svg" alt="" width={14} height={14} className="checkout-modal__paypal-badge" /> {t("payPaypal")}</>)}
                  {paymentMethod === "crypto" && (<><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg> {t("payCrypto")}</>)}
                  {paymentMethod === "bank" && (<><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 21h18"/><path d="M3 10h18"/><path d="M5 6l7-3 7 3"/><line x1="4" y1="10" x2="4" y2="21"/><line x1="20" y1="10" x2="20" y2="21"/><line x1="8" y1="14" x2="8" y2="17"/><line x1="12" y1="14" x2="12" y2="17"/><line x1="16" y1="14" x2="16" y2="17"/></svg> {t("payBank")}</>)}
                  {!["balance", "card", "paypal", "crypto", "bank"].includes(paymentMethod) && paymentMethod}
                </span>
              </div>
            </div>

            <div className="checkout-modal__fields">
              {paymentMethod === "balance" && (
                <div className="checkout-modal__info">
                  <div className="checkout-modal__info-icon">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                  </div>
                  <div>
                    <strong>Instant Payout</strong>
                    <p>Funds will be credited to your SKINSELL balance instantly.</p>
                  </div>
                </div>
              )}

              {paymentMethod === "paypal" && (
                <>
                  <label className={`checkout-modal__field${fieldErrors.paypalEmail ? " has-error" : ""}`}>
                    <span>{t("checkoutPaypalEmail")}</span>
                    <div className="checkout-modal__input-wrap">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                      <input type="email" inputMode="email" autoComplete="email" placeholder="name@email.com"
                        value={payDetails.paypalEmail || ""}
                        onChange={(e) => { setPayDetails(p => ({ ...p, paypalEmail: e.target.value })); setFieldErrors(p => { const n = { ...p }; delete n.paypalEmail; return n; }); }} />
                    </div>
                    {fieldErrors.paypalEmail && <span className="checkout-modal__field-error">{fieldErrors.paypalEmail}</span>}
                  </label>
                  <p className="checkout-modal__hint">{t("checkoutPaypalHint")}</p>
                </>
              )}

              {paymentMethod === "card" && (
                <>
                  <label className={`checkout-modal__field${fieldErrors.cardNumber ? " has-error" : ""}`}>
                    <span>{t("checkoutCardNumber")}</span>
                    <div className="checkout-modal__input-wrap">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
                      <input type="text" placeholder="0000 0000 0000 0000" maxLength={19}
                        value={payDetails.cardNumber || ""}
                        onChange={(e) => { setPayDetails(p => ({ ...p, cardNumber: e.target.value })); setFieldErrors(p => { const n = { ...p }; delete n.cardNumber; return n; }); }} />
                    </div>
                    {fieldErrors.cardNumber && <span className="checkout-modal__field-error">{fieldErrors.cardNumber}</span>}
                  </label>
                  <label className={`checkout-modal__field${fieldErrors.cardName ? " has-error" : ""}`}>
                    <span>{t("checkoutFullName")}</span>
                    <div className="checkout-modal__input-wrap">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                      <input type="text" placeholder="JOHN DOE"
                        value={payDetails.cardName || ""}
                        onChange={(e) => { setPayDetails(p => ({ ...p, cardName: e.target.value })); setFieldErrors(p => { const n = { ...p }; delete n.cardName; return n; }); }} />
                    </div>
                    {fieldErrors.cardName && <span className="checkout-modal__field-error">{fieldErrors.cardName}</span>}
                  </label>
                </>
              )}

              {paymentMethod === "crypto" && (
                <>
                  <label className={`checkout-modal__field${fieldErrors.network ? " has-error" : ""}`}>
                    <span>{t("checkoutSelectCrypto")}</span>
                    <div className="ck-crypto" ref={cryptoDropRef}>
                      <button type="button" className="ck-crypto__btn" onClick={() => setCryptoDropOpen(!cryptoDropOpen)}>
                        {payDetails.network ? (
                          <span className="ck-crypto__selected">
                            <span className={`ck-crypto__dot ck-crypto__dot--${payDetails.network.toLowerCase().replace("-","")}`} />
                            {({BTC:"Bitcoin (BTC)",ETH:"Ethereum (ERC-20)","USDT-TRC20":"USDT (TRC-20)","USDT-ERC20":"USDT (ERC-20)",LTC:"Litecoin (LTC)"} as Record<string,string>)[payDetails.network]}
                          </span>
                        ) : (
                          <span className="ck-crypto__placeholder">Select network...</span>
                        )}
                        <svg className={`ck-crypto__chev${cryptoDropOpen ? " open" : ""}`} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9"/></svg>
                      </button>
                      {cryptoDropOpen && (
                        <div className="ck-crypto__drop">
                          {[
                            { val: "BTC", label: "Bitcoin", tag: "BTC", color: "#f7931a" },
                            { val: "ETH", label: "Ethereum", tag: "ERC-20", color: "#627eea" },
                            { val: "USDT-TRC20", label: "USDT", tag: "TRC-20", color: "#26a17b" },
                            { val: "USDT-ERC20", label: "USDT", tag: "ERC-20", color: "#26a17b" },
                            { val: "LTC", label: "Litecoin", tag: "LTC", color: "#bfbbbb" },
                          ].map(n => (
                            <button key={n.val} type="button"
                              className={`ck-crypto__opt${payDetails.network === n.val ? " active" : ""}`}
                              onClick={(e) => { e.preventDefault(); e.stopPropagation(); setPayDetails(p => ({ ...p, network: n.val })); setFieldErrors(p => { const ne = { ...p }; delete ne.network; return ne; }); setCryptoDropOpen(false); }}>
                              <span className="ck-crypto__dot" style={{ background: n.color }} />
                              <span className="ck-crypto__opt-label">{n.label}</span>
                              <span className="ck-crypto__opt-tag">{n.tag}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    {fieldErrors.network && <span className="checkout-modal__field-error">{fieldErrors.network}</span>}
                  </label>
                  <label className={`checkout-modal__field${fieldErrors.walletAddress ? " has-error" : ""}`}>
                    <span>{t("checkoutWalletAddr")}</span>
                    <div className="checkout-modal__input-wrap">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12V7H5a2 2 0 010-4h14v4"/><path d="M3 5v14a2 2 0 002 2h16v-5"/><path d="M18 12a2 2 0 100 4 2 2 0 000-4z"/></svg>
                      <input type="text" placeholder="0x... / bc1... / T..."
                        value={payDetails.walletAddress || ""}
                        onChange={(e) => { setPayDetails(p => ({ ...p, walletAddress: e.target.value })); setFieldErrors(p => { const n = { ...p }; delete n.walletAddress; return n; }); }} />
                    </div>
                    {fieldErrors.walletAddress && <span className="checkout-modal__field-error">{fieldErrors.walletAddress}</span>}
                  </label>
                </>
              )}

              {paymentMethod === "bank" && (
                <>
                  <label className={`checkout-modal__field${fieldErrors.iban ? " has-error" : ""}`}>
                    <span>{t("checkoutIban")}</span>
                    <div className="checkout-modal__input-wrap">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 21h18"/><path d="M3 10h18"/><path d="M5 6l7-3 7 3"/><line x1="4" y1="10" x2="4" y2="21"/><line x1="20" y1="10" x2="20" y2="21"/></svg>
                      <input type="text" placeholder="DE89 3704 0044 0532 0130 00"
                        value={payDetails.iban || ""}
                        onChange={(e) => { setPayDetails(p => ({ ...p, iban: e.target.value })); setFieldErrors(p => { const n = { ...p }; delete n.iban; return n; }); }} />
                    </div>
                    {fieldErrors.iban && <span className="checkout-modal__field-error">{fieldErrors.iban}</span>}
                  </label>
                  <label className={`checkout-modal__field${fieldErrors.swift ? " has-error" : ""}`}>
                    <span>{t("checkoutSwift")}</span>
                    <div className="checkout-modal__input-wrap">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M2 12h20"/><path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/></svg>
                      <input type="text" placeholder="COBADEFFXXX"
                        value={payDetails.swift || ""}
                        onChange={(e) => { setPayDetails(p => ({ ...p, swift: e.target.value })); setFieldErrors(p => { const n = { ...p }; delete n.swift; return n; }); }} />
                    </div>
                    {fieldErrors.swift && <span className="checkout-modal__field-error">{fieldErrors.swift}</span>}
                  </label>
                  <label className={`checkout-modal__field${fieldErrors.recipientName ? " has-error" : ""}`}>
                    <span>{t("checkoutFullName")}</span>
                    <div className="checkout-modal__input-wrap">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                      <input type="text" placeholder="Full name"
                        value={payDetails.recipientName || ""}
                        onChange={(e) => { setPayDetails(p => ({ ...p, recipientName: e.target.value })); setFieldErrors(p => { const n = { ...p }; delete n.recipientName; return n; }); }} />
                    </div>
                    {fieldErrors.recipientName && <span className="checkout-modal__field-error">{fieldErrors.recipientName}</span>}
                  </label>
                </>
              )}
            </div>

            <div className="checkout-modal__footer">
              {submitError && (
                <p style={{ color: "#ef4444", fontSize: 13, fontWeight: 600, textAlign: "center", marginBottom: 8 }}>
                  {submitError}
                </p>
              )}
              {fieldErrors._minAmount && (
                <p className="checkout-modal__field-error" style={{ textAlign: "center", marginBottom: 4 }}>{fieldErrors._minAmount}</p>
              )}
              <button
                className="checkout-modal__submit"
                disabled={submitting}
                onClick={handleSubmit}
              >
                {submitting ? (
                  <span className="checkout-modal__spinner" />
                ) : (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14"/><path d="M12 5l7 7-7 7"/></svg>
                )}
                {submitting ? "Processing..." : t("checkoutConfirm")}
              </button>
              <p className="checkout-modal__disclaimer">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
                {t("checkoutDisclaimer")}
              </p>
            </div>
          </div>
        </div>
      )}

      {gameMixPopup && (
        <div className="gmix-overlay" onClick={() => setGameMixPopup(null)}>
          <div className="gmix-modal" onClick={(e) => e.stopPropagation()}>
            <button className="gmix-modal__close" onClick={() => setGameMixPopup(null)}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>

            <h3 className="gmix-modal__title">{t("gameMixTitle")}</h3>

            <div className="gmix-modal__body">
              <div className="gmix-modal__row">
                <div className="gmix-modal__badge gmix-modal__badge--cs2">
                  <img src="/icons/cs2.png" alt="CS2" width={16} height={16} />
                  <span>CS2</span>
                  <span className="gmix-modal__tag gmix-modal__tag--warn">7-day hold</span>
                </div>
                <div className="gmix-modal__badge gmix-modal__badge--other">
                  <img src="/icons/dota2.png" alt="Dota 2" width={16} height={16} />
                  <img src="/icons/tf2.png" alt="TF2" width={16} height={16} />
                  <span>Dota 2, TF2, Rust</span>
                  <span className="gmix-modal__tag gmix-modal__tag--ok">No hold</span>
                </div>
              </div>

              <p className="gmix-modal__desc">{t("gameMixDesc")}</p>
              <p className="gmix-modal__reason">{t("gameMixReason")}</p>

              <div className="gmix-modal__hint">
                <span>{t("gameMixHint")}</span>
              </div>
            </div>

            <button className="gmix-modal__btn" onClick={() => setGameMixPopup(null)}>
              {t("gameMixClose")}
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
