"use client";

import React, { useEffect, useState, useMemo, useCallback, useRef, Fragment } from "react";
import { useTranslations, useLocale } from "next-intl";

import "@/styles/skinwave-orders.css";

import { useSession } from "@/components/session-provider";
import { Link } from "@/i18n/navigation";

type OrderItem = {
  id: string;
  name: string;
  imageUrl: string | null;
  condition: string | null;
  quality: string | null;
  buyoutPrice: string;
  currency: string;
  game: string;
};

type OrderRow = {
  id: string;
  orderNumber: string;
  status: string;
  totalAmount: string;
  currency: string;
  createdAt: string;
  tradeSentAt?: string | null;
  itemCount: number;
  paymentMethod: { name: string; type: string } | null;
  items?: OrderItem[];
  tradeUrl?: string;
  steamProfileUrl?: string;
  botAccount?: {
    steamProfileUrl: string;
    steamId: string;
    name?: string;
  } | null;
};

const STATUS_BADGE: Record<string, string> = {
  CREATED: "ord-badge--created",
  TRADE_SENT: "ord-badge--sent",
  TRADE_COMPLETED: "ord-badge--completed",
  PAYMENT_PENDING: "ord-badge--processing",
  PAID: "ord-badge--paid",
  TRADE_CANCELLED: "ord-badge--cancelled",
  EXPIRED: "ord-badge--expired",
};

const STATUS_I18N: Record<string, string> = {
  CREATED: "statusCreated",
  TRADE_SENT: "statusTradeSent",
  TRADE_COMPLETED: "statusCompleted",
  PAYMENT_PENDING: "statusProcessing",
  PAID: "statusPaid",
  TRADE_CANCELLED: "statusCancelled",
  EXPIRED: "statusExpired",
};

const STATUS_DATA_ATTR: Record<string, string> = {
  CREATED: "created",
  TRADE_SENT: "trade_sent",
  TRADE_COMPLETED: "completed",
  PAYMENT_PENDING: "processing",
  PAID: "paid",
  TRADE_CANCELLED: "cancelled",
  EXPIRED: "expired",
};

const STATUS_ICON: Record<string, React.ReactNode> = {
  CREATED: (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
  ),
  TRADE_SENT: (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M22 2 11 13" /><path d="m22 2-7 20-4-9-9-4 20-7z" /></svg>
  ),
  TRADE_COMPLETED: (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12" /></svg>
  ),
  PAYMENT_PENDING: (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></svg>
  ),
  PAID: (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12" /></svg>
  ),
  TRADE_CANCELLED: (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" /></svg>
  ),
  EXPIRED: (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /><line x1="4" y1="4" x2="20" y2="20" /></svg>
  ),
};

const PAYOUT_ESTIMATE: Record<string, string> = {
  CREATED: "~15-30 min",
  TRADE_SENT: "~10-20 min",
  TRADE_COMPLETED: "~5-10 min",
  PAYMENT_PENDING: "~2-5 min",
};

const STATUS_ORDER: Record<string, number> = {
  CREATED: 0,
  TRADE_SENT: 1,
  TRADE_COMPLETED: 2,
  PAYMENT_PENDING: 3,
  PAID: 4,
  TRADE_CANCELLED: 5,
};

const PROGRESS_PERCENT: Record<string, number> = {
  CREATED: 15,
  TRADE_SENT: 40,
  TRADE_COMPLETED: 65,
  PAYMENT_PENDING: 80,
  PAID: 100,
  TRADE_CANCELLED: 0,
  EXPIRED: 40,
};

const NEEDS_ACTION = new Set(["CREATED", "TRADE_SENT"]);

const FILTER_TABS = [
  { key: "all", i18n: "filterAll", dot: null },
  { key: "CREATED", i18n: "filterCreated", dot: "ord-fil__dot--created" },
  { key: "TRADE_SENT", i18n: "filterTradeSent", dot: "ord-fil__dot--sent" },
  { key: "PAID", i18n: "filterPaid", dot: "ord-fil__dot--paid" },
  { key: "TRADE_CANCELLED", i18n: "filterCancelled", dot: "ord-fil__dot--cancelled" },
] as const;

type FilterKey = (typeof FILTER_TABS)[number]["key"];
type SortKey = "date" | "amount" | "status" | "items" | null;
type SortDir = "asc" | "desc";

const ITEMS_PER_PAGE = 10;

const TIMELINE_STEPS = ["CREATED", "TRADE_SENT", "TRADE_COMPLETED", "PAID"];
const TIMELINE_LABELS: Record<string, string> = {
  CREATED: "Created",
  TRADE_SENT: "Trade Sent",
  TRADE_COMPLETED: "Received",
  PAID: "Paid",
};

function getTimelineIndex(status: string): number {
  const idx = TIMELINE_STEPS.indexOf(status);
  if (idx < 0) return 0;
  if (status === "TRADE_COMPLETED" || status === "PAYMENT_PENDING") return 3;
  if (status === "PAID") return 4;
  return idx;
}

function paymentIcon(type: string | undefined) {
  switch (type) {
    case "crypto":
      return (
        <span className="ord-row__pay-icon ord-row__pay-icon--crypto">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg>
        </span>
      );
    case "card":
      return (
        <span className="ord-row__pay-icon ord-row__pay-icon--card">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="1" y="4" width="22" height="16" rx="2" /><line x1="1" y1="10" x2="23" y2="10" /></svg>
        </span>
      );
    case "balance":
      return (
        <span className="ord-row__pay-icon ord-row__pay-icon--balance">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2" /><path d="M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4" /></svg>
        </span>
      );
    default:
      return (
        <span className="ord-row__pay-icon">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="1" y="4" width="22" height="16" rx="2" /><line x1="1" y1="10" x2="23" y2="10" /></svg>
        </span>
      );
  }
}

function isOrderExpired(order: OrderRow): boolean {
  if (order.status !== "TRADE_SENT" || !order.tradeSentAt) return false;
  const deadline = new Date(order.tradeSentAt).getTime() + 10 * 60 * 1000;
  return Date.now() >= deadline;
}

function getDisplayStatus(order: OrderRow): string {
  if (isOrderExpired(order)) return "EXPIRED";
  return order.status;
}

function amtClass(status: string): string {
  if (status === "PAID") return "ord-row__amt ord-row__amt--paid";
  if (status === "TRADE_COMPLETED") return "ord-row__amt ord-row__amt--completed";
  if (status === "TRADE_CANCELLED" || status === "EXPIRED") return "ord-row__amt ord-row__amt--cancelled";
  return "ord-row__amt";
}

function Sparkline({ data, color = "#6366f1" }: { data: number[]; color?: string }) {
  if (data.length < 2) return null;
  const max = Math.max(...data, 1);
  const min = Math.min(...data, 0);
  const range = max - min || 1;
  const w = 48;
  const h = 20;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - ((v - min) / range) * h;
    return `${x},${y}`;
  }).join(" ");
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="ord-stat__spark">
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function MiniChart({ data, period, onToggle }: { data: number[]; period: "7d" | "30d"; onToggle: (p: "7d" | "30d") => void }) {
  const max = Math.max(...data, 1);
  const min = Math.min(...data, 0);
  const range = max - min || 1;
  const w = 280;
  const h = 60;
  const pad = 2;
  const total = data.reduce((s, v) => s + v, 0);
  const isEmpty = total === 0;

  const points = data.map((v, i) => {
    const x = pad + (i / (data.length - 1 || 1)) * (w - pad * 2);
    const y = h - pad - ((v - min) / range) * (h - pad * 2);
    return `${x},${y}`;
  }).join(" ");

  const areaPoints = `${pad},${h - pad} ${points} ${w - pad},${h - pad}`;

  return (
    <div className="ord-chart">
      <div className="ord-chart__header">
        <div className="ord-chart__info">
          <span className="ord-chart__total">{total.toFixed(2)}<small>$</small></span>
          <span className="ord-chart__label">Earnings</span>
        </div>
        <div className="ord-chart__toggle">
          <button className={`ord-chart__btn${period === "7d" ? " active" : ""}`} onClick={() => onToggle("7d")}>7d</button>
          <button className={`ord-chart__btn${period === "30d" ? " active" : ""}`} onClick={() => onToggle("30d")}>30d</button>
        </div>
      </div>
      {isEmpty ? (
        <div className="ord-chart__empty">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12" /></svg>
          <span>Start selling skins to see your earnings trend here</span>
        </div>
      ) : (
        <svg viewBox={`0 0 ${w} ${h}`} className="ord-chart__svg" preserveAspectRatio="none">
          <defs>
            <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="rgba(99,102,241,0.3)" />
              <stop offset="100%" stopColor="rgba(99,102,241,0)" />
            </linearGradient>
          </defs>
          <polygon points={areaPoints} fill="url(#chartGrad)" />
          <polyline points={points} fill="none" stroke="#6366f1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          {data.length > 0 && (
            <circle cx={pad + ((data.length - 1) / (data.length - 1 || 1)) * (w - pad * 2)} cy={h - pad - ((data[data.length - 1] - min) / range) * (h - pad * 2)} r="3" fill="#6366f1" stroke="#fff" strokeWidth="2" />
          )}
        </svg>
      )}
    </div>
  );
}

function CopyToast({ show }: { show: boolean }) {
  if (!show) return null;
  return (
    <div className="ord-toast">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>
      <span>Copied!</span>
    </div>
  );
}

function exportCSV(orders: OrderRow[]) {
  const header = "Order ID,Date,Items,Amount,Method,Status\n";
  const rows = orders.map((o) => {
    const date = new Date(o.createdAt).toISOString().split("T")[0];
    const method = o.paymentMethod?.name ?? "-";
    const status = o.status;
    return `${o.orderNumber},${date},${o.itemCount},${parseFloat(o.totalAmount).toFixed(2)},${method},${status}`;
  }).join("\n");
  const blob = new Blob([header + rows], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `orders_${new Date().toISOString().split("T")[0]}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function OrdersPage() {
  const t = useTranslations("orders");
  const locale = useLocale();
  const { user, loading: sessionLoading } = useSession();

  const formatRelativeDate = useCallback((dateStr: string): { label: string; full: string } => {
    const d = new Date(dateStr);
    const now = new Date();
    const diff = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
    const full = d.toLocaleDateString(locale === "ru" ? "ru-RU" : "en-US", { month: "long", day: "numeric", year: "numeric" });
    if (diff === 0) return { label: t("today"), full };
    if (diff === 1) return { label: t("yesterday"), full };
    return { label: t("daysAgo", { count: diff }), full };
  }, [locale, t]);

  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<FilterKey>("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [methodFilter, setMethodFilter] = useState<string>("all");
  const [chartPeriod, setChartPeriod] = useState<"7d" | "30d">("7d");
  const [modalOrder, setModalOrder] = useState<OrderRow | null>(null);
  const [modalDetail, setModalDetail] = useState<OrderRow | null>(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [sortKey, setSortKey] = useState<SortKey>(null);
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [copyToast, setCopyToast] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [updatedRows, setUpdatedRows] = useState<Set<string>>(new Set());
  const prevStatusRef = useRef<Record<string, string>>({});
  const [, setTick] = useState(0);

  const fetchOrders = useCallback(() => {
    if (!user) return;
    fetch("/api/orders")
      .then((r) => r.json())
      .then((json) => {
        if (json.success) {
          const newOrders: OrderRow[] = json.data ?? [];
          setOrders((prev) => {
            const flash = new Set<string>();
            for (const o of newOrders) {
              const prevStatus = prevStatusRef.current[o.id];
              if (prevStatus && prevStatus !== o.status) {
                flash.add(o.id);
              }
              prevStatusRef.current[o.id] = o.status;
            }
            if (flash.size > 0) {
              setUpdatedRows(flash);
              setTimeout(() => setUpdatedRows(new Set()), 2000);
            }
            return newOrders;
          });
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user]);

  useEffect(() => {
    if (!sessionLoading && user) {
      fetchOrders();
    } else if (!sessionLoading && !user) {
      setLoading(false);
    }
  }, [sessionLoading, user, fetchOrders]);

  useEffect(() => {
    if (!user) return;
    const hasActive = orders.some((o) =>
      o.status === "CREATED" || o.status === "TRADE_SENT" || o.status === "PAYMENT_PENDING" || o.status === "TRADE_COMPLETED"
    );
    if (hasActive) {
      pollRef.current = setInterval(fetchOrders, 10000);
    }
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [user, orders, fetchOrders]);

  useEffect(() => {
    const hasPendingExpiry = orders.some(
      (o) => o.status === "TRADE_SENT" && o.tradeSentAt && !isOrderExpired(o)
    );
    if (!hasPendingExpiry) return;
    const timer = setInterval(() => setTick((t) => t + 1), 5000);
    return () => clearInterval(timer);
  }, [orders]);

  const handleCopyId = useCallback((e: React.MouseEvent, orderNumber: string) => {
    e.stopPropagation();
    navigator.clipboard.writeText(orderNumber);
    setCopyToast(true);
    setTimeout(() => setCopyToast(false), 1800);
  }, []);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  };

  const filtered = useMemo(() => {
    let result = orders;
    if (activeFilter !== "all") {
      result = result.filter((o) => o.status === activeFilter);
    }
    if (methodFilter !== "all") {
      result = result.filter((o) => o.paymentMethod?.type === methodFilter);
    }
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter((o) => o.orderNumber.toLowerCase().includes(q));
    }
    return result;
  }, [orders, activeFilter, methodFilter, search]);

  const sorted = useMemo(() => {
    if (!sortKey) return filtered;
    const arr = [...filtered];
    const dir = sortDir === "asc" ? 1 : -1;
    arr.sort((a, b) => {
      switch (sortKey) {
        case "date": return dir * (new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        case "amount": return dir * (parseFloat(a.totalAmount) - parseFloat(b.totalAmount));
        case "status": return dir * ((STATUS_ORDER[a.status] ?? 0) - (STATUS_ORDER[b.status] ?? 0));
        case "items": return dir * (a.itemCount - b.itemCount);
        default: return 0;
      }
    });
    return arr;
  }, [filtered, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / ITEMS_PER_PAGE));
  const currentPage = Math.min(page, totalPages);
  const paginated = sorted.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  useEffect(() => { setPage(1); }, [activeFilter, search, methodFilter]);

  const countByStatus = useMemo(() => {
    const m: Record<string, number> = {};
    for (const o of orders) {
      m[o.status] = (m[o.status] ?? 0) + 1;
    }
    return m;
  }, [orders]);

  const totalEarned = useMemo(() =>
    orders.filter((o) => o.status === "PAID" || o.status === "TRADE_COMPLETED")
      .reduce((s, o) => s + parseFloat(o.totalAmount), 0),
    [orders]
  );

  const pendingAmount = useMemo(() =>
    orders.filter((o) => o.status === "CREATED" || o.status === "TRADE_SENT" || o.status === "PAYMENT_PENDING")
      .reduce((s, o) => s + parseFloat(o.totalAmount), 0),
    [orders]
  );

  const completedCount = useMemo(() =>
    orders.filter((o) => o.status === "PAID" || o.status === "TRADE_COMPLETED").length,
    [orders]
  );

  const chartData = useMemo(() => {
    const days = chartPeriod === "7d" ? 7 : 30;
    const now = new Date();
    const buckets = Array(days).fill(0);
    for (const o of orders) {
      if (o.status !== "PAID" && o.status !== "TRADE_COMPLETED") continue;
      const d = new Date(o.createdAt);
      const diffDays = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
      if (diffDays >= 0 && diffDays < days) {
        buckets[days - 1 - diffDays] += parseFloat(o.totalAmount);
      }
    }
    return buckets;
  }, [orders, chartPeriod]);

  const sparkData = useMemo(() => {
    const now = new Date();
    const totalSpark: number[] = [];
    const earnedSpark: number[] = [];
    const pendingSpark: number[] = [];
    const completedSpark: number[] = [];
    for (let i = 6; i >= 0; i--) {
      const dayStart = new Date(now);
      dayStart.setDate(dayStart.getDate() - i);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(dayStart);
      dayEnd.setDate(dayEnd.getDate() + 1);
      const dayOrders = orders.filter((o) => {
        const d = new Date(o.createdAt);
        return d >= dayStart && d < dayEnd;
      });
      totalSpark.push(dayOrders.length);
      earnedSpark.push(dayOrders.filter((o) => o.status === "PAID" || o.status === "TRADE_COMPLETED").reduce((s, o) => s + parseFloat(o.totalAmount), 0));
      pendingSpark.push(dayOrders.filter((o) => o.status === "CREATED" || o.status === "TRADE_SENT" || o.status === "PAYMENT_PENDING").reduce((s, o) => s + parseFloat(o.totalAmount), 0));
      completedSpark.push(dayOrders.filter((o) => o.status === "PAID" || o.status === "TRADE_COMPLETED").length);
    }
    return { totalSpark, earnedSpark, pendingSpark, completedSpark };
  }, [orders]);

  const handleStatClick = (filter: FilterKey) => {
    setActiveFilter(filter);
    setPage(1);
  };

  const openModal = async (order: OrderRow) => {
    setModalOrder(order);
    setModalDetail(null);
    setModalLoading(true);
    try {
      const r = await fetch(`/api/orders/${order.id}`);
      const json = await r.json();
      if (json.success) {
        setModalDetail(json.data);
      }
    } catch { /* ignore */ }
    setModalLoading(false);
  };

  const closeModal = () => {
    setModalOrder(null);
    setModalDetail(null);
  };

  if (!sessionLoading && !user) {
    return (
      <main className="ord">
        <div className="ord-hero">
          <div className="ord-hero__decor">
            <div className="ord-hero__circle ord-hero__circle--1"></div>
            <div className="ord-hero__circle ord-hero__circle--2"></div>
            <div className="ord-hero__grid"></div>
          </div>
          <div className="container">
            <div className="ord-hero__inner">
              <div className="ord-hero__left">
                <h1>{t("title")}</h1>
                <p>{t("subtitle")}</p>
              </div>
            </div>
          </div>
        </div>
        <div className="container">
          <div className="ord-empty ord-chart-gap">
            <div className="ord-empty__icon">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <rect x="3" y="3" width="18" height="18" rx="2" /><path d="M3 9h18M9 21V9" />
              </svg>
            </div>
            <h3>{t("signInPrompt")}</h3>
            <p>&nbsp;</p>
            <form action="/api/auth/steam" method="get">
              <button type="submit" className="ord-top__btn">{t("signInBtn")}</button>
            </form>
          </div>
        </div>
      </main>
    );
  }

  const hasOrders = orders.length > 0;
  const hasResults = sorted.length > 0;
  const isSearching = search.trim().length > 0 || activeFilter !== "all" || methodFilter !== "all";

  const detail = modalDetail ?? modalOrder;
  const detailDisplayStatus = detail ? getDisplayStatus(detail) : "";
  const isCancelled = detailDisplayStatus === "TRADE_CANCELLED";
  const isExpired = detailDisplayStatus === "EXPIRED";
  const activeStep = detail ? getTimelineIndex(detail.status) : 0;

  function thClass(key: SortKey) {
    let cls = "ord-th--sortable";
    if (sortKey === key) cls += " ord-th--active";
    if (sortKey === key && sortDir === "asc") cls += " ord-th--asc";
    return cls;
  }

  return (
    <main className="ord">
      <CopyToast show={copyToast} />

      {/* Hero header */}
      <div className="ord-hero">
        <div className="ord-hero__decor">
          <div className="ord-hero__circle ord-hero__circle--1"></div>
          <div className="ord-hero__circle ord-hero__circle--2"></div>
          <div className="ord-hero__grid"></div>
        </div>
        <div className="container">
          <div className="ord-hero__inner">
            <div className="ord-hero__left">
              <h1>{t("title")}</h1>
              <p>{t("subtitle")}</p>
            </div>
            <Link href="/sell" className="ord-hero__btn">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
              <span>{t("ctaSell")}</span>
            </Link>
          </div>

          {/* Stats - clickable + sparklines */}
          <div className="ord-stats">
            <button type="button" className={`ord-stat ord-stat--clickable${activeFilter === "all" ? " ord-stat--active" : ""}`} onClick={() => handleStatClick("all")}>
              <div className="ord-stat__icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" /><path d="M3 9h18M9 21V9" /></svg>
              </div>
              <div className="ord-stat__body">
                <span className="ord-stat__label">{t("statsTotal")}</span>
                <span className="ord-stat__val">{loading ? "-" : orders.length}</span>
                {!loading && <Sparkline data={sparkData.totalSpark} color="#6366f1" />}
              </div>
            </button>
            <button type="button" className="ord-stat ord-stat--clickable" onClick={() => handleStatClick("PAID")}>
              <div className="ord-stat__icon ord-stat__icon--green">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg>
              </div>
              <div className="ord-stat__body">
                <span className="ord-stat__label">{t("statsEarned")}</span>
                <span className="ord-stat__val">{loading ? "-" : <>{totalEarned.toFixed(2)}<small>$</small></>}</span>
                {!loading && <Sparkline data={sparkData.earnedSpark} color="#22c55e" />}
              </div>
            </button>
            <button type="button" className={`ord-stat ord-stat--clickable${activeFilter === "CREATED" ? " ord-stat--active" : ""}`} onClick={() => handleStatClick("CREATED")}>
              <div className="ord-stat__icon ord-stat__icon--amber">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
              </div>
              <div className="ord-stat__body">
                <span className="ord-stat__label">{t("statsPending")}</span>
                <span className="ord-stat__val">{loading ? "-" : <>{pendingAmount.toFixed(2)}<small>$</small></>}</span>
                {!loading && <Sparkline data={sparkData.pendingSpark} color="#f59e0b" />}
              </div>
            </button>
            <button type="button" className={`ord-stat ord-stat--clickable${activeFilter === "PAID" ? " ord-stat--active" : ""}`} onClick={() => handleStatClick("PAID")}>
              <div className="ord-stat__icon ord-stat__icon--emerald">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12" /></svg>
              </div>
              <div className="ord-stat__body">
                <span className="ord-stat__label">{t("statsCompleted")}</span>
                <span className="ord-stat__val">{loading ? "-" : completedCount}</span>
                {!loading && <Sparkline data={sparkData.completedSpark} color="#10b981" />}
              </div>
            </button>
          </div>
        </div>
      </div>

      <div className="container">
        {/* Earnings chart */}
        {hasOrders && (
          <div className="ord-chart-gap">
            <MiniChart data={chartData} period={chartPeriod} onToggle={setChartPeriod} />
          </div>
        )}

        {/* Toolbar */}
        <div className={`ord-toolbar${hasOrders ? "" : " ord-toolbar--no-chart"}`}>
          <div className="ord-filters">
            {FILTER_TABS.map((tab) => {
              const count = tab.key === "all" ? orders.length : (countByStatus[tab.key] ?? 0);
              return (
                <button
                  key={tab.key}
                  type="button"
                  className={`ord-fil${activeFilter === tab.key ? " active" : ""}`}
                  onClick={() => setActiveFilter(tab.key)}
                >
                  {tab.dot && <span className={`ord-fil__dot ${tab.dot}`}></span>}
                  <span>{t(tab.i18n)}</span>
                  {count > 0 && <span className="ord-fil__count">{count}</span>}
                </button>
              );
            })}
          </div>
          <div className="ord-toolbar__right">
            {hasOrders && (
              <button type="button" className="ord-export-btn" onClick={() => exportCSV(filtered)}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
                CSV
              </button>
            )}
            <div className="ord-method-filter">
              <select value={methodFilter} onChange={(e) => setMethodFilter(e.target.value)}>
                <option value="all">{t("colMethod")}</option>
                <option value="crypto">Crypto</option>
                <option value="card">Card</option>
                <option value="balance">Balance</option>
                <option value="bank">Bank</option>
              </select>
            </div>
            <div className="ord-search">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
              <input
                type="text"
                placeholder={t("search")}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
        </div>

        {loading ? (
          <div className="ord-empty">
            <div className="ord-empty__icon">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <rect x="3" y="3" width="18" height="18" rx="2" /><path d="M3 9h18M9 21V9" />
              </svg>
            </div>
            <h3>{t("loading")}</h3>
            <p>&nbsp;</p>
          </div>
        ) : hasOrders && hasResults ? (
          <>
            <div className="ord-table-wrap">
              <table className="ord-table">
                <thead>
                  <tr>
                    <th>{t("colOrder")}</th>
                    <th className={thClass("date")} onClick={() => handleSort("date")}>
                      {t("colDate")}
                      <span className="ord-th__arrow">
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="6 9 12 15 18 9" /></svg>
                      </span>
                    </th>
                    <th className={thClass("items")} onClick={() => handleSort("items")}>
                      {t("colItems")}
                      <span className="ord-th__arrow">
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="6 9 12 15 18 9" /></svg>
                      </span>
                    </th>
                    <th className={thClass("amount")} onClick={() => handleSort("amount")}>
                      {t("colAmount")}
                      <span className="ord-th__arrow">
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="6 9 12 15 18 9" /></svg>
                      </span>
                    </th>
                    <th>{t("colMethod")}</th>
                    <th className={thClass("status")} onClick={() => handleSort("status")}>
                      {t("colStatus")}
                      <span className="ord-th__arrow">
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="6 9 12 15 18 9" /></svg>
                      </span>
                    </th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {paginated.map((order) => {
                    const rel = formatRelativeDate(order.createdAt);
                    const displayStatus = getDisplayStatus(order);
                    const estimate = PAYOUT_ESTIMATE[displayStatus];
                    const isFlashing = updatedRows.has(order.id);
                    const progress = PROGRESS_PERCENT[displayStatus] ?? 0;
                    const needsAction = NEEDS_ACTION.has(displayStatus);
                    return (
                      <tr
                        key={order.id}
                        className={`ord-row${isFlashing ? " ord-row--flash" : ""}`}
                        data-status={STATUS_DATA_ATTR[displayStatus] ?? "created"}
                        onClick={() => openModal(order)}
                      >
                        <td data-label={t("colOrder")}>
                          <span className="ord-row__id" onClick={(e) => handleCopyId(e, order.orderNumber)} title="Click to copy">
                            #{order.orderNumber}
                            <svg className="ord-row__copy-icon" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></svg>
                          </span>
                        </td>
                        <td data-label={t("colDate")}>
                          <span className="ord-row__date" title={rel.full}>{rel.label}</span>
                        </td>
                        <td data-label={t("colItems")}>
                          <span className="ord-row__items">{order.itemCount} {order.itemCount === 1 ? t("item") : t("items_count")}</span>
                        </td>
                        <td data-label={t("colAmount")}>
                          <span className={amtClass(displayStatus)}>
                            {parseFloat(order.totalAmount).toFixed(2)}<small>$</small>
                          </span>
                        </td>
                        <td data-label={t("colMethod")}>
                          <span className="ord-row__pay">
                            {paymentIcon(order.paymentMethod?.type)}
                            {order.paymentMethod?.name ?? "-"}
                          </span>
                        </td>
                        <td data-label={t("colStatus")}>
                          <div className="ord-status-cell">
                            <span className={`ord-badge ${STATUS_BADGE[displayStatus] ?? "ord-badge--created"}`}>
                              {needsAction && <span className="ord-badge__pulse" />}
                              {STATUS_ICON[displayStatus]}
                              <span>{t(STATUS_I18N[displayStatus] ?? "statusCreated")}</span>
                            </span>
                            {/* estimate removed */}
                          </div>
                        </td>
                        <td>
                          <span className="ord-row__actions">
                            <button className="ord-row__action-btn ord-row__action-btn--view" title={t("view")} onClick={(e) => { e.stopPropagation(); openModal(order); }}>
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
                            </button>
                            {(displayStatus === "TRADE_CANCELLED" || displayStatus === "EXPIRED") && (
                              <Link href="/sell" className="ord-row__action-btn ord-row__action-btn--retry" title="Retry" onClick={(e) => e.stopPropagation()}>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="23 4 23 10 17 10" /><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" /></svg>
                              </Link>
                            )}
                          </span>
                          {/* Mini progress bar */}
                          <div className="ord-row__progress">
                            <div className="ord-row__progress-fill" style={{ width: `${progress}%` }} data-status={STATUS_DATA_ATTR[displayStatus] ?? "created"} />
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="ord-pag">
                <span className="ord-pag__info">
                  {t("showing", { from: (currentPage - 1) * ITEMS_PER_PAGE + 1, to: Math.min(currentPage * ITEMS_PER_PAGE, sorted.length), total: sorted.length })}
                </span>
                <div className="ord-pag__btns">
                  <button type="button" className="ord-pag__btn" disabled={currentPage <= 1} onClick={() => setPage((p) => p - 1)}>
                    <span className="sr-only">{t("prev")}</span>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 18 9 12 15 6" /></svg>
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                    <button key={p} type="button" className={`ord-pag__btn${p === currentPage ? " ord-pag__btn--active" : ""}`} onClick={() => setPage(p)}>{p}</button>
                  ))}
                  <button type="button" className="ord-pag__btn" disabled={currentPage >= totalPages} onClick={() => setPage((p) => p + 1)}>
                    <span className="sr-only">{t("next")}</span>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 18 15 12 9 6" /></svg>
                  </button>
                </div>
              </div>
            )}
          </>
        ) : hasOrders && !hasResults && isSearching ? (
          <div className="ord-noresults">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /><line x1="8" y1="8" x2="14" y2="14" /><line x1="14" y1="8" x2="8" y2="14" /></svg>
            <p>{t("noResults")}</p>
          </div>
        ) : (
          <div className="ord-empty">
            <div className="ord-empty__icon">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <rect x="3" y="3" width="18" height="18" rx="2" /><path d="M3 9h18M9 21V9" />
              </svg>
            </div>
            <h3>{t("emptyTitle")}</h3>
            <p>{t("emptyDesc")}</p>
            <Link href="/sell" className="ord-top__btn">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
              {t("emptyBtn")}
            </Link>
          </div>
        )}
      </div>

      {/* ═══ ORDER DETAILS MODAL ═══ */}
      {modalOrder && (
        <div className="ord-modal-overlay" onClick={closeModal}>
          <div className="ord-modal" onClick={(e) => e.stopPropagation()}>
            <button className="ord-modal__close" onClick={closeModal}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
            </button>

            {modalLoading && !modalDetail ? (
              <div className="ord-modal__loading">
                <div className="ord-modal__spinner" />
                <span>{t("loading")}</span>
              </div>
            ) : detail ? (
              <>
                <div className="ord-modal__header">
                  <div className="ord-modal__header-left">
                    <h2>#{detail.orderNumber}</h2>
                    <span className="ord-modal__date">
                      {new Date(detail.createdAt).toLocaleDateString(locale === "ru" ? "ru-RU" : "en-US", { month: "long", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                  <span className={`ord-badge ${STATUS_BADGE[detailDisplayStatus] ?? "ord-badge--created"}`}>
                    {STATUS_ICON[detailDisplayStatus]}
                    <span>{t(STATUS_I18N[detailDisplayStatus] ?? "statusCreated")}</span>
                  </span>
                </div>

                {!isCancelled && !isExpired && (
                  <div className="ord-modal__timeline">
                    {TIMELINE_STEPS.map((step, i) => {
                      const isDone = i < activeStep;
                      const isActive = i === activeStep;
                      let cls = "ord-modal__tl-step";
                      if (isDone) cls += " ord-modal__tl-step--done";
                      else if (isActive) cls += " ord-modal__tl-step--active";
                      return (
                        <Fragment key={step}>
                          <div className={cls}>
                            <div className="ord-modal__tl-dot">
                              {isDone && <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12" /></svg>}
                            </div>
                            <span className="ord-modal__tl-label">{TIMELINE_LABELS[step]}</span>
                          </div>
                          {i < TIMELINE_STEPS.length - 1 && <div className={`ord-modal__tl-line${isDone ? " ord-modal__tl-line--done" : ""}`} />}
                        </Fragment>
                      );
                    })}
                  </div>
                )}

                <div className="ord-modal__summary">
                  <div className="ord-modal__summary-item">
                    <span className="ord-modal__summary-label">{t("colAmount")}</span>
                    <span className="ord-modal__summary-val ord-modal__summary-val--big">
                      {parseFloat(detail.totalAmount).toFixed(2)}<small>$</small>
                    </span>
                  </div>
                  <div className="ord-modal__summary-item">
                    <span className="ord-modal__summary-label">{t("colItems")}</span>
                    <span className="ord-modal__summary-val">{detail.itemCount || (modalDetail?.items ?? []).length || "-"}</span>
                  </div>
                  <div className="ord-modal__summary-item">
                    <span className="ord-modal__summary-label">{t("colMethod")}</span>
                    <span className="ord-modal__summary-val">
                      {paymentIcon(detail.paymentMethod?.type)}
                      {detail.paymentMethod?.name ?? "-"}
                    </span>
                  </div>
                </div>

                {(modalDetail?.items ?? []).length > 0 && (
                  <div className="ord-modal__items">
                    <h4 className="ord-modal__section-title">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" /></svg>
                      Items
                    </h4>
                    <div className="ord-modal__items-list">
                      {(modalDetail?.items ?? []).map((item) => (
                        <div className="ord-modal__item" key={item.id}>
                          <div className="ord-modal__item-img">
                            {item.imageUrl ? (
                              <img src={item.imageUrl} alt={item.name} loading="lazy" />
                            ) : (
                              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" opacity="0.3"><rect x="3" y="3" width="18" height="18" rx="2" /></svg>
                            )}
                          </div>
                          <div className="ord-modal__item-info">
                            <span className="ord-modal__item-name">{item.name}</span>
                            <span className="ord-modal__item-meta">{item.game}{item.condition ? ` · ${item.condition}` : ""}</span>
                          </div>
                          <span className="ord-modal__item-price">{parseFloat(item.buyoutPrice).toFixed(2)}<small>$</small></span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="ord-modal__actions">
                  <Link href={`/order/${detail.id}` as `/order/${string}`} className="ord-modal__action-btn ord-modal__action-btn--primary" onClick={closeModal}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
                    {t("view")}
                  </Link>
                  {(isCancelled || isExpired) && (
                    <Link href="/sell" className="ord-modal__action-btn ord-modal__action-btn--retry" onClick={closeModal}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="23 4 23 10 17 10" /><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" /></svg>
                      Retry
                    </Link>
                  )}
                  <button className="ord-modal__action-btn ord-modal__action-btn--support" onClick={() => window.open("mailto:support@skinsell.com", "_blank")}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>
                    Support
                  </button>
                </div>
              </>
            ) : null}
          </div>
        </div>
      )}
    </main>
  );
}
