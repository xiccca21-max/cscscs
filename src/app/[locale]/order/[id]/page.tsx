"use client";

import React, { Fragment, useCallback, useEffect, useRef, useState } from "react";
import { useTranslations, useLocale } from "next-intl";

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
  tradeSentAt?: string;
  items: OrderItem[];
  paymentMethod: { name: string; type: string } | null;
  botAccount: {
    steamProfileUrl: string;
    steamId: string;
    name?: string;
  } | null;
  adminComment?: string;
  steamProfileUrl?: string;
  paymentDetails?: Record<string, string>;
};

type BotProfile = {
  name: string;
  avatarUrl: string;
  level: number;
  profileUrl: string;
};

const TIMELINE_STEPS = ["CREATED", "TRADE_SENT", "TRADE_COMPLETED", "PAID"];

function getTimelineIndex(status: string): number {
  const idx = TIMELINE_STEPS.indexOf(status);
  if (idx < 0) return 0;
  if (status === "TRADE_COMPLETED" || status === "PAYMENT_PENDING") return 3;
  if (status === "PAID") return 4;
  return idx;
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
  const locale = useLocale();
  const [order, setOrder] = useState<OrderData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [orderId, setOrderId] = useState<string>("");
  const [copied, setCopied] = useState(false);
  const [payerModalOpen, setPayerModalOpen] = useState(false);
  const [botProfile, setBotProfile] = useState<BotProfile | null>(null);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [chatSending, setChatSending] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const fetchOrder = useCallback(async (id: string) => {
    try {
      const r = await fetch(`/api/orders/${id}`);
      const json = await r.json();
      if (json.success) {
        setOrder(json.data);
        return json.data as OrderData;
      } else {
        setError(json.error ?? "Not found");
      }
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
    return null;
  }, []);

  useEffect(() => {
    params.then((p) => {
      setOrderId(p.id);
      fetchOrder(p.id);
    });
  }, [params, fetchOrder]);

  useEffect(() => {
    if (!orderId || !order) return;
    const shouldPoll =
      order.status === "CREATED" ||
      order.status === "TRADE_SENT" ||
      order.status === "TRADE_COMPLETED" ||
      order.status === "PAYMENT_PENDING";

    if (shouldPoll) {
      pollRef.current = setInterval(() => fetchOrder(orderId), 5000);
    }
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [orderId, order?.status, fetchOrder]);

  useEffect(() => {
    const url = order?.botAccount?.steamProfileUrl;
    const sid = order?.botAccount?.steamId;
    if (!url && !sid) return;
    const query = url
      ? `url=${encodeURIComponent(url)}`
      : `steamId=${encodeURIComponent(sid!)}`;
    fetch(`/api/steam/profile?${query}`)
      .then((r) => r.json())
      .then((json) => {
        if (json.success) setBotProfile(json.data);
      })
      .catch(() => {});
  }, [order?.botAccount?.steamProfileUrl, order?.botAccount?.steamId]);

  useEffect(() => {
    if (!order?.tradeSentAt || order.status !== "TRADE_SENT") {
      setCountdown(null);
      return;
    }
    const sentTime = new Date(order.tradeSentAt).getTime();
    const deadline = sentTime + 10 * 60 * 1000;

    const tick = () => {
      const remaining = Math.max(0, Math.floor((deadline - Date.now()) / 1000));
      setCountdown(remaining);
      if (remaining <= 0 && timerRef.current) clearInterval(timerRef.current);
    };
    tick();
    timerRef.current = setInterval(tick, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [order?.tradeSentAt, order?.status]);

  useEffect(() => {
    if (!orderId) return;
    let cancelled = false;
    const fetchMsgs = async () => {
      try {
        const r = await fetch(`/api/orders/${orderId}/messages`);
        const j = await r.json();
        if (!cancelled && j.success) setChatMessages(j.data);
      } catch {}
    };
    fetchMsgs();
    const iv = setInterval(fetchMsgs, 5000);
    return () => { cancelled = true; clearInterval(iv); };
  }, [orderId]);

  useEffect(() => {
    if (chatOpen) chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages, chatOpen]);

  const sendChatMessage = async () => {
    if (!chatInput.trim() || !orderId || chatSending) return;
    setChatSending(true);
    try {
      const r = await fetch(`/api/orders/${orderId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: chatInput.trim() }),
      });
      const j = await r.json();
      if (j.success) {
        setChatMessages((prev) => [...prev, j.data]);
        setChatInput("");
      }
    } finally { setChatSending(false); }
  };

  const formatCountdown = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, "0");
    const s = (secs % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  const ensureAbsUrl = (url: string | undefined | null): string | undefined => {
    if (!url) return undefined;
    const trimmed = url.trim();
    if (!trimmed) return undefined;
    if (/^https?:\/\//i.test(trimmed)) return trimmed;
    return `https://${trimmed}`;
  };

  const rawTradeOfferValue = (() => {
    try {
      return (JSON.parse(order?.adminComment || "{}").tradeOfferUrl as string) ?? null;
    } catch { return null; }
  })();
  const tradeOfferId = (() => {
    if (!rawTradeOfferValue) return null;
    const m = rawTradeOfferValue.match(/tradeoffer\/(\d+)/);
    if (m) return m[1];
    const digits = rawTradeOfferValue.replace(/\D/g, "");
    return digits || null;
  })();
  const tradeOfferUrl = tradeOfferId
    ? `https://steamcommunity.com/tradeoffer/${tradeOfferId}/`
    : null;
  const botSteamUrl = ensureAbsUrl(order?.botAccount?.steamProfileUrl);

  const handleCopyOrderId = () => {
    navigator.clipboard.writeText(order?.orderNumber ?? orderId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const payerDetailsEntries = Object.entries(order?.paymentDetails ?? {}).filter(
    ([, value]) => value !== null && value !== undefined && String(value).trim() !== "",
  );

  const getPayerFieldLabel = (key: string) => {
    const labels: Record<string, { en: string; ru: string }> = {
      email: { en: "Email", ru: "Email" },
      country: { en: "Country", ru: "Страна" },
      cardNumber: { en: "Card Number", ru: "Номер карты" },
      cardName: { en: "Card Holder", ru: "Имя владельца" },
      network: { en: "Network", ru: "Сеть" },
      walletAddress: { en: "Wallet Address", ru: "Адрес кошелька" },
      iban: { en: "IBAN", ru: "IBAN" },
      swift: { en: "SWIFT", ru: "SWIFT" },
      recipientName: { en: "Recipient Name", ru: "Имя получателя" },
    };
    const normalized = labels[key];
    if (normalized) return locale === "ru" ? normalized.ru : normalized.en;
    return key;
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
  const isTimerExpired = order.status === "TRADE_SENT" && countdown === 0;
  const isPaymentPending =
    order.status === "PAYMENT_PENDING" ||
    order.status === "TRADE_COMPLETED";
  const totalAmount = parseFloat(order.totalAmount).toFixed(2);
  const createdDate = new Date(order.createdAt).toLocaleDateString(locale === "ru" ? "ru-RU" : "en-US", {
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
        {(
          <div
            className={`odr-tl odr-fade${isCancelled ? " odr-tl--cancelled" : ""}`}
            style={{ "--delay": 1 } as React.CSSProperties}
          >
            <div className="odr-tl__decor">
              <div className="odr-tl__decor-circle odr-tl__decor-circle--1"></div>
              <div className="odr-tl__decor-circle odr-tl__decor-circle--2"></div>
              <div className="odr-tl__decor-grid"></div>
            </div>
            <div className="odr-tl__progress">
              {t("stepProgress", { current: activeStep + 1, total: TIMELINE_STEPS.length })}
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
                    aria-label={t("field.steamProfile")}
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                      <polyline points="15 3 21 3 21 9" />
                      <line x1="10" y1="14" x2="21" y2="3" />
                    </svg>
                    <span>{locale === "ru" ? "Открыть профиль" : "Open Profile"}</span>
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
                  {t("itemCount", { count: order.items.length })}
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
              <button className="odr-card__action-btn" onClick={() => setPayerModalOpen(true)}>
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

            {isCancelled ? (
              <div className="odr-trade-cancelled">
                <div className="odr-trade-cancelled__decor">
                  <div className="odr-trade-cancelled__decor-grid" />
                  <div className="odr-trade-cancelled__decor-circle odr-trade-cancelled__decor-circle--1" />
                  <div className="odr-trade-cancelled__decor-circle odr-trade-cancelled__decor-circle--2" />
                </div>

                <div className="odr-trade-cancelled__icon">
                  <svg viewBox="0 0 52 52">
                    <circle className="odr-trade-cancelled__circle" cx="26" cy="26" r="24" fill="none" />
                    <line className="odr-trade-cancelled__x1" x1="16" y1="16" x2="36" y2="36" />
                    <line className="odr-trade-cancelled__x2" x1="36" y1="16" x2="16" y2="36" />
                  </svg>
                </div>

                <h4 className="odr-trade-cancelled__title">{t("tradeCancelledTitle")}</h4>
                <p className="odr-trade-cancelled__desc">{t("tradeCancelledDesc")}</p>

                <div className="odr-trade-cancelled__info">
                  <div className="odr-trade-cancelled__info-row">
                    <div className="odr-trade-cancelled__info-icon">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                    </div>
                    <span>{t("tradeCancelledReason")}</span>
                  </div>
                  <div className="odr-trade-cancelled__info-row">
                    <div className="odr-trade-cancelled__info-icon odr-trade-cancelled__info-icon--shield">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                    </div>
                    <span>{t("tradeCancelledItems")}</span>
                  </div>
                </div>

                <div className="odr-trade-cancelled__actions">
                  <Link href="/sell" className="odr-trade-cancelled__btn odr-trade-cancelled__btn--primary">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
                    <span>{t("tradeCancelledNewDeal")}</span>
                  </Link>
                </div>
              </div>
            ) : order.status === "CREATED" && !order.botAccount ? (
              <div className="tw3">
                <div className="tw3__decor">
                  <div className="tw3__decor-grid" />
                  <div className="tw3__decor-circle tw3__decor-circle--1" />
                  <div className="tw3__decor-circle tw3__decor-circle--2" />
                </div>
                <div className="tw3__ring">
                  <svg className="tw3__spinner" viewBox="0 0 80 80" fill="none">
                    <circle cx="40" cy="40" r="36" stroke="rgba(99,102,241,0.12)" strokeWidth="3" />
                    <circle cx="40" cy="40" r="36" stroke="url(#twGrad)" strokeWidth="3" strokeLinecap="round" strokeDasharray="60 170" />
                    <defs><linearGradient id="twGrad" x1="0" y1="0" x2="80" y2="80"><stop stopColor="#818cf8" /><stop offset="1" stopColor="#6366f1" /></linearGradient></defs>
                  </svg>
                  <div className="tw3__icon">
                    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10" />
                      <polyline points="12 6 12 12 16 14" />
                    </svg>
                  </div>
                </div>
                <p className="tw3__title">{t("tradeWaitTitle")}<span className="odr-dots" /></p>
                <span className="tw3__hint">{t("tradeWaitHint")}</span>
                <div className="tw3__bar"><div className="tw3__bar-fill" /></div>
                <div className="tw3__steps">
                  <span className="tw3__step tw3__step--active">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                    {locale === "ru" ? "Поиск" : "Searching"}
                  </span>
                  <span className="tw3__step-line" />
                  <span className="tw3__step">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/></svg>
                    {locale === "ru" ? "Подключение" : "Connecting"}
                  </span>
                  <span className="tw3__step-line" />
                  <span className="tw3__step">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                    {locale === "ru" ? "Готово" : "Ready"}
                  </span>
                </div>
              </div>
            ) : order.status === "PAID" ? (
              <div className="odr-trade-paid">
                <div className="odr-trade-paid__decor">
                  <div className="odr-trade-paid__decor-grid" />
                  <div className="odr-trade-paid__decor-circle odr-trade-paid__decor-circle--1" />
                  <div className="odr-trade-paid__decor-circle odr-trade-paid__decor-circle--2" />
                </div>

                {/* Confetti */}
                <div className="odr-confetti" aria-hidden="true">
                  {Array.from({ length: 20 }).map((_, i) => (
                    <span key={i} className="odr-confetti__piece" style={{ "--ci": i } as React.CSSProperties} />
                  ))}
                </div>

                <div className="odr-trade-paid__check">
                  <svg className="odr-trade-paid__check-svg" viewBox="0 0 52 52">
                    <circle className="odr-trade-paid__check-circle" cx="26" cy="26" r="24" fill="none" />
                    <path className="odr-trade-paid__check-path" fill="none" d="M14 27l7 7 16-16" />
                  </svg>
                </div>

                <h4 className="odr-trade-paid__title">{t("tradePaidTitle")}</h4>

                <div className="odr-trade-paid__amount">
                  {totalAmount}<small>$</small>
                </div>

                <p className="odr-trade-paid__desc">{t("tradePaidDesc")}</p>

                {/* Receipt card */}
                <div className="odr-trade-paid__receipt">
                  <div className="odr-trade-paid__receipt-row">
                    <span>{t("tradePaidReceiptStatus")}</span>
                    <span className="odr-trade-paid__receipt-badge">
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
                      {t("tradePaidReceiptPaid")}
                    </span>
                  </div>
                  <div className="odr-trade-paid__receipt-row">
                    <span>{t("tradePaidMethod")}</span>
                    <strong>{order.paymentMethod?.name ?? "-"}</strong>
                  </div>
                  <div className="odr-trade-paid__receipt-row">
                    <span>{t("tradePaidReceiptItems")}</span>
                    <strong>{order.items.length}</strong>
                  </div>
                  <div className="odr-trade-paid__receipt-row">
                    <span>{t("tradePaidReceiptDate")}</span>
                    <strong>{new Date().toLocaleDateString(locale === "ru" ? "ru-RU" : "en-US", { day: "numeric", month: "short", year: "numeric" })}</strong>
                  </div>
                  {tradeOfferId && (
                    <div className="odr-trade-paid__receipt-row">
                      <span>{t("dealNumber")}</span>
                      <strong>#{tradeOfferId}</strong>
                    </div>
                  )}
                  <div className="odr-trade-paid__receipt-total">
                    <span>{t("total")}</span>
                    <span>{totalAmount}<small>$</small></span>
                  </div>
                </div>

                {/* Actions */}
                <div className="odr-trade-paid__actions">
                  <Link href="/sell" className="odr-trade-paid__btn odr-trade-paid__btn--sell">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
                    <span>{t("tradePaidSellMore")}</span>
                  </Link>
                  <div className="odr-trade-paid__actions-row">
                    <Link href="/" className="odr-trade-paid__btn odr-trade-paid__btn--outline">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
                      <span>{t("tradePaidHome")}</span>
                    </Link>
                    <Link href="/orders" className="odr-trade-paid__btn odr-trade-paid__btn--outline">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                      <span>{t("tradePaidOrders")}</span>
                    </Link>
                  </div>
                </div>
              </div>
            ) : (order.status === "TRADE_COMPLETED" || order.status === "PAYMENT_PENDING") ? (
              <div className="odr-trade-done">
                <div className="odr-trade-done__decor">
                  <div className="odr-trade-done__decor-grid" />
                  <div className="odr-trade-done__decor-circle odr-trade-done__decor-circle--1" />
                  <div className="odr-trade-done__decor-circle odr-trade-done__decor-circle--2" />
                </div>

                {/* Animated checkmark */}
                <div className="odr-trade-done__check">
                  <svg className="odr-trade-done__check-svg" viewBox="0 0 52 52">
                    <circle className="odr-trade-done__check-circle" cx="26" cy="26" r="24" fill="none" />
                    <path className="odr-trade-done__check-path" fill="none" d="M14 27l7 7 16-16" />
                  </svg>
                </div>

                <h4 className="odr-trade-done__title">{t("tradeReceivedTitle")}</h4>

                {/* Payout amount */}
                <div className="odr-trade-done__amount">
                  {totalAmount}<small>$</small>
                </div>

                <p className="odr-trade-done__desc">{t("tradeReceivedDesc")}</p>

                {/* Progress bar */}
                <div className="odr-trade-done__progress">
                  <div className="odr-trade-done__progress-fill" />
                </div>

                {/* Mini timeline */}
                <div className="odr-trade-done__timeline">
                  <div className="odr-trade-done__tl-step odr-trade-done__tl-step--done">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
                    <span>{t("tradeStepReceived")}</span>
                  </div>
                  <span className="odr-trade-done__tl-line odr-trade-done__tl-line--done" />
                  <div className="odr-trade-done__tl-step odr-trade-done__tl-step--active">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                    <span>{t("tradeStepProcessing")}</span>
                  </div>
                  <span className="odr-trade-done__tl-line" />
                  <div className="odr-trade-done__tl-step">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
                    <span>{t("tradeStepPayout")}</span>
                  </div>
                </div>

                {/* Info rows */}
                <div className="odr-trade-done__info">
                  <div className="odr-trade-done__info-row">
                    <div className="odr-trade-done__info-icon odr-trade-done__info-icon--clock">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                    </div>
                    <span>{t("tradeReceivedHold")}</span>
                  </div>
                  <div className="odr-trade-done__info-row">
                    <div className="odr-trade-done__info-icon odr-trade-done__info-icon--date">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                    </div>
                    <span>
                      {t("tradeEstimatedDate")}{" "}
                      <strong>
                        {new Date(Date.now() + 8 * 24 * 60 * 60 * 1000).toLocaleDateString(
                          locale === "ru" ? "ru-RU" : "en-US",
                          { month: "long", day: "numeric", year: "numeric" }
                        )}
                      </strong>
                    </span>
                  </div>
                </div>

                {/* Bot badge + deal */}
                <div className="odr-trade-done__footer">
                  {botProfile && (
                    <div className="odr-trade-done__bot-badge">
                      <div className="odr-trade-done__bot-avatar">
                        {botProfile.avatarUrl ? (
                          <img src={botProfile.avatarUrl} alt="" />
                        ) : (
                          <span>{(order.botAccount?.name ?? "B").charAt(0)}</span>
                        )}
                      </div>
                      <span>{t("tradeDoneBot")} {botProfile.name ?? order.botAccount?.name ?? "Bot"}</span>
                    </div>
                  )}
                  {tradeOfferId && (
                    <div className="odr-trade-done__deal">
                      <span>{t("dealNumber")}</span>
                      <span>#{tradeOfferId}</span>
                    </div>
                  )}
                </div>

                <Link href="/sell" className="odr-trade-done__sell-btn">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></svg>
                  <span>{t("continueSelling")}</span>
                </Link>
              </div>
            ) : isTimerExpired ? (
              <div className="odr-trade-expired">
                <div className="odr-trade-expired__decor">
                  <div className="odr-trade-expired__decor-grid" />
                  <div className="odr-trade-expired__decor-circle odr-trade-expired__decor-circle--1" />
                  <div className="odr-trade-expired__decor-circle odr-trade-expired__decor-circle--2" />
                </div>

                <div className="odr-trade-expired__icon">
                  <svg viewBox="0 0 52 52">
                    <circle className="odr-trade-expired__circle" cx="26" cy="26" r="24" fill="none" />
                    <g className="odr-trade-expired__clock">
                      <circle cx="26" cy="26" r="10" fill="none" stroke="currentColor" strokeWidth="2" />
                      <polyline points="26 20 26 26 30 28" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    </g>
                  </svg>
                </div>

                <h4 className="odr-trade-expired__title">{t("tradeExpiredTitle")}</h4>
                <p className="odr-trade-expired__desc">{t("tradeExpiredDesc")}</p>

                <div className="odr-trade-expired__info">
                  <div className="odr-trade-expired__info-row">
                    <div className="odr-trade-expired__info-icon">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                    </div>
                    <span>{t("tradeExpiredHint")}</span>
                  </div>
                </div>

                <div className="odr-trade-expired__actions">
                  <Link href="/sell" className="odr-trade-expired__btn odr-trade-expired__btn--outline">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
                    <span>{t("tradeExpiredNewDeal")}</span>
                  </Link>
                </div>
              </div>
            ) : (
              <div className="odr-trade-ready">
                {/* Bot info — only shown when bot data is available */}
                {(botProfile || order.botAccount) && (
                  <div className="odr-trade-bot">
                    <div className="odr-trade-bot__avatar">
                      {botProfile?.avatarUrl ? (
                        <img src={botProfile.avatarUrl} alt="" />
                      ) : order.botAccount?.name ? (
                        <span>{order.botAccount.name.charAt(0).toUpperCase()}</span>
                      ) : (
                        <span>?</span>
                      )}
                    </div>
                    <div className="odr-trade-bot__info">
                      <a
                        href={botProfile?.profileUrl ?? botSteamUrl ?? "#"}
                        className="odr-trade-bot__name odr-trade-bot__name--link"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {botProfile?.name ?? order.botAccount?.name ?? t("botPending")}
                      </a>
                      {botProfile?.level != null && (
                        <span className="odr-trade-bot__level">
                          {t("botLevel")} {botProfile.level}
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Timer */}
                {countdown !== null && order.status === "TRADE_SENT" && (
                  <div className="odr-trade-timer">
                    <div className="odr-trade-timer__head">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10" />
                        <polyline points="12 6 12 12 16 14" />
                      </svg>
                      <span>{t("awaitingConfirmation")}</span>
                    </div>
                    <div className={`odr-trade-timer__clock${countdown <= 60 ? " odr-trade-timer__clock--warn" : ""}`}>
                      {formatCountdown(countdown)}
                    </div>
                  </div>
                )}

                {tradeOfferId && (
                  <div className="odr-trade-deal">
                    <span className="odr-trade-deal__label">{t("dealNumber")}</span>
                    <span className="odr-trade-deal__val">#{tradeOfferId}</span>
                  </div>
                )}

                <p className="odr-trade-note">{t("tradeNote")}</p>

                <div className="odr-trade-warning">
                  <div className="odr-trade-warning__icon">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                    </svg>
                  </div>
                  <div className="odr-trade-warning__content">
                    <span className="odr-trade-warning__title">{t("warningTitle")}</span>
                    <p className="odr-trade-warning__desc">
                      {t("warningDesc").split("{link}")[0]}
                      <a href="https://help.steampowered.com/en/faqs/view/451E-96B3-D194-50FC" target="_blank" rel="noopener noreferrer">
                        {t("warningLink")}
                      </a>
                      {t("warningDesc").split("{link}")[1]}
                    </p>
                  </div>
                </div>

                {/* Confirm buttons */}
                <div className="odr-trade-actions">
                  <button
                    type="button"
                    className="odr-trade-actions__btn odr-trade-actions__btn--browser"
                    onClick={() => {
                      const url = tradeOfferUrl ?? botSteamUrl ?? "#";
                      if (url === "#") return;
                      const w = window.open("about:blank", "_blank");
                      if (w) { w.location.href = url; } else { window.location.href = url; }
                    }}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10" />
                      <line x1="2" y1="12" x2="22" y2="12" />
                      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                    </svg>
                    <span>{t("confirmBrowser")}</span>
                  </button>
                  <button
                    type="button"
                    className="odr-trade-actions__btn odr-trade-actions__btn--client"
                    onClick={() => {
                      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
                      if (isMobile) {
                        const url = tradeOfferUrl ?? botSteamUrl;
                        if (url) window.location.href = url;
                      } else {
                        const url = tradeOfferId
                          ? `steam://url/ShowTradeOffer/${tradeOfferId}`
                          : `steam://openurl/${botSteamUrl ?? ""}`;
                        window.location.href = url;
                      }
                    }}
                  >
                    <svg width="16" height="16" viewBox="0 0 256 259" fill="currentColor">
                      <path d="M127.779 0C57.895 0 .69 55.324.046 124.599L86.729 160.3a35.896 35.896 0 0 1 20.365-6.3l30.472-44.12v-.655c0-26.638 21.674-48.311 48.32-48.311 26.643 0 48.317 21.673 48.317 48.324 0 26.642-21.674 48.316-48.317 48.316h-1.124l-43.412 30.993c0 .349.018.697.018 1.037 0 19.98-16.241 36.227-36.233 36.227-17.616 0-32.323-12.627-35.56-29.349L4.05 168.46C20.455 220.12 69.244 258.218 127.779 258.218c70.556 0 127.774-57.214 127.774-127.776S198.335 0 127.779 0" />
                    </svg>
                    <span>{t("confirmClient")}</span>
                  </button>
                </div>
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

        {/* ── Floating Chat ── */}
        <div className={`odr-fchat${chatOpen ? " odr-fchat--open" : ""}`}>
          <button className="odr-fchat__fab" onClick={() => {
            setChatOpen((o) => {
              const willOpen = !o;
              if (willOpen && order?.id) {
                fetch(`/api/orders/${order.id}/messages`, { method: "PATCH" }).catch(() => {});
              }
              return willOpen;
            });
          }} aria-label="Chat">
            {chatOpen ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
            )}
            {!chatOpen && chatMessages.filter((m: any) => m.authorRole === "admin" && !m.readAt).length > 0 && (
              <span className="odr-fchat__fab-count">{chatMessages.filter((m: any) => m.authorRole === "admin" && !m.readAt).length}</span>
            )}
          </button>

          {chatOpen && (
            <div className="odr-fchat__panel">
              <div className="odr-fchat__accent" />
              <div className="odr-fchat__header">
                <div className="odr-fchat__header-left">
                  <div className="odr-fchat__header-icon">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                  </div>
                  <div>
                    <h4 className="odr-fchat__title">{locale === "ru" ? "Поддержка" : "Support"}</h4>
                    <span className="odr-fchat__sub">#{order.orderNumber}</span>
                  </div>
                </div>
                <div className="odr-fchat__status">
                  <span className="odr-fchat__status-dot" />
                  <span>{locale === "ru" ? "Онлайн" : "Online"}</span>
                </div>
              </div>

              <div className="odr-fchat__messages">
                {chatMessages.length === 0 ? (
                  <div className="odr-fchat__empty">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                    <span>{locale === "ru" ? "Нет сообщений" : "No messages yet"}</span>
                    <small>{locale === "ru" ? "Напишите, если нужна помощь" : "Write if you need help"}</small>
                  </div>
                ) : (
                  chatMessages.map((m: any) => (
                    <div key={m.id} className={`odr-fchat__msg odr-fchat__msg--${m.authorRole}`}>
                      <div className="odr-fchat__bubble">{m.body}</div>
                      <span className="odr-fchat__time">
                        {m.authorRole === "admin" ? (locale === "ru" ? "Поддержка" : "Support") : (locale === "ru" ? "Вы" : "You")} · {new Date(m.createdAt).toLocaleTimeString(locale === "ru" ? "ru-RU" : "en-US", { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                  ))
                )}
                <div ref={chatEndRef} />
              </div>

              <div className="odr-fchat__input-area">
                <input
                  className="odr-fchat__input"
                  placeholder={locale === "ru" ? "Ваше сообщение..." : "Your message..."}
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendChatMessage(); } }}
                  maxLength={2000}
                />
                <button className="odr-fchat__send" disabled={chatSending || !chatInput.trim()} onClick={sendChatMessage}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Cancelled state is now inside Trade Information card */}

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


        {payerModalOpen && (
          <div className="odr-modal-overlay active" onClick={() => setPayerModalOpen(false)}>
            <div className="odr-modal odr-modal--dark" onClick={(e) => e.stopPropagation()}>
              <div className="odr-modal__accent odr-modal__accent--purple" />
              <div className="odr-modal__head">
                <div className="odr-modal__head-left">
                  <div className="odr-modal__avatar odr-modal__avatar--purple">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                      <circle cx="12" cy="7" r="4" />
                    </svg>
                  </div>
                  <div>
                    <h3>{t("viewPayerDetails")}</h3>
                    <p className="odr-modal__sub">
                      {locale === "ru" ? "Реквизиты, указанные при оформлении" : "Payout details submitted at checkout"}
                    </p>
                  </div>
                </div>
                <button className="odr-modal__close" onClick={() => setPayerModalOpen(false)}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>
              <div className="odr-modal__fields">
                {payerDetailsEntries.length > 0 ? (
                  payerDetailsEntries.map(([key, value]) => (
                    <div key={key} className="odr-modal__field">
                      <div className="odr-modal__field-top">
                        <div className="odr-modal__field-icon">
                          {key === "cardNumber" || key === "iban" ? (
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
                          ) : key === "cardName" || key === "recipientName" ? (
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                          ) : key === "email" ? (
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                          ) : key === "walletAddress" ? (
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"/><path d="M3 5v14a2 2 0 0 0 2 2h16v-5"/><path d="M18 12a2 2 0 0 0 0 4h4v-4h-4z"/></svg>
                          ) : key === "network" ? (
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
                          ) : key === "country" ? (
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                          ) : (
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                          )}
                        </div>
                        <span className="odr-modal__label">{getPayerFieldLabel(key)}</span>
                      </div>
                      <div className="odr-modal__field-bottom">
                        <div className="odr-modal__val">{String(value)}</div>
                        <button
                          className={`odr-modal__copy-btn${copiedField === key ? " odr-modal__copy-btn--done" : ""}`}
                          onClick={() => {
                            navigator.clipboard.writeText(String(value));
                            setCopiedField(key);
                            setTimeout(() => setCopiedField(null), 2000);
                          }}
                        >
                          {copiedField === key ? (
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
                          ) : (
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                          )}
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="odr-modal__field odr-modal__field--empty">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                    <span>{locale === "ru" ? "Реквизиты не заполнены" : "No payout details provided"}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
