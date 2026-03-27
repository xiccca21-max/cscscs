"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";

import "@/styles/skinwave-order.css";

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

type OrderData = {
  id: string;
  orderNumber: string;
  status: string;
  totalAmount: string;
  currency: string;
  tradeUrl: string;
  createdAt: string;
  items: OrderItem[];
  paymentMethod: { name: string; type: string } | null;
  botAccount: { steamProfileUrl: string; steamId: string; name?: string } | null;
  steamProfileUrl?: string;
};

const TIMELINE_STEPS = ["CREATED", "TRADE_SENT", "TRADE_COMPLETED", "PAID"];

function getTimelineIndex(status: string): number {
  const idx = TIMELINE_STEPS.indexOf(status);
  return idx >= 0 ? idx : 0;
}

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

export default function OrderPage({
  params,
}: {
  params: Promise<{ id: string; locale: string }>;
}) {
  const t = useTranslations("order");
  const [order, setOrder] = useState<OrderData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [orderId, setOrderId] = useState<string>("");

  useEffect(() => {
    params.then((p) => {
      setOrderId(p.id);
      fetch(`/api/orders/${p.id}`)
        .then((r) => r.json())
        .then((json) => {
          if (json.success) {
            setOrder(json.data);
          } else {
            setError(json.error ?? "Not found");
          }
        })
        .catch(() => setError("Network error"))
        .finally(() => setLoading(false));
    });
  }, [params]);

  if (loading) {
    return (
      <main className="order-page">
        <div className="container">
          <div className="order-loading">
            <div className="order-spinner" />
          </div>
        </div>
      </main>
    );
  }

  if (error || !order) {
    return (
      <main className="order-page">
        <div className="container">
          <div className="order-header">
            <div className="order-header__left">
              <Link href="/orders" className="order-header__back">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6" /></svg>
                Back to orders
              </Link>
              <h1 className="order-header__title">{t("title")} <span className="order-header__id">#{orderId}</span></h1>
            </div>
          </div>
          <div className="order-error card">
            <p>{error ?? "Not found"}</p>
            <Link href="/sell" className="btn btn--primary">Create New Order</Link>
          </div>
        </div>
      </main>
    );
  }

  const activeStep = getTimelineIndex(order.status);
  const isCancelled = order.status === "TRADE_CANCELLED";
  const isPaid = order.status === "PAID";
  const isPaymentPending = order.status === "PAYMENT_PENDING";
  const totalAmount = parseFloat(order.totalAmount).toFixed(2);

  return (
    <main className="order-page">
      <div className="container">

        {/* Order header */}
        <div className="order-header">
          <div className="order-header__left">
            <Link href="/orders" className="order-header__back">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6" /></svg>
              Back to orders
            </Link>
            <h1 className="order-header__title">{t("title")} <span className="order-header__id">#{order.orderNumber}</span></h1>
            <span className="order-header__date">Created: {new Date(order.createdAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" })}</span>
          </div>
          <div className="order-header__status">
            <span className={`status-badge ${STATUS_CSS[order.status] ?? "status-badge--created"}`}>
              {STATUS_LABEL[order.status] ?? order.status}
            </span>
          </div>
        </div>

        {/* Status timeline */}
        {!isCancelled && (
          <div className="order-timeline">
            <div className={`timeline-step${activeStep >= 0 ? " active" : ""}`}>
              <div className="timeline-step__dot" />
              <span className="timeline-step__label">Order Created</span>
            </div>
            <div className="timeline-step__line" />
            <div className={`timeline-step${activeStep >= 1 ? " active" : ""}`}>
              <div className="timeline-step__dot" />
              <span className="timeline-step__label">Trade Sent</span>
            </div>
            <div className="timeline-step__line" />
            <div className={`timeline-step${activeStep >= 2 ? " active" : ""}`}>
              <div className="timeline-step__dot" />
              <span className="timeline-step__label">Items Received</span>
            </div>
            <div className="timeline-step__line" />
            <div className={`timeline-step${activeStep >= 3 ? " active" : ""}`}>
              <div className="timeline-step__dot" />
              <span className="timeline-step__label">Paid</span>
            </div>
          </div>
        )}

        <div className="order-grid">

          {/* Order details */}
          <div className="order-details card">
            <h3>{t("title")} Details</h3>

            <div className="order-info-grid">
              <div className="order-info-item">
                <span className="order-info-item__label">{t("orderId")}</span>
                <span className="order-info-item__value">#{order.orderNumber}</span>
              </div>
              <div className="order-info-item">
                <span className="order-info-item__label">{t("status")}</span>
                <span className="order-info-item__value">
                  <span className={`status-badge ${STATUS_CSS[order.status] ?? "status-badge--created"}`}>
                    {STATUS_LABEL[order.status] ?? order.status}
                  </span>
                </span>
              </div>
              <div className="order-info-item">
                <span className="order-info-item__label">Steam Profile</span>
                <span className="order-info-item__value">
                  {order.steamProfileUrl ? (
                    <a href={order.steamProfileUrl} className="link" target="_blank" rel="noopener noreferrer">
                      {order.steamProfileUrl.replace(/^https?:\/\//, "")}
                    </a>
                  ) : (
                    <span className="link">—</span>
                  )}
                </span>
              </div>
              <div className="order-info-item">
                <span className="order-info-item__label">{t("paymentMethod")}</span>
                <span className="order-info-item__value">
                  {order.paymentMethod ? order.paymentMethod.name : "—"}
                </span>
              </div>
              <div className="order-info-item">
                <span className="order-info-item__label">{t("items")}</span>
                <span className="order-info-item__value">{order.items.length} items</span>
              </div>
              <div className="order-info-item">
                <span className="order-info-item__label">{t("total")}</span>
                <span className="order-info-item__value order-info-item__value--accent">{totalAmount}$</span>
              </div>
            </div>
          </div>

          {/* Bot / Trade info */}
          <div className="order-trade card">
            <h3>Trade Information</h3>

            {!order.botAccount ? (
              <div className="order-trade__waiting">
                <div className="order-trade__waiting-icon">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
                </div>
                <p>Waiting for operator to assign a trade bot...</p>
                <span className="order-trade__hint">You will receive a trade offer once an operator processes your order.</span>
              </div>
            ) : (
              <div className="order-trade__ready">
                <div className="order-trade__bot">
                  <div className="order-trade__bot-avatar"><span>B</span></div>
                  <div className="order-trade__bot-info">
                    <span className="order-trade__bot-name">{order.botAccount.name ?? "SKINWAVE Bot"}</span>
                    <a href={order.botAccount.steamProfileUrl} className="link order-trade__bot-link" target="_blank" rel="noopener noreferrer">View Steam Profile</a>
                  </div>
                </div>
                <a href={order.botAccount.steamProfileUrl} className="btn btn--primary btn--lg order-trade__steam-btn" target="_blank" rel="noopener noreferrer">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 2 11 13" /><path d="m22 2-7 20-4-9-9-4 20-7z" /></svg>
                  {t("openTrade")}
                </a>
                <p className="order-trade__note">Accept the trade offer in Steam to proceed with your order.</p>
              </div>
            )}
          </div>

        </div>

        {/* Order items */}
        <div className="order-items card">
          <h3>{t("items")} in This Order</h3>
          <div className="order-items__list">
            {order.items.map((item) => (
              <div className="order-item" key={item.id}>
                <div className="order-item__img">
                  {item.imageUrl ? (
                    <img src={item.imageUrl} alt={item.name} width={32} height={32} />
                  ) : (
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" opacity="0.3"><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><path d="m21 15-5-5L5 21" /></svg>
                  )}
                </div>
                <div className="order-item__info">
                  <span className="order-item__name">{item.name}</span>
                  <span className="order-item__meta">{item.game}{item.condition ? ` \u2022 ${item.condition}` : ""}</span>
                </div>
                <span className="order-item__price">{parseFloat(item.buyoutPrice).toFixed(2)}$</span>
              </div>
            ))}
          </div>
          <div className="order-items__total">
            <span>Total</span>
            <span>{totalAmount}$</span>
          </div>
        </div>

        {/* Cancelled state */}
        {isCancelled && (
          <div className="order-cancelled">
            <div className="order-cancelled__icon">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" /></svg>
            </div>
            <h3>Order Cancelled</h3>
            <p>This order has been cancelled. The trade was not completed.</p>
            <div className="order-cancelled__actions">
              <Link href="/sell" className="btn btn--primary">Create New Order</Link>
            </div>
          </div>
        )}

        {/* Payment waiting state */}
        {isPaymentPending && (
          <div className="order-payment-waiting">
            <div className="order-payment-waiting__icon">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
            </div>
            <h3>Payment Processing</h3>
            <p>Items received successfully! Your payout is being processed. Expected time: <strong>up to 30 minutes</strong>.</p>
          </div>
        )}

        {/* Paid state */}
        {isPaid && (
          <div className="order-paid">
            <div className="order-paid__icon">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>
            </div>
            <h3>Payment Complete!</h3>
            <p>{totalAmount}$ has been sent to your {order.paymentMethod?.name ?? "account"}.</p>
            <Link href="/sell" className="btn btn--primary">Sell More Skins</Link>
          </div>
        )}

      </div>
    </main>
  );
}
