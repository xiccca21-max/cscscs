"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";

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

const STATUS_CSS: Record<string, string> = {
  CREATED: "status-badge--created",
  TRADE_SENT: "status-badge--trade-sent",
  TRADE_COMPLETED: "status-badge--completed",
  PAYMENT_PENDING: "status-badge--pending",
  PAID: "status-badge--paid",
  TRADE_CANCELLED: "status-badge--cancelled",
};

const STATUS_LABEL: Record<string, string> = {
  CREATED: "Created",
  TRADE_SENT: "Trade Sent",
  TRADE_COMPLETED: "Completed",
  PAYMENT_PENDING: "Processing",
  PAID: "Paid",
  TRADE_CANCELLED: "Cancelled",
};

const FILTER_TABS = [
  { key: "all", label: "All" },
  { key: "CREATED", label: "Created" },
  { key: "TRADE_SENT", label: "Trade Sent" },
  { key: "TRADE_COMPLETED", label: "Completed" },
  { key: "PAID", label: "Paid" },
  { key: "TRADE_CANCELLED", label: "Cancelled" },
] as const;

type FilterKey = (typeof FILTER_TABS)[number]["key"];

function paymentIcon(type: string | undefined) {
  switch (type) {
    case "crypto":
      return (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="10" /></svg>
      );
    case "card":
      return (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="1" y="4" width="22" height="16" rx="2" /><line x1="1" y1="10" x2="23" y2="10" /></svg>
      );
    case "bank":
      return (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg>
      );
    case "balance":
      return (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2" /><path d="M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4" /></svg>
      );
    default:
      return (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="1" y="4" width="22" height="16" rx="2" /><line x1="1" y1="10" x2="23" y2="10" /></svg>
      );
  }
}

export default function OrdersPage() {
  const t = useTranslations("orders");
  const { user, loading: sessionLoading } = useSession();
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<FilterKey>("all");

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

  const filtered = activeFilter === "all"
    ? orders
    : orders.filter((o) => o.status === activeFilter);

  if (!sessionLoading && !user) {
    return (
      <main className="orders-page">
        <div className="container">
          <div className="orders-header">
            <div className="orders-header__left">
              <h1>{t("title")}</h1>
              <p>{t("subtitle")}</p>
            </div>
          </div>
          <div className="orders-empty">
            <p>Please sign in to view your orders.</p>
            <form action="/api/auth/steam" method="get">
              <button type="submit" className="btn btn--primary">Sign in with Steam</button>
            </form>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="orders-page">
      <div className="container">

        <div className="orders-header">
          <div className="orders-header__left">
            <h1>{t("title")}</h1>
            <p>{t("subtitle")}</p>
          </div>
          <Link href="/sell" className="btn btn--primary">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
            New Order
          </Link>
        </div>

        {/* Status filter tabs */}
        <div className="orders-filters">
          {FILTER_TABS.map((tab) => (
            <button
              key={tab.key}
              type="button"
              className={`orders-filter${activeFilter === tab.key ? " active" : ""}`}
              onClick={() => setActiveFilter(tab.key)}
            >
              {tab.label}
              {tab.key === "all" && orders.length > 0 && (
                <span className="orders-filter__count">{orders.length}</span>
              )}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="orders-loading">
            <div className="orders-spinner" />
          </div>
        ) : filtered.length > 0 ? (
          /* Orders table */
          <div className="orders-table-wrap">
            <table className="orders-table">
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Date</th>
                  <th>Items</th>
                  <th>Amount</th>
                  <th>Payment</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((order) => (
                  <tr key={order.id} className="orders-row" data-status={order.status.toLowerCase()}>
                    <td>
                      <Link href={`/order/${order.id}` as `/order/${string}`} className="orders-row__id">
                        #{order.orderNumber}
                      </Link>
                    </td>
                    <td className="orders-row__date">
                      {new Date(order.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </td>
                    <td>{order.itemCount} {order.itemCount === 1 ? "item" : "items"}</td>
                    <td className="orders-row__amount">{parseFloat(order.totalAmount).toFixed(2)}$</td>
                    <td>
                      <span className="orders-row__method">
                        {paymentIcon(order.paymentMethod?.type)}
                        {order.paymentMethod?.name ?? "—"}
                      </span>
                    </td>
                    <td>
                      <span className={`status-badge ${STATUS_CSS[order.status] ?? "status-badge--created"}`}>
                        {STATUS_LABEL[order.status] ?? order.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          /* Empty state */
          <div className="orders-empty">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" opacity="0.3">
              <rect x="3" y="3" width="18" height="18" rx="2" /><path d="M3 9h18M9 21V9" />
            </svg>
            <h3>No orders yet</h3>
            <p>Start selling your skins to see orders here</p>
            <Link href="/sell" className="btn btn--primary">Start Selling</Link>
          </div>
        )}

      </div>
    </main>
  );
}
