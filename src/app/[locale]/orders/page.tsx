"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { useTranslations, useLocale } from "next-intl";

import "@/styles/skinwave-orders.css";

import { useSession } from "@/components/session-provider";
import { Link } from "@/i18n/navigation";

type OrderRow = {
  id: string;
  orderNumber: string;
  status: string;
  totalAmount: string;
  currency: string;
  createdAt: string;
  itemCount: number;
  paymentMethod: { name: string; type: string } | null;
};

const STATUS_BADGE: Record<string, string> = {
  CREATED: "ord-badge--created",
  TRADE_SENT: "ord-badge--sent",
  TRADE_COMPLETED: "ord-badge--paid",
  PAYMENT_PENDING: "ord-badge--sent",
  PAID: "ord-badge--paid",
  TRADE_CANCELLED: "ord-badge--cancelled",
};

const STATUS_I18N: Record<string, string> = {
  CREATED: "statusCreated",
  TRADE_SENT: "statusTradeSent",
  TRADE_COMPLETED: "statusCompleted",
  PAYMENT_PENDING: "statusProcessing",
  PAID: "statusPaid",
  TRADE_CANCELLED: "statusCancelled",
};

const STATUS_DATA_ATTR: Record<string, string> = {
  CREATED: "created",
  TRADE_SENT: "trade_sent",
  TRADE_COMPLETED: "paid",
  PAYMENT_PENDING: "trade_sent",
  PAID: "paid",
  TRADE_CANCELLED: "cancelled",
};

const FILTER_TABS = [
  { key: "all", i18n: "filterAll", dot: null },
  { key: "CREATED", i18n: "filterCreated", dot: "ord-fil__dot--created" },
  { key: "TRADE_SENT", i18n: "filterTradeSent", dot: "ord-fil__dot--sent" },
  { key: "PAID", i18n: "filterPaid", dot: "ord-fil__dot--paid" },
  { key: "TRADE_CANCELLED", i18n: "filterCancelled", dot: "ord-fil__dot--cancelled" },
] as const;

type FilterKey = (typeof FILTER_TABS)[number]["key"];

const ITEMS_PER_PAGE = 10;

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

// formatRelativeDate moved inside component for i18n access

function amtClass(status: string): string {
  if (status === "PAID" || status === "TRADE_COMPLETED") return "ord-row__amt ord-row__amt--paid";
  if (status === "TRADE_CANCELLED") return "ord-row__amt ord-row__amt--cancelled";
  return "ord-row__amt";
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

  useEffect(() => {
    if (!sessionLoading && user) {
      fetch("/api/orders")
        .then((r) => r.json())
        .then((json) => {
          if (json.success) {
            setOrders(json.data ?? []);
          }
        })
        .catch(() => {})
        .finally(() => setLoading(false));
    } else if (!sessionLoading && !user) {
      setLoading(false);
    }
  }, [sessionLoading, user]);

  const filtered = useMemo(() => {
    let result = orders;
    if (activeFilter !== "all") {
      result = result.filter((o) => o.status === activeFilter);
    }
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter((o) => o.orderNumber.toLowerCase().includes(q));
    }
    return result;
  }, [orders, activeFilter, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const currentPage = Math.min(page, totalPages);
  const paginated = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  useEffect(() => { setPage(1); }, [activeFilter, search]);

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
          <div className="ord-empty" style={{ marginTop: 68 }}>
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
  const hasResults = filtered.length > 0;
  const isSearching = search.trim().length > 0 || activeFilter !== "all";

  return (
    <main className="ord">
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

          {/* Stats inside hero */}
          <div className="ord-stats">
            <div className="ord-stat">
              <div className="ord-stat__icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" /><path d="M3 9h18M9 21V9" /></svg>
              </div>
              <div className="ord-stat__body">
                <span className="ord-stat__label">{t("statsTotal")}</span>
                <span className="ord-stat__val">{loading ? "–" : orders.length}</span>
              </div>
            </div>
            <div className="ord-stat">
              <div className="ord-stat__icon ord-stat__icon--green">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg>
              </div>
              <div className="ord-stat__body">
                <span className="ord-stat__label">{t("statsEarned")}</span>
                <span className="ord-stat__val">{loading ? "–" : <>{totalEarned.toFixed(2)}<small>$</small></>}</span>
              </div>
            </div>
            <div className="ord-stat">
              <div className="ord-stat__icon ord-stat__icon--amber">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
              </div>
              <div className="ord-stat__body">
                <span className="ord-stat__label">{t("statsPending")}</span>
                <span className="ord-stat__val">{loading ? "–" : <>{pendingAmount.toFixed(2)}<small>$</small></>}</span>
              </div>
            </div>
            <div className="ord-stat">
              <div className="ord-stat__icon ord-stat__icon--emerald">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12" /></svg>
              </div>
              <div className="ord-stat__body">
                <span className="ord-stat__label">{t("statsCompleted")}</span>
                <span className="ord-stat__val">{loading ? "–" : completedCount}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container">
        {/* Toolbar: filters + search */}
        <div className="ord-toolbar">
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
            {/* Orders table */}
            <div className="ord-table-wrap">
              <table className="ord-table">
                <thead>
                  <tr>
                    <th>{t("colOrder")}</th>
                    <th>{t("colDate")}</th>
                    <th>{t("colItems")}</th>
                    <th>{t("colAmount")}</th>
                    <th>{t("colMethod")}</th>
                    <th>{t("colStatus")}</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {paginated.map((order) => {
                    const rel = formatRelativeDate(order.createdAt);
                    const isPaid = order.status === "PAID" || order.status === "TRADE_COMPLETED";
                    return (
                      <tr
                        key={order.id}
                        className="ord-row"
                        data-status={STATUS_DATA_ATTR[order.status] ?? "created"}
                      >
                        <td data-label="Order ID">
                          <Link href={`/order/${order.id}` as `/order/${string}`}>
                            <span className="ord-row__id">#{order.orderNumber}</span>
                          </Link>
                        </td>
                        <td data-label="Date">
                          <span className="ord-row__date" title={rel.full}>{rel.label}</span>
                        </td>
                        <td data-label="Items">
                          <span className="ord-row__items">{order.itemCount} {order.itemCount === 1 ? t("item") : t("items_count")}</span>
                        </td>
                        <td data-label="Amount">
                          <span className={amtClass(order.status)}>
                            {parseFloat(order.totalAmount).toFixed(2)}<small>$</small>
                          </span>
                        </td>
                        <td data-label="Payment">
                          <span className="ord-row__pay">
                            {paymentIcon(order.paymentMethod?.type)}
                            {order.paymentMethod?.name ?? "—"}
                          </span>
                        </td>
                        <td data-label="Status">
                          <span className={`ord-badge ${STATUS_BADGE[order.status] ?? "ord-badge--created"}`}>
                            {isPaid && (
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12" /></svg>
                            )}
                            <span>{t(STATUS_I18N[order.status] ?? "statusCreated")}</span>
                          </span>
                        </td>
                        <td>
                          <Link href={`/order/${order.id}` as `/order/${string}`}>
                            <span className="ord-row__view">
                              <span>{t("view")}</span>
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 18 15 12 9 6" /></svg>
                            </span>
                          </Link>
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
                  {t("showing", { from: (currentPage - 1) * ITEMS_PER_PAGE + 1, to: Math.min(currentPage * ITEMS_PER_PAGE, filtered.length), total: filtered.length })}
                </span>
                <div className="ord-pag__btns">
                  <button
                    type="button"
                    className="ord-pag__btn"
                    disabled={currentPage <= 1}
                    onClick={() => setPage((p) => p - 1)}
                  >
                    <span className="sr-only">{t("prev")}</span>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 18 9 12 15 6" /></svg>
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                    <button
                      key={p}
                      type="button"
                      className={`ord-pag__btn${p === currentPage ? " ord-pag__btn--active" : ""}`}
                      onClick={() => setPage(p)}
                    >
                      {p}
                    </button>
                  ))}
                  <button
                    type="button"
                    className="ord-pag__btn"
                    disabled={currentPage >= totalPages}
                    onClick={() => setPage((p) => p + 1)}
                  >
                    <span className="sr-only">{t("next")}</span>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 18 15 12 9 6" /></svg>
                  </button>
                </div>
              </div>
            )}
          </>
        ) : hasOrders && !hasResults && isSearching ? (
          /* No results for search/filter */
          <div className="ord-noresults">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /><line x1="8" y1="8" x2="14" y2="14" /><line x1="14" y1="8" x2="8" y2="14" /></svg>
            <p>{t("noResults")}</p>
          </div>
        ) : (
          /* Empty state */
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
    </main>
  );
}
