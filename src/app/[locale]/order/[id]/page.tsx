"use client";

import { useEffect, useState, use } from "react";
import { useSession } from "@/components/session-provider";
import { Link } from "@/i18n/navigation";
import "@/styles/skinwave-order.css";

type OrderItem = {
  name: string;
  price: number;
  imageUrl: string | null;
  wear: string | null;
};

type OrderData = {
  id: string;
  createdAt: string;
  status: string;
  items: OrderItem[];
  paymentMethod: { type: string; name: string } | null;
  totalAmount: number;
  tradeUrl: string | null;
};

const TIMELINE_STEPS = ["CREATED", "TRADE_SENT", "TRADE_COMPLETED", "PAID"];

function getTimelineIndex(status: string): number {
  const idx = TIMELINE_STEPS.indexOf(status);
  return idx >= 0 ? idx : 0;
}

const STATUS_CSS: Record<string, string> = {
  CREATED: "odr-status--created",
  TRADE_SENT: "odr-status--trade-sent",
  TRADE_COMPLETED: "odr-status--received",
  PAYMENT_PENDING: "odr-status--trade-sent",
  PAID: "odr-status--paid",
  TRADE_CANCELLED: "odr-status--cancelled",
};

const STATUS_LABEL: Record<string, string> = {
  CREATED: "Created",
  TRADE_SENT: "Trade Sent",
  TRADE_COMPLETED: "Received",
  PAYMENT_PENDING: "Processing",
  PAID: "Paid",
  TRADE_CANCELLED: "Cancelled",
};

const STEP_LABELS = ["Order Created", "Trade Offer Sent", "Items Received", "Payment Processed"];

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false });
}

export default function OrderPage({
  params,
}: {
  params: Promise<{ id: string; locale: string }>;
}) {
  const { id: orderId } = use(params);
  const { user } = useSession();

  const [order, setOrder] = useState<OrderData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [payerModalOpen, setPayerModalOpen] = useState(false);

  useEffect(() => {
    fetch(`/api/orders/${orderId}`)
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
  }, [orderId]);

  const handleCopy = () => {
    navigator.clipboard.writeText(orderId).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  if (loading) {
    return (
      <main className="odr">
        <div className="container">
          <div style={{ display: "flex", justifyContent: "center", padding: "80px 0" }}>
            <div className="odr-trade-wait odr-trade-wait--v2">
              <div className="odr-trade-wait__visual">
                <div className="odr-trade-wait__pulse" />
                <div className="odr-trade-wait__icon-wrap">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
                </div>
              </div>
              <div className="odr-trade-wait__text">
                <p className="odr-trade-wait__title">Loading order<span className="odr-dots" /></p>
              </div>
              <div className="odr-trade-wait__bar">
                <div className="odr-trade-wait__bar-fill" />
              </div>
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (error || !order) {
    return (
      <main className="odr">
        <div className="container">
          <div className="odr-state odr-state--cancel">
            <div className="odr-state__icon">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" /></svg>
            </div>
            <h3>{error ?? "Order not found"}</h3>
            <p>Could not load order details. Please try again.</p>
            <div className="odr-state__actions">
              <Link href="/sell" className="odr-btn">Create New Order</Link>
            </div>
          </div>
        </div>
      </main>
    );
  }

  const activeStep = getTimelineIndex(order.status);
  const isCancelled = order.status === "TRADE_CANCELLED";
  const isPaid = order.status === "PAID";
  const isPaymentPending = order.status === "PAYMENT_PENDING";
  const totalAmount = Number(order.totalAmount).toFixed(2);
  const createdTime = formatTime(order.createdAt);

  return (
    <main className="odr">
      <div className="container">

        {/* ── PAGE HEADER ── */}
        <div className="odr-head odr-fade" style={{ "--delay": 0 } as React.CSSProperties}>
          <nav className="odr-crumbs">
            <Link href="/orders">My Orders</Link>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6" /></svg>
            <span>#{order.id}</span>
          </nav>
          <div className="odr-head__left">
            <h1>
              Order{" "}
              <span className="odr-head__id">#{order.id}</span>
              <button
                className={`odr-copy${copied ? " odr-copy--done" : ""}`}
                title="Copy Order ID"
                onClick={handleCopy}
              >
                <svg className="odr-copy__icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></svg>
                <svg className="odr-copy__check" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>
              </button>
            </h1>
            <div className="odr-head__sub">
              <span className="odr-head__date">Created: {formatDate(order.createdAt)}</span>
              <span className="odr-refresh">
                <span className="odr-refresh__dot" />
                Updated <span>just now</span>
              </span>
            </div>
          </div>
          <span className={`odr-status ${STATUS_CSS[order.status] ?? "odr-status--created"}`}>
            {STATUS_LABEL[order.status] ?? order.status}
          </span>
        </div>

        {/* ── TIMELINE ── */}
        {!isCancelled && (
          <div className="odr-tl odr-fade" style={{ "--delay": 1 } as React.CSSProperties}>
            <div className="odr-tl__decor">
              <div className="odr-tl__decor-circle odr-tl__decor-circle--1" />
              <div className="odr-tl__decor-circle odr-tl__decor-circle--2" />
              <div className="odr-tl__decor-grid" />
            </div>
            <div className="odr-tl__progress">Step {activeStep + 1} of 4</div>
            <div className="odr-tl__steps">
              {STEP_LABELS.map((label, i) => {
                const isDone = i < activeStep || isPaid;
                const isActive = i === activeStep && !isPaid;
                const stepClass = [
                  "odr-tl__step",
                  isDone ? "odr-tl__step--done" : "",
                  isActive ? "odr-tl__step--active" : "",
                ].filter(Boolean).join(" ");

                return (
                  <div key={label} style={{ display: "contents" }}>
                    {i > 0 && <div className="odr-tl__line" />}
                    <div className={stepClass}>
                      <div className="odr-tl__dot">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12" /></svg>
                      </div>
                      <span className="odr-tl__label">{label}</span>
                      <span className="odr-tl__time">{isDone ? createdTime : "—"}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── TWO-COLUMN GRID ── */}
        <div className="odr-grid odr-fade" style={{ "--delay": 2 } as React.CSSProperties}>

          {/* Order Details */}
          <div className="odr-card">
            <h3 className="odr-card__title">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><polyline points="10 9 9 9 8 9" /></svg>
              <span>Order Details</span>
            </h3>
            <div className="odr-fields odr-fields--list">
              <div className="odr-field odr-field--row">
                <span className="odr-field__label">Order ID</span>
                <span className="odr-field__val">#{order.id}</span>
              </div>
              <div className="odr-field odr-field--row">
                <span className="odr-field__label">Status</span>
                <span className="odr-field__val">
                  <span className={`odr-status ${STATUS_CSS[order.status] ?? "odr-status--created"} odr-status--sm`}>
                    {STATUS_LABEL[order.status] ?? order.status}
                  </span>
                </span>
              </div>
              {order.tradeUrl && (
                <div className="odr-field odr-field--row">
                  <span className="odr-field__label">Trade URL</span>
                  <a href={order.tradeUrl} className="odr-field__link" target="_blank" rel="noopener noreferrer">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /><polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" /></svg>
                    Open Trade URL
                  </a>
                </div>
              )}
              <div className="odr-field odr-field--row">
                <span className="odr-field__label">Payment Method</span>
                <span className="odr-field__val odr-field__val--chip">
                  {order.paymentMethod ? order.paymentMethod.name : "—"}
                </span>
              </div>
              <div className="odr-field odr-field--row">
                <span className="odr-field__label">Total Items</span>
                <span className="odr-field__val odr-field__val--chip odr-field__val--chip-neutral">
                  {order.items.length} items
                </span>
              </div>
              <div className="odr-field odr-field--row">
                <span className="odr-field__label">Total Amount</span>
                <span className="odr-field__val odr-field__val--big">{totalAmount}<small>$</small></span>
              </div>
            </div>
            <div className="odr-card__actions">
              <button className="odr-card__action-btn" onClick={() => setPayerModalOpen(true)}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
                <span>View Payer Details</span>
              </button>
            </div>
          </div>

          {/* Trade Information */}
          <div className="odr-card">
            <h3 className="odr-card__title">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="17 1 21 5 17 9" /><path d="M3 11V9a4 4 0 0 1 4-4h14" /><polyline points="7 23 3 19 7 15" /><path d="M21 13v2a4 4 0 0 1-4 4H3" /></svg>
              <span>Trade Information</span>
            </h3>

            {/* Waiting state */}
            <div className="odr-trade-wait odr-trade-wait--v2">
              <div className="odr-trade-wait__visual">
                <div className="odr-trade-wait__pulse" />
                <div className="odr-trade-wait__icon-wrap">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
                </div>
              </div>
              <div className="odr-trade-wait__text">
                <p className="odr-trade-wait__title">Waiting for Trade Offer<span className="odr-dots" /></p>
                <span className="odr-trade-wait__hint">A trade bot will be assigned shortly. You&apos;ll receive a Steam trade offer once an operator processes your order.</span>
              </div>
              <div className="odr-trade-wait__bar">
                <div className="odr-trade-wait__bar-fill" />
              </div>
            </div>
          </div>
        </div>

        {/* ── ITEMS LIST ── */}
        <div className="odr-card odr-fade" style={{ "--delay": 3 } as React.CSSProperties}>
          <h3 className="odr-card__title">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" /><polyline points="3.27 6.96 12 12.01 20.73 6.96" /><line x1="12" y1="22.08" x2="12" y2="12" /></svg>
            <span>Items in This Order</span>
            <span className="odr-card__count">{order.items.length}</span>
          </h3>
          <div className="odr-items">
            {order.items.map((item, i) => (
              <div className="odr-item" key={i}>
                <div className="odr-item__img">
                  {item.imageUrl ? (
                    <img src={item.imageUrl} alt={item.name} loading="lazy" />
                  ) : (
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" opacity="0.3"><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><path d="m21 15-5-5L5 21" /></svg>
                  )}
                </div>
                <div className="odr-item__info">
                  <span className="odr-item__name">{item.name}</span>
                  {item.wear && <span className="odr-item__meta">CS2 &bull; {item.wear}</span>}
                </div>
                <span className="odr-item__price">{Number(item.price).toFixed(2)}<small>$</small></span>
              </div>
            ))}
          </div>
          <div className="odr-total">
            <span>Total</span>
            <span>{totalAmount}<small>$</small></span>
          </div>
        </div>

        {/* ── NEED HELP ── */}
        <div className="odr-help odr-fade" style={{ "--delay": 5 } as React.CSSProperties}>
          <div className="odr-help__decor">
            <div className="odr-help__decor-circle" />
            <div className="odr-help__decor-grid" />
          </div>
          <div className="odr-help__icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" /><circle cx="12" cy="17" r=".5" fill="currentColor" /></svg>
          </div>
          <div className="odr-help__text">
            <span>Need help with this order?</span>
            <Link href="/faq">Visit FAQ</Link> or <a href="#">Contact Support</a>
          </div>
          <a href="#" className="odr-help__btn">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>
            <span>Chat</span>
          </a>
        </div>

        {/* ── CANCELLED STATE ── */}
        {isCancelled && (
          <div className="odr-state odr-state--cancel">
            <div className="odr-state__icon">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" /></svg>
            </div>
            <h3>Order Cancelled</h3>
            <p>This order has been cancelled. The trade was not completed.</p>
            <div className="odr-state__actions">
              <Link href="/sell" className="odr-btn">Create New Order</Link>
              <button className="odr-btn odr-btn--outline">Retry This Order</button>
            </div>
          </div>
        )}

        {/* ── PAYMENT WAITING ── */}
        {isPaymentPending && (
          <div className="odr-state odr-state--pending">
            <div className="odr-state__icon">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
            </div>
            <h3>Payment Processing</h3>
            <p>Items received successfully! Your payout is being processed. Expected time: <strong>up to 30 minutes</strong>.</p>
          </div>
        )}

        {/* ── PAID ── */}
        {isPaid && (
          <div className="odr-state odr-state--paid">
            <div className="odr-state__icon">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>
            </div>
            <h3>Payment Complete!</h3>
            <p>{totalAmount}$ has been sent to your {order.paymentMethod?.name ?? "account"}.</p>
            <Link href="/sell" className="odr-btn">Sell More Skins</Link>
          </div>
        )}

      </div>

      {/* ── PAYER DETAILS MODAL ── */}
      <div
        className={`odr-modal-overlay${payerModalOpen ? " active" : ""}`}
        onClick={(e) => { if (e.target === e.currentTarget) setPayerModalOpen(false); }}
      >
        <div className="odr-modal">
          <div className="odr-modal__accent" />
          <div className="odr-modal__head">
            <div className="odr-modal__head-left">
              <div className="odr-modal__avatar">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
              </div>
              <div>
                <h3>Payer Details</h3>
                <span className="odr-modal__sub">Order #{order.id}</span>
              </div>
            </div>
            <button className="odr-modal__close" onClick={() => setPayerModalOpen(false)}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
            </button>
          </div>
          <div className="odr-modal__fields">
            <div className="odr-modal__field">
              <div className="odr-modal__field-head">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="17 1 21 5 17 9" /><path d="M3 11V9a4 4 0 0 1 4-4h14" /><polyline points="7 23 3 19 7 15" /><path d="M21 13v2a4 4 0 0 1-4 4H3" /></svg>
                <span className="odr-modal__label">Payment Method</span>
              </div>
              <span className="odr-modal__val">{order.paymentMethod?.name ?? "—"}</span>
            </div>
            {order.tradeUrl && (
              <div className="odr-modal__field">
                <div className="odr-modal__field-head">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="17 1 21 5 17 9" /><path d="M3 11V9a4 4 0 0 1 4-4h14" /><polyline points="7 23 3 19 7 15" /><path d="M21 13v2a4 4 0 0 1-4 4H3" /></svg>
                  <span className="odr-modal__label">Steam Trade URL</span>
                </div>
                <div className="odr-modal__copyable">
                  <span className="odr-modal__val odr-modal__val--mono">{order.tradeUrl}</span>
                  <ModalCopyButton text={order.tradeUrl} />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}

function ModalCopyButton({ text }: { text: string }) {
  const [done, setDone] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(text).then(() => {
      setDone(true);
      setTimeout(() => setDone(false), 2000);
    });
  };

  return (
    <button className={`odr-modal__copy${done ? " odr-modal__copy--done" : ""}`} onClick={handleCopy}>
      <svg className="odr-modal__copy-ico" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></svg>
      <svg className="odr-modal__copy-check" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>
    </button>
  );
}
