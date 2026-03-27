"use client";

import { useEffect, useState, useMemo, useCallback } from "react";

import "@/styles/skinwave-orders.css";

import { useSession } from "@/components/session-provider";
import { Link, useRouter } from "@/i18n/navigation";

type OrderItem = {
  id: string;
  price?: number | string;
  buyoutPrice?: number | string;
  name?: string;
};

type PaymentMethod = {
  type: string;
  name?: string;
};

type Order = {
  id: string;
  orderNumber?: string;
  createdAt: string;
  status: string;
  items: OrderItem[];
  totalAmount?: string | number;
  paymentMethod?: PaymentMethod | null;
  currency?: string;
};

type NormalizedOrder = Order & {
  _status: StatusInfo;
  _amount: number;
};

type StatusInfo = {
  dataStatus: string;
  badgeClass: string;
  label: string;
};

const STATUS_MAP: Record<string, StatusInfo> = {
  created: { dataStatus: "created", badgeClass: "ord-badge--created", label: "Created" },
  CREATED: { dataStatus: "created", badgeClass: "ord-badge--created", label: "Created" },
  trade_sent: { dataStatus: "trade_sent", badgeClass: "ord-badge--sent", label: "Trade Sent" },
  TRADE_SENT: { dataStatus: "trade_sent", badgeClass: "ord-badge--sent", label: "Trade Sent" },
  paid: { dataStatus: "paid", badgeClass: "ord-badge--paid", label: "Paid" },
  PAID: { dataStatus: "paid", badgeClass: "ord-badge--paid", label: "Paid" },
  cancelled: { dataStatus: "cancelled", badgeClass: "ord-badge--cancelled", label: "Cancelled" },
  TRADE_CANCELLED: { dataStatus: "cancelled", badgeClass: "ord-badge--cancelled", label: "Cancelled" },
  pending: { dataStatus: "created", badgeClass: "ord-badge--created", label: "Created" },
  processing: { dataStatus: "trade_sent", badgeClass: "ord-badge--sent", label: "Trade Sent" },
  completed: { dataStatus: "paid", badgeClass: "ord-badge--paid", label: "Paid" },
  TRADE_COMPLETED: { dataStatus: "paid", badgeClass: "ord-badge--paid", label: "Completed" },
  PAYMENT_PENDING: { dataStatus: "trade_sent", badgeClass: "ord-badge--sent", label: "Processing" },
};

const FILTER_TABS = [
  { key: "all", label: "All", dotClass: "" },
  { key: "created", label: "Created", dotClass: "ord-fil__dot--created" },
  { key: "trade_sent", label: "Trade Sent", dotClass: "ord-fil__dot--sent" },
  { key: "paid", label: "Paid", dotClass: "ord-fil__dot--paid" },
  { key: "cancelled", label: "Cancelled", dotClass: "ord-fil__dot--cancelled" },
] as const;

type FilterKey = (typeof FILTER_TABS)[number]["key"];
type SortKey = "date" | "amount" | null;
type SortDir = "asc" | "desc";

const PER_PAGE = 5;

function getStatusInfo(status: string): StatusInfo {
  return STATUS_MAP[status] ?? { dataStatus: "created", badgeClass: "ord-badge--created", label: status };
}

function getOrderAmount(order: Order): number {
  if (order.totalAmount != null) return Number(order.totalAmount);
  return order.items.reduce((sum, item) => sum + Number(item.buyoutPrice ?? item.price ?? 0), 0);
}

function formatRelativeDate(dateStr: string): { relative: string; full: string } {
  const d = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const full = d.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });

  if (diffDays === 0) return { relative: "Today", full };
  if (diffDays === 1) return { relative: "Yesterday", full };
  if (diffDays < 30) return { relative: `${diffDays} days ago`, full };
  return { relative: full, full };
}

function paymentIcon(type: string | undefined) {
  switch (type) {
    case "crypto":
      return (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
        </svg>
      );
    case "card":
      return (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="1" y="4" width="22" height="16" rx="2" />
          <line x1="1" y1="10" x2="23" y2="10" />
        </svg>
      );
    case "balance":
      return (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2" />
          <path d="M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4" />
        </svg>
      );
    default:
      return (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="1" y="4" width="22" height="16" rx="2" />
          <line x1="1" y1="10" x2="23" y2="10" />
        </svg>
      );
  }
}

function paymentLabel(pm: PaymentMethod | null | undefined): string {
  if (!pm) return "—";
  if (pm.name) return pm.name;
  switch (pm.type) {
    case "crypto": return "Crypto";
    case "card": return "Visa / MC";
    case "balance": return "Balance";
    default: return pm.type;
  }
}

export default function OrdersPage() {
  const { user, loading: sessionLoading } = useSession();
  const router = useRouter();

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<FilterKey>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("date");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    if (!sessionLoading && user) {
      fetch("/api/orders")
        .then((r) => r.json())
        .then((json) => {
          if (json.success) setOrders(json.data ?? []);
        })
        .catch(() => {})
        .finally(() => setLoading(false));
    } else if (!sessionLoading && !user) {
      setLoading(false);
    }
  }, [sessionLoading, user]);

  const normalizedOrders = useMemo<NormalizedOrder[]>(
    () =>
      orders.map((o) => ({
        ...o,
        _status: getStatusInfo(o.status),
        _amount: getOrderAmount(o),
      })),
    [orders],
  );

  const filtered = useMemo(() => {
    let result = normalizedOrders;
    if (activeFilter !== "all") {
      result = result.filter((o) => o._status.dataStatus === activeFilter);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter((o) => {
        const num = o.orderNumber ?? o.id;
        return (
          num.toLowerCase().includes(q) ||
          `#sw-${num}`.toLowerCase().includes(q) ||
          `#${num}`.toLowerCase().includes(q)
        );
      });
    }
    return result;
  }, [normalizedOrders, activeFilter, searchQuery]);

  const sorted = useMemo(() => {
    if (!sortKey) return filtered;
    return [...filtered].sort((a, b) => {
      let va: string | number, vb: string | number;
      if (sortKey === "date") {
        va = a.createdAt;
        vb = b.createdAt;
      } else {
        va = a._amount;
        vb = b._amount;
      }
      if (va < vb) return sortDir === "asc" ? -1 : 1;
      if (va > vb) return sortDir === "asc" ? 1 : -1;
      return 0;
    });
  }, [filtered, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / PER_PAGE));
  const safePage = Math.min(currentPage, totalPages);
  const paged = sorted.slice((safePage - 1) * PER_PAGE, safePage * PER_PAGE);
  const showStart = sorted.length ? (safePage - 1) * PER_PAGE + 1 : 0;
  const showEnd = Math.min(safePage * PER_PAGE, sorted.length);

  useEffect(() => {
    setCurrentPage(1);
  }, [activeFilter, searchQuery]);

  const handleSort = useCallback(
    (key: "date" | "amount") => {
      if (sortKey === key) {
        setSortDir((d) => (d === "desc" ? "asc" : "desc"));
      } else {
        setSortKey(key);
        setSortDir("desc");
      }
    },
    [sortKey],
  );

  const stats = useMemo(() => {
    const total = normalizedOrders.length;
    const earned = normalizedOrders
      .filter((o) => o._status.dataStatus === "paid")
      .reduce((s, o) => s + o._amount, 0);
    const pending = normalizedOrders
      .filter((o) => o._status.dataStatus === "created" || o._status.dataStatus === "trade_sent")
      .reduce((s, o) => s + o._amount, 0);
    const completed = normalizedOrders.filter((o) => o._status.dataStatus === "paid").length;
    return { total, earned, pending, completed };
  }, [normalizedOrders]);

  const filterCounts = useMemo(() => {
    const counts: Record<string, number> = { all: normalizedOrders.length };
    for (const o of normalizedOrders) {
      const ds = o._status.dataStatus;
      counts[ds] = (counts[ds] ?? 0) + 1;
    }
    return counts;
  }, [normalizedOrders]);

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
                <h1>My Orders</h1>
                <p>Track and manage your skin sale orders</p>
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
            <h3>Please sign in</h3>
            <p>Sign in with Steam to view your orders</p>
            <form action="/api/auth/steam" method="get">
              <button type="submit" className="ord-top__btn">Sign in with Steam</button>
            </form>
          </div>
        </div>
      </main>
    );
  }

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
              <h1>My Orders</h1>
              <p>Track and manage your skin sale orders</p>
            </div>
            <Link href="/sell" className="ord-hero__btn">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              <span>Sell Skins Now</span>
            </Link>
          </div>

          {/* Stats inside hero */}
          <div className="ord-stats">
            <div className="ord-stat">
              <div className="ord-stat__icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="3" width="18" height="18" rx="2" /><path d="M3 9h18M9 21V9" />
                </svg>
              </div>
              <div className="ord-stat__body">
                <span className="ord-stat__label">Total Orders</span>
                <span className="ord-stat__val">{stats.total}</span>
              </div>
            </div>
            <div className="ord-stat">
              <div className="ord-stat__icon ord-stat__icon--green">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="12" y1="1" x2="12" y2="23" />
                  <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                </svg>
              </div>
              <div className="ord-stat__body">
                <span className="ord-stat__label">Total Earned</span>
                <span className="ord-stat__val">{stats.earned.toFixed(2)}<small>$</small></span>
              </div>
            </div>
            <div className="ord-stat">
              <div className="ord-stat__icon ord-stat__icon--amber">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
                </svg>
              </div>
              <div className="ord-stat__body">
                <span className="ord-stat__label">In Progress</span>
                <span className="ord-stat__val">{stats.pending.toFixed(2)}<small>$</small></span>
              </div>
            </div>
            <div className="ord-stat">
              <div className="ord-stat__icon ord-stat__icon--emerald">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <div className="ord-stat__body">
                <span className="ord-stat__label">Completed</span>
                <span className="ord-stat__val">{stats.completed}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container">

        {/* Toolbar: filters + search */}
        <div className="ord-toolbar">
          <div className="ord-filters">
            {FILTER_TABS.map((tab) => (
              <button
                key={tab.key}
                type="button"
                className={`ord-fil${activeFilter === tab.key ? " active" : ""}`}
                onClick={() => setActiveFilter(tab.key)}
              >
                {tab.dotClass && <span className={`ord-fil__dot ${tab.dotClass}`} />}
                <span>{tab.label}</span>
                {(filterCounts[tab.key] ?? 0) > 0 && (
                  <span className="ord-fil__count">{filterCounts[tab.key]}</span>
                )}
              </button>
            ))}
          </div>
          <div className="ord-search">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              placeholder="Search by Order ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {loading ? (
          <div className="ord-empty" style={{ opacity: 0.6 }}>
            <div className="ord-empty__icon">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <rect x="3" y="3" width="18" height="18" rx="2" /><path d="M3 9h18M9 21V9" />
              </svg>
            </div>
            <p>Loading orders...</p>
          </div>
        ) : normalizedOrders.length === 0 ? (
          <div className="ord-empty">
            <div className="ord-empty__icon">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <rect x="3" y="3" width="18" height="18" rx="2" /><path d="M3 9h18M9 21V9" />
              </svg>
            </div>
            <h3>No orders yet</h3>
            <p>Start selling your skins to see orders here</p>
            <Link href="/sell" className="ord-top__btn">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              Start Selling
            </Link>
          </div>
        ) : sorted.length === 0 ? (
          <>
            <div className="ord-table-wrap" style={{ display: "none" }} />
            <div className="ord-noresults">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
                <line x1="8" y1="8" x2="14" y2="14" />
                <line x1="14" y1="8" x2="8" y2="14" />
              </svg>
              <p>No orders match your search or filter</p>
            </div>
          </>
        ) : (
          <>
            {/* Orders table */}
            <div className="ord-table-wrap">
              <table className="ord-table">
                <thead>
                  <tr>
                    <th>Order</th>
                    <th
                      className={`ord-th--sortable${sortKey === "date" ? " ord-th--active" : ""}${sortKey === "date" && sortDir === "asc" ? " ord-th--asc" : ""}`}
                      onClick={() => handleSort("date")}
                    >
                      <span>Date</span>{" "}
                      <svg className="ord-th__arrow" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <polyline points="6 9 12 15 18 9" />
                      </svg>
                    </th>
                    <th>Items</th>
                    <th
                      className={`ord-th--sortable${sortKey === "amount" ? " ord-th--active" : ""}${sortKey === "amount" && sortDir === "asc" ? " ord-th--asc" : ""}`}
                      onClick={() => handleSort("amount")}
                    >
                      <span>Amount</span>{" "}
                      <svg className="ord-th__arrow" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <polyline points="6 9 12 15 18 9" />
                      </svg>
                    </th>
                    <th>Method</th>
                    <th>Status</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {paged.map((order) => {
                    const info = order._status;
                    const amount = order._amount;
                    const { relative, full } = formatRelativeDate(order.createdAt);
                    const itemCount = order.items?.length ?? 0;
                    const orderNum = order.orderNumber ?? order.id.slice(0, 8);
                    const amtClass =
                      "ord-row__amt" +
                      (info.dataStatus === "paid" ? " ord-row__amt--paid" : "") +
                      (info.dataStatus === "cancelled" ? " ord-row__amt--cancelled" : "");

                    return (
                      <tr
                        key={order.id}
                        className="ord-row"
                        data-status={info.dataStatus}
                        data-date={order.createdAt.slice(0, 10)}
                        data-amount={amount.toFixed(2)}
                        onClick={() => router.push(`/order/${order.id}` as `/order/${string}`)}
                      >
                        <td data-label="Order ID">
                          <span className="ord-row__id">#{orderNum}</span>
                        </td>
                        <td data-label="Date">
                          <span className="ord-row__date" title={full}>{relative}</span>
                        </td>
                        <td data-label="Items">
                          <span className="ord-row__items">
                            {itemCount} {itemCount === 1 ? "item" : "items"}
                          </span>
                        </td>
                        <td data-label="Amount">
                          <span className={amtClass}>
                            {amount.toFixed(2)}<small>$</small>
                          </span>
                        </td>
                        <td data-label="Payment">
                          <span className="ord-row__pay">
                            <span className="ord-row__pay-icon">
                              {paymentIcon(order.paymentMethod?.type)}
                            </span>
                            {paymentLabel(order.paymentMethod)}
                          </span>
                        </td>
                        <td data-label="Status">
                          <span className={`ord-badge ${info.badgeClass}`}>
                            {info.dataStatus === "paid" && (
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                                <polyline points="20 6 9 17 4 12" />
                              </svg>
                            )}
                            <span>{info.label}</span>
                          </span>
                        </td>
                        <td>
                          <span className="ord-row__view">
                            <span>View</span>{" "}
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                              <polyline points="9 18 15 12 9 6" />
                            </svg>
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="ord-pag">
              <span className="ord-pag__info">
                Showing {showStart}–{showEnd} of {sorted.length} orders
              </span>
              <div className="ord-pag__btns">
                <button
                  type="button"
                  className="ord-pag__btn"
                  disabled={safePage <= 1}
                  onClick={() => setCurrentPage((p) => p - 1)}
                >
                  <span className="sr-only">Previous</span>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <polyline points="15 18 9 12 15 6" />
                  </svg>
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                  <button
                    key={p}
                    type="button"
                    className={`ord-pag__btn${p === safePage ? " ord-pag__btn--active" : ""}`}
                    onClick={() => setCurrentPage(p)}
                  >
                    {p}
                  </button>
                ))}
                <button
                  type="button"
                  className="ord-pag__btn"
                  disabled={safePage >= totalPages}
                  onClick={() => setCurrentPage((p) => p + 1)}
                >
                  <span className="sr-only">Next</span>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </button>
              </div>
            </div>
          </>
        )}

      </div>
    </main>
  );
}
