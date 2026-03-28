"use client";

import React, { Fragment, useEffect, useState } from "react";
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
  botAccount: {
    steamProfileUrl: string;
    steamId: string;
    name?: string;
  } | null;
  steamProfileUrl?: string;
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
  PAYMENT_PENDING: "odr-status--pending",
  PAID: "odr-status--paid",
  TRADE_CANCELLED: "odr-status--cancelled",
};

const STATUS_LABEL_KEYS: Record<string, string> = {
  CREATED: "status.created",
  TRADE_SENT: "status.tradeSent",
  TRADE_COMPLETED: "status.received",
  PAYMENT_PENDING: "status.pending",
  PAID: "status.paid",
  TRADE_CANCELLED: "status.cancelled",
};

const STEP_LABEL_KEYS = [
  "step.created",
  "step.tradeSent",
  "step.received",
  "step.paid",
];

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
  const [copied, setCopied] = useState(false);

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

  const handleCopyOrderId = () => {
    navigator.clipboard.writeText(order?.orderNumber ?? orderId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <main className="odr">
        <div className="container">
          <div
            className="odr-state"
            style={{ marginTop: 60 }}
          >
            <div
              className="odr-state__icon"
              style={{
                background: "rgba(99,102,241,0.1)",
                color: "#6366f1",
              }}
            >
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
            </div>
            <h3>{t("loading")}</h3>
          </div>
        </div>
      </main>
    );
  }

  if (error || !order) {
    return (
      <main className="odr">
        <div className="container">
          <div
            className="odr-head odr-fade"
            style={{ "--delay": 0 } as React.CSSProperties}
          >
            <nav className="odr-crumbs">
              <Link href="/orders">{t("breadcrumb.orders")}</Link>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="9 18 15 12 9 6" />
              </svg>
              <span>#{orderId}</span>
            </nav>
            <div className="odr-head__left">
              <h1>
                <span>{t("heading")}</span>{" "}
                <span className="odr-head__id">#{orderId}</span>
              </h1>
            </div>
          </div>
          <div
            className="odr-state odr-state--cancel odr-fade"
            style={{ "--delay": 1 } as React.CSSProperties}
          >
            <div className="odr-state__icon">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <circle cx="12" cy="12" r="10" />
                <line x1="15" y1="9" x2="9" y2="15" />
                <line x1="9" y1="9" x2="15" y2="15" />
              </svg>
            </div>
            <h3>{error ?? "Not found"}</h3>
            <p>{t("state.cancelledDesc")}</p>
            <Link href="/sell" className="odr-btn">
              {t("state.newOrder")}
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const activeStep = getTimelineIndex(order.status);
  const isCancelled = order.status === "TRADE_CANCELLED";
  const isPaid = order.status === "PAID";
  const isPaymentPending =
    order.status === "PAYMENT_PENDING" ||
    order.status === "TRADE_COMPLETED";
  const totalAmount = parseFloat(order.totalAmount).toFixed(2);
  const createdDate = new Date(order.createdAt).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <main className="odr">
      <div className="container">
        {/* ── Head ── */}
        <div
          className="odr-head odr-fade"
          style={{ "--delay": 0 } as React.CSSProperties}
        >
          <nav className="odr-crumbs">
            <Link href="/orders">{t("breadcrumb.orders")}</Link>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="9 18 15 12 9 6" />
            </svg>
            <span>#{order.orderNumber}</span>
          </nav>
          <div className="odr-head__left">
            <h1>
              <span>{t("heading")}</span>{" "}
              <span className="odr-head__id">#{order.orderNumber}</span>
              <button
                className={`odr-copy${copied ? " odr-copy--done" : ""}`}
                title={t("copyOrderIdTitle")}
                onClick={handleCopyOrderId}
              >
                <svg className="odr-copy__icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="9" y="9" width="13" height="13" rx="2" />
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                </svg>
                <svg className="odr-copy__check" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </button>
            </h1>
            <div className="odr-head__sub">
              <span className="odr-head__date">
                {t("createdLabel")} {createdDate}
              </span>
              <span className="odr-refresh">
                <span className="odr-refresh__dot"></span>
                <span>{t("updated")}</span>{" "}
                <span>{t("justNow")}</span>
              </span>
            </div>
          </div>
          <span
            className={`odr-status ${STATUS_CSS[order.status] ?? "odr-status--created"}`}
          >
            {t(STATUS_LABEL_KEYS[order.status] ?? "status.created")}
          </span>
        </div>

        {/* ── Timeline ── */}
        {!isCancelled && (
          <div
            className="odr-tl odr-fade"
            style={{ "--delay": 1 } as React.CSSProperties}
          >
            <div className="odr-tl__decor">
              <div className="odr-tl__decor-circle odr-tl__decor-circle--1"></div>
              <div className="odr-tl__decor-circle odr-tl__decor-circle--2"></div>
              <div className="odr-tl__decor-grid"></div>
            </div>
            <div className="odr-tl__progress">
              Step {activeStep + 1} of {TIMELINE_STEPS.length}
            </div>
            <div className="odr-tl__steps">
              {TIMELINE_STEPS.map((step, i) => {
                const isDone = i < activeStep;
                const isActive = i === activeStep;
                let stepClass = "odr-tl__step";
                if (isDone) stepClass += " odr-tl__step--done";
                else if (isActive) stepClass += " odr-tl__step--active";

                return (
                  <Fragment key={step}>
                    <div className={stepClass}>
                      <div className="odr-tl__dot">
                        {isDone && (
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        )}
                      </div>
                      <span className="odr-tl__label">
                        {t(STEP_LABEL_KEYS[i])}
                      </span>
                      <span className="odr-tl__time">&mdash;</span>
                    </div>
                    {i < TIMELINE_STEPS.length - 1 && (
                      <div className="odr-tl__line"></div>
                    )}
                  </Fragment>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Two-column grid ── */}
        <div
          className="odr-grid odr-fade"
          style={{ "--delay": 2 } as React.CSSProperties}
        >
          {/* Order Details */}
          <div className="odr-card">
            <h3 className="odr-card__title">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
                <polyline points="10 9 9 9 8 9" />
              </svg>
              <span>{t("details")}</span>
            </h3>
            <div className="odr-fields odr-fields--list">
              <div className="odr-field odr-field--row">
                <span className="odr-field__label">{t("field.orderId")}</span>
                <span className="odr-field__val">#{order.orderNumber}</span>
              </div>
              <div className="odr-field odr-field--row">
                <span className="odr-field__label">{t("field.status")}</span>
                <span className="odr-field__val">
                  <span
                    className={`odr-status ${STATUS_CSS[order.status] ?? "odr-status--created"} odr-status--sm`}
                  >
                    {t(STATUS_LABEL_KEYS[order.status] ?? "status.created")}
                  </span>
                </span>
              </div>
              <div className="odr-field odr-field--row">
                <span className="odr-field__label">
                  {t("field.steamProfile")}
                </span>
                {order.steamProfileUrl ? (
                  <a
                    href={order.steamProfileUrl}
                    className="odr-field__link"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                      <polyline points="15 3 21 3 21 9" />
                      <line x1="10" y1="14" x2="21" y2="3" />
                    </svg>
                    {order.steamProfileUrl.replace(/^https?:\/\//, "")}
                  </a>
                ) : (
                  <span className="odr-field__val">&mdash;</span>
                )}
              </div>
              <div className="odr-field odr-field--row">
                <span className="odr-field__label">
                  {t("field.paymentMethod")}
                </span>
                <span className="odr-field__val odr-field__val--chip">
                  {order.paymentMethod ? order.paymentMethod.name : "\u2014"}
                </span>
              </div>
              <div className="odr-field odr-field--row">
                <span className="odr-field__label">
                  {t("field.totalItems")}
                </span>
                <span className="odr-field__val odr-field__val--chip odr-field__val--chip-neutral">
                  {order.items.length} items
                </span>
              </div>
              <div className="odr-field odr-field--row">
                <span className="odr-field__label">
                  {t("field.totalAmount")}
                </span>
                <span className="odr-field__val odr-field__val--big">
                  {totalAmount}
                  <small>$</small>
                </span>
              </div>
            </div>
            <div className="odr-card__actions">
              <button className="odr-card__action-btn">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
                <span>{t("viewPayerDetails")}</span>
              </button>
            </div>
          </div>

          {/* Trade Information */}
          <div className="odr-card">
            <h3 className="odr-card__title">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="17 1 21 5 17 9" />
                <path d="M3 11V9a4 4 0 0 1 4-4h14" />
                <polyline points="7 23 3 19 7 15" />
                <path d="M21 13v2a4 4 0 0 1-4 4H3" />
              </svg>
              <span>{t("tradeInfo")}</span>
            </h3>

            {!order.botAccount ? (
              <div className="odr-trade-wait odr-trade-wait--v2">
                <div className="odr-trade-wait__visual">
                  <div className="odr-trade-wait__pulse"></div>
                  <div className="odr-trade-wait__icon-wrap">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10" />
                      <polyline points="12 6 12 12 16 14" />
                    </svg>
                  </div>
                </div>
                <div className="odr-trade-wait__text">
                  <p className="odr-trade-wait__title">
                    <span>{t("tradeWaitTitle")}</span>
                    <span className="odr-dots"></span>
                  </p>
                  <span className="odr-trade-wait__hint">
                    {t("tradeWaitHint")}
                  </span>
                </div>
                <div className="odr-trade-wait__bar">
                  <div className="odr-trade-wait__bar-fill"></div>
                </div>
              </div>
            ) : (
              <div className="odr-trade-ready">
                <div className="odr-trade-bot">
                  <div className="odr-trade-bot__avatar">B</div>
                  <div className="odr-trade-bot__info">
                    <span className="odr-trade-bot__name">
                      {order.botAccount.name ?? "SKINWAVE Bot"}
                    </span>
                    <a
                      href={order.botAccount.steamProfileUrl}
                      className="odr-link"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {t("viewSteamProfile")}
                    </a>
                  </div>
                </div>
                <a
                  href={order.botAccount.steamProfileUrl}
                  className="odr-steam-btn"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M22 2 11 13" />
                    <path d="m22 2-7 20-4-9-9-4 20-7z" />
                  </svg>
                  <span>{t("openTradeSteam")}</span>
                </a>
                <p className="odr-trade-note">{t("tradeNote")}</p>
              </div>
            )}
          </div>
        </div>

        {/* ── Items list ── */}
        <div
          className="odr-card odr-fade"
          style={{ "--delay": 3 } as React.CSSProperties}
        >
          <h3 className="odr-card__title">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
              <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
              <line x1="12" y1="22.08" x2="12" y2="12" />
            </svg>
            <span>{t("items")}</span>
            <span className="odr-card__count">{order.items.length}</span>
          </h3>
          <div className="odr-items">
            {order.items.map((item) => (
              <div
                className="odr-item"
                key={item.id}
                data-rarity={item.quality?.toLowerCase()}
              >
                <div className="odr-item__img">
                  {item.imageUrl ? (
                    <img
                      src={item.imageUrl}
                      alt={item.name}
                      loading="lazy"
                    />
                  ) : (
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" opacity="0.3">
                      <rect x="3" y="3" width="18" height="18" rx="2" />
                      <circle cx="8.5" cy="8.5" r="1.5" />
                      <path d="m21 15-5-5L5 21" />
                    </svg>
                  )}
                </div>
                <div className="odr-item__info">
                  <span className="odr-item__name">{item.name}</span>
                  <span className="odr-item__meta">
                    {item.game}
                    {item.condition ? ` \u2022 ${item.condition}` : ""}
                  </span>
                </div>
                <span className="odr-item__price">
                  {parseFloat(item.buyoutPrice).toFixed(2)}
                  <small>$</small>
                </span>
              </div>
            ))}
          </div>
          <div className="odr-total">
            <span>{t("total")}</span>
            <span>
              {totalAmount}
              <small>$</small>
            </span>
          </div>
        </div>

        {/* ── Need Help? ── */}
        <div
          className="odr-help odr-fade"
          style={{ "--delay": 5 } as React.CSSProperties}
        >
          <div className="odr-help__decor">
            <div className="odr-help__decor-circle"></div>
            <div className="odr-help__decor-grid"></div>
          </div>
          <div className="odr-help__icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
              <circle cx="12" cy="17" r=".5" fill="currentColor" />
            </svg>
          </div>
          <div className="odr-help__text">
            <span>{t("needHelp")}</span>
            <Link href="/faq">{t("visitFaq")}</Link> {t("helpOr")}{" "}
            <a href="#">{t("contactSupport")}</a>
          </div>
          <a href="#" className="odr-help__btn">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
            <span>{t("chat")}</span>
          </a>
        </div>

        {/* ── Cancelled state ── */}
        {isCancelled && (
          <div
            className="odr-state odr-state--cancel odr-fade"
            style={{ "--delay": 4 } as React.CSSProperties}
          >
            <div className="odr-state__icon">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <circle cx="12" cy="12" r="10" />
                <line x1="15" y1="9" x2="9" y2="15" />
                <line x1="9" y1="9" x2="15" y2="15" />
              </svg>
            </div>
            <h3>{t("state.cancelledTitle")}</h3>
            <p>{t("state.cancelledDesc")}</p>
            <div className="odr-state__actions">
              <Link href="/sell" className="odr-btn">
                {t("state.newOrder")}
              </Link>
              <button className="odr-btn odr-btn--outline">
                {t("state.retryOrder")}
              </button>
            </div>
          </div>
        )}

        {/* ── Payment waiting ── */}
        {isPaymentPending && (
          <div
            className="odr-state odr-state--pending odr-fade"
            style={{ "--delay": 4 } as React.CSSProperties}
          >
            <div className="odr-state__icon">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
            </div>
            <h3>{t("state.paymentTitle")}</h3>
            <p>
              {t("state.paymentDesc")}
            </p>
          </div>
        )}

        {/* ── Paid ── */}
        {isPaid && (
          <div
            className="odr-state odr-state--paid odr-fade"
            style={{ "--delay": 4 } as React.CSSProperties}
          >
            <div className="odr-state__icon">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
            </div>
            <h3>{t("state.paidTitle")}</h3>
            <p>
              {totalAmount}$ {t("state.paidDescSuffix")}
            </p>
            <Link href="/sell" className="odr-btn">
              {t("state.sellMore")}
            </Link>
          </div>
        )}
      </div>
    </main>
  );
}
