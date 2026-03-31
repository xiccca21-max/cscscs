"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";

type Section = "orders" | "users" | "payments" | "prices" | "balances" | "cashouts" | "bots" | "referrals" | "logs" | "social";

function Toast({ message, onDone }: { message: string; onDone: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDone, 3000);
    return () => clearTimeout(t);
  }, [onDone]);
  return <div className="adm-toast">{message}</div>;
}

export default function AdminPage() {
  const [section, setSection] = useState<Section>("orders");
  const [toasts, setToasts] = useState<string[]>([]);

  const [orders, setOrders] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<any[]>([]);
  const [pricingRules, setPricingRules] = useState<any[]>([]);
  const [cashouts, setCashouts] = useState<any[]>([]);
  const [bots, setBots] = useState<any[]>([]);
  const [referrals, setReferrals] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);

  const [ordersSearch, setOrdersSearch] = useState("");
  const [ordersStatus, setOrdersStatus] = useState("");
  const [usersSearch, setUsersSearch] = useState("");
  const [balancesSearch, setBalancesSearch] = useState("");
  const [cashoutsStatus, setCashoutsStatus] = useState("");
  const [logsSearch, setLogsSearch] = useState("");

  const [balanceModal, setBalanceModal] = useState<{ userId: string; username: string; action: "CREDIT" | "DEBIT" } | null>(null);
  const [balanceAmount, setBalanceAmount] = useState("");
  const [balanceComment, setBalanceComment] = useState("");

  const [orderDetail, setOrderDetail] = useState<any>(null);
  const [botUrlInput, setBotUrlInput] = useState("");
  const [tradeOfferUrlInput, setTradeOfferUrlInput] = useState("");
  const [botResolving, setBotResolving] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [adminReady, setAdminReady] = useState(false);

  const [socialLinks, setSocialLinks] = useState<Record<string, string>>({});
  const [socialSaving, setSocialSaving] = useState(false);

  const [exchangeRate, setExchangeRate] = useState("");
  const [eurRate, setEurRate] = useState("");
  const [exchangeRateSaving, setExchangeRateSaving] = useState(false);

  const [pmModal, setPmModal] = useState(false);
  const [pmForm, setPmForm] = useState({ name: "", type: "card", commission: "0", minAmount: "0", currencies: "RUB" });
  const [pmSaving, setPmSaving] = useState(false);

  const [pmEditModal, setPmEditModal] = useState<any>(null);
  const [pmEditForm, setPmEditForm] = useState({ name: "", commission: "", minAmount: "" });

  const [priceModal, setPriceModal] = useState<any | null>(null);
  const [priceForm, setPriceForm] = useState({ game: "", itemExternalId: "", adjustmentType: "percentage", adjustmentValue: "", isExcluded: false });

  const addToast = useCallback((msg: string) => setToasts((p) => [...p, msg]), []);
  const removeToast = useCallback((i: number) => setToasts((p) => p.filter((_, idx) => idx !== i)), []);

  const safeFetch = useCallback(async (url: string): Promise<any> => {
    try {
      const r = await fetch(url);
      const d = await r.json();
      if (!d.success) {
        if (d.error === "Unauthorized" || d.error === "Forbidden") setAuthError(d.error);
        return null;
      }
      return d;
    } catch { return null; }
  }, []);

  const fetchOrders = useCallback(async () => {
    const params = new URLSearchParams();
    params.set("limit", "50");
    if (ordersStatus) params.set("status", ordersStatus);
    if (ordersSearch.trim()) params.set("search", ordersSearch.trim());
    const d = await safeFetch(`/api/admin/orders?${params.toString()}`);
    if (d) setOrders(d.data?.orders ?? []);
  }, [safeFetch, ordersSearch, ordersStatus]);
  const fetchUsers = useCallback(async () => { const d = await safeFetch("/api/admin/users"); if (d) setUsers(d.data?.users ?? []); }, [safeFetch]);
  const fetchCashouts = useCallback(async () => { const d = await safeFetch("/api/admin/cashouts"); if (d) setCashouts(d.data?.cashouts ?? []); }, [safeFetch]);
  const fetchAuditLogs = useCallback(async () => { const d = await safeFetch("/api/admin/audit"); if (d) setAuditLogs(d.data?.logs ?? []); }, [safeFetch]);
  const fetchPayments = useCallback(async () => { const d = await safeFetch("/api/admin/payments"); if (d) setPaymentMethods(d.data ?? []); }, [safeFetch]);
  const fetchPrices = useCallback(async () => { const d = await safeFetch("/api/admin/prices"); if (d) setPricingRules(Array.isArray(d.data) ? d.data : []); }, [safeFetch]);

  useEffect(() => {
    const init = async () => {
      const sessionRes = await fetch("/api/auth/session");
      const session = await sessionRes.json();
      const u = session?.data;
      if (!u) { setAuthError("Войдите через Steam"); setAdminReady(true); return; }
      if (!u.isAdmin) { setAuthError(`Нет прав. Steam ID: ${u.steamId}. Добавьте в ADMIN_STEAM_IDS.`); setAdminReady(true); return; }
      setAdminReady(true);
      fetchOrders(); fetchUsers(); fetchPayments();
      fetchPrices();
      fetchCashouts();
      safeFetch("/api/admin/bots").then((d) => { if (d) setBots(d.data ?? []); });
      safeFetch("/api/admin/referrals").then((d) => { if (d) setReferrals(d.data ?? []); });
      fetchAuditLogs();
      safeFetch("/api/admin/settings").then((d) => {
        if (d?.data) {
          setSocialLinks(d.data);
          if (d.data.exchange_rate_usd_rub) setExchangeRate(d.data.exchange_rate_usd_rub);
          if (d.data.exchange_rate_usd_eur) setEurRate(d.data.exchange_rate_usd_eur);
        }
      });
    };
    init();
  }, [fetchOrders, fetchUsers, fetchCashouts, fetchAuditLogs, fetchPayments, fetchPrices, safeFetch]);

  useEffect(() => {
    if (!adminReady || authError) return;
    const id = setInterval(() => {
      if (section === "orders") fetchOrders();
      if (section === "cashouts") fetchCashouts();
    }, 3000);
    return () => clearInterval(id);
  }, [adminReady, authError, section, fetchOrders, fetchCashouts]);

  useEffect(() => {
    if (!adminReady || authError || section !== "orders") return;
    const t = setTimeout(() => {
      fetchOrders();
    }, 250);
    return () => clearTimeout(t);
  }, [ordersSearch, ordersStatus, section, adminReady, authError, fetchOrders]);

  useEffect(() => {
    if (!orderDetail?.id || section !== "orders") return;
    const id = setInterval(async () => {
      const d = await safeFetch(`/api/admin/orders/${orderDetail.id}`);
      if (d?.data) setOrderDetail(d.data);
    }, 3000);
    return () => clearInterval(id);
  }, [orderDetail?.id, section, safeFetch]);

  const handleAction = async (method: string, url: string, body?: any, successMsg?: string, onSuccess?: () => void) => {
    try {
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: body ? JSON.stringify(body) : undefined });
      const json = await res.json();
      if (json.success) { addToast(successMsg ?? "Готово"); onSuccess?.(); return json; }
      else addToast("Ошибка: " + (json.error ?? "Unknown"));
    } catch { addToast("Ошибка сети"); }
    return null;
  };

  const handleSaveSocial = async () => {
    setSocialSaving(true);
    const SOCIAL_KEYS = ["social_discord", "social_twitter", "social_steam_group", "social_telegram", "social_contact_email"];
    try {
      for (const k of SOCIAL_KEYS) {
        await fetch("/api/admin/settings", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ key: k, value: socialLinks[k] ?? "" }) });
      }
      addToast("Ссылки сохранены");
    } catch { addToast("Ошибка сохранения"); }
    finally { setSocialSaving(false); }
  };

  const handleSaveExchangeRates = async () => {
    const rubVal = parseFloat(exchangeRate);
    const eurVal = parseFloat(eurRate);
    if (exchangeRate && (!rubVal || rubVal <= 0)) { addToast("Некорректный курс RUB"); return; }
    if (eurRate && (!eurVal || eurVal <= 0)) { addToast("Некорректный курс EUR"); return; }
    setExchangeRateSaving(true);
    try {
      if (rubVal) await fetch("/api/admin/settings", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ key: "exchange_rate_usd_rub", value: String(rubVal) }) });
      if (eurVal) await fetch("/api/admin/settings", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ key: "exchange_rate_usd_eur", value: String(eurVal) }) });
      addToast("Курсы сохранены");
    } catch { addToast("Ошибка сохранения курсов"); }
    finally { setExchangeRateSaving(false); }
  };

  const handleBalanceSubmit = async () => {
    if (!balanceModal) return;
    const amount = parseFloat(balanceAmount);
    if (!amount || amount <= 0) { addToast("Введите сумму"); return; }
    await handleAction("POST", "/api/admin/balance", { userId: balanceModal.userId, type: balanceModal.action, amount, comment: balanceComment || null },
      balanceModal.action === "CREDIT" ? "Баланс пополнен" : "Баланс списан", () => { fetchUsers(); setBalanceModal(null); setBalanceAmount(""); setBalanceComment(""); });
  };

  const handleAddPayment = async () => {
    if (!pmForm.name.trim()) { addToast("Введите название"); return; }
    setPmSaving(true);
    const body = {
      name: pmForm.name.trim(),
      type: pmForm.type,
      commission: parseFloat(pmForm.commission) || 0,
      minAmount: parseFloat(pmForm.minAmount) || 0,
      currencies: pmForm.currencies.split(",").map((c) => c.trim()).filter(Boolean),
      requiredFields: {},
    };
    const res = await handleAction("POST", "/api/admin/payments", body, "Метод добавлен", () => {
      fetchPayments();
      setPmModal(false);
      setPmForm({ name: "", type: "card", commission: "0", minAmount: "0", currencies: "RUB" });
    });
    setPmSaving(false);
  };

  const handleEditPayment = async () => {
    if (!pmEditModal) return;
    const body: any = {};
    if (pmEditForm.name.trim()) body.name = pmEditForm.name.trim();
    const c = parseFloat(pmEditForm.commission);
    if (!isNaN(c)) body.commission = c;
    const m = parseFloat(pmEditForm.minAmount);
    if (!isNaN(m)) body.minAmount = m;
    await handleAction("PATCH", `/api/admin/payments/${pmEditModal.id}`, body, "Метод обновлён", () => { fetchPayments(); setPmEditModal(null); });
  };

  const handleDeletePayment = async (id: string) => {
    if (!confirm("Удалить метод оплаты?")) return;
    await handleAction("DELETE", `/api/admin/payments/${id}`, undefined, "Метод удалён", fetchPayments);
  };

  const openPriceModal = (rule?: any) => {
    if (rule) {
      setPriceForm({
        game: rule.game ?? "",
        itemExternalId: rule.itemExternalId ?? "",
        adjustmentType: rule.adjustmentType ?? "percentage",
        adjustmentValue: String(rule.adjustmentValue ?? ""),
        isExcluded: !!rule.isExcluded,
      });
      setPriceModal(rule);
    } else {
      setPriceForm({ game: "", itemExternalId: "", adjustmentType: "percentage", adjustmentValue: "", isExcluded: false });
      setPriceModal("new");
    }
  };

  const handleSavePriceRule = async () => {
    const val = parseFloat(priceForm.adjustmentValue);
    if (isNaN(val)) { addToast("Введите значение"); return; }
    const body: any = {
      adjustmentType: priceForm.adjustmentType,
      adjustmentValue: val,
      game: priceForm.game || null,
      itemExternalId: priceForm.itemExternalId || null,
      isExcluded: priceForm.isExcluded,
    };
    if (priceModal !== "new") body.id = priceModal.id;
    await handleAction("POST", "/api/admin/prices", body,
      priceModal === "new" ? "Правило создано" : "Правило обновлено",
      () => { fetchPrices(); setPriceModal(null); });
  };

  const handleDeletePriceRule = async (id: string) => {
    if (!confirm("Удалить правило?")) return;
    await handleAction("DELETE", `/api/admin/prices/${id}`, undefined, "Правило удалено", fetchPrices);
  };

  const filteredBalanceUsers = users.filter((u) => {
    if (!balancesSearch) return true;
    const q = balancesSearch.toLowerCase();
    return (u.steamId ?? "").toLowerCase().includes(q) || (u.steamLogin ?? "").toLowerCase().includes(q);
  });

  const tabs: { key: Section; label: string }[] = [
    { key: "orders", label: "Заказы" },
    { key: "users", label: "Юзеры" },
    { key: "payments", label: "Оплата" },
    { key: "prices", label: "Цены" },
    { key: "balances", label: "Балансы" },
    { key: "cashouts", label: "Выводы" },
    { key: "bots", label: "Боты" },
    { key: "referrals", label: "Рефералы" },
    { key: "logs", label: "Логи" },
    { key: "social", label: "Ссылки" },
  ];

  if (!adminReady) return <div className="adm-loading">Загрузка...</div>;
  if (authError) return (
    <div className="adm-auth-error">
      <div className="adm-auth-error__card">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
        <h2>Доступ запрещён</h2>
        <p>{authError}</p>
        <Link href="/" className="adm-btn adm-btn--primary">На главную</Link>
      </div>
    </div>
  );

  return (
    <div className="adm">
      {/* Header */}
      <header className="adm-header">
        <Link href="/" className="adm-header__logo">
          SKINWAVE <span className="adm-header__badge">admin</span>
        </Link>
        <nav className="adm-tabs">
          {tabs.map((t) => (
            <button key={t.key} className={`adm-tab${section === t.key ? " adm-tab--active" : ""}`} onClick={() => setSection(t.key)}>{t.label}</button>
          ))}
        </nav>
      </header>

      <main className="adm-main">

        {/* ── ORDERS ── */}
        {section === "orders" && (
          <div className="adm-section">
            <div className="adm-section__top">
              <h1>Заказы</h1>
              <div className="adm-section__actions">
                <input className="adm-input" placeholder="Поиск по ID, Steam..." value={ordersSearch} onChange={(e) => setOrdersSearch(e.target.value)} />
                <select className="adm-input adm-select" value={ordersStatus} onChange={(e) => setOrdersStatus(e.target.value)}>
                  <option value="">Все статусы</option>
                  <option value="CREATED">Created</option>
                  <option value="TRADE_SENT">Trade Sent</option>
                  <option value="TRADE_COMPLETED">Completed</option>
                  <option value="TRADE_CANCELLED">Cancelled</option>
                  <option value="PAID">Paid</option>
                </select>
                <button className="adm-btn adm-btn--ghost" onClick={fetchOrders}>Обновить</button>
              </div>
            </div>
            <div className="adm-card">
              <table className="adm-table">
                <thead><tr><th>ID</th><th>Юзер</th><th>Кол-во</th><th>Сумма</th><th>Метод</th><th>Статус</th><th>Дата</th><th></th></tr></thead>
                <tbody>
                  {orders.length > 0 ? orders.map((o: any) => (
                    <tr key={o.id}>
                      <td className="adm-mono">#{o.orderNumber ?? o.id?.slice(0, 8)}</td>
                      <td>{o.user?.steamLogin ?? "-"}</td>
                      <td>{o.items?.length ?? 0}</td>
                      <td className="adm-bold">{parseFloat(o.totalAmount ?? 0).toFixed(2)}$</td>
                      <td>{o.paymentMethod?.name ?? "-"}</td>
                      <td><span className={`adm-badge adm-badge--${(o.status ?? "").toLowerCase().replace(/_/g, "-")}`}>{o.status}</span></td>
                      <td>{o.createdAt ? new Date(o.createdAt).toLocaleDateString("ru-RU") : "-"}</td>
                      <td><button className="adm-btn adm-btn--sm" onClick={() => setOrderDetail(o)}>Детали</button></td>
                    </tr>
                  )) : <tr><td colSpan={8} className="adm-empty">Нет заказов</td></tr>}
                </tbody>
              </table>
            </div>
            {orderDetail && (
              <div className="adm-overlay" onClick={() => setOrderDetail(null)}>
                <div className="adm-modal adm-modal--wide" onClick={(e) => e.stopPropagation()}>
                  <h2>Заказ #{orderDetail.orderNumber ?? orderDetail.id?.slice(0, 8)}</h2>

                  <div className="adm-modal__grid">
                    <div><span className="adm-label">Статус</span><span className={`adm-badge adm-badge--${(orderDetail.status ?? "").toLowerCase().replace(/_/g, "-")}`}>{orderDetail.status}</span></div>
                    <div><span className="adm-label">Юзер</span><a href={orderDetail.steamProfileUrl} target="_blank" rel="noopener noreferrer" style={{ color: "var(--accent)", textDecoration: "underline" }}>{orderDetail.user?.steamLogin ?? "-"}</a> <span style={{ color: "var(--text-muted)", fontSize: 12 }}>({orderDetail.user?.steamId})</span></div>
                    <div><span className="adm-label">Профиль Steam</span><a href={orderDetail.steamProfileUrl} target="_blank" rel="noopener noreferrer" style={{ color: "var(--accent)", wordBreak: "break-all", fontSize: 12 }}>{orderDetail.steamProfileUrl ?? "-"}</a></div>
                    <div><span className="adm-label">Trade URL</span><a href={orderDetail.tradeUrl} target="_blank" rel="noopener noreferrer" style={{ color: "var(--accent)", wordBreak: "break-all", fontSize: 12 }}>{orderDetail.tradeUrl ?? "-"}</a></div>
                    <div><span className="adm-label">Сумма</span><span style={{ fontWeight: 700, fontSize: 16 }}>{parseFloat(orderDetail.totalAmount ?? 0).toFixed(2)}$</span></div>
                    <div><span className="adm-label">Метод выплаты</span>{orderDetail.paymentMethod?.name ?? "-"} <span style={{ color: "var(--text-muted)", fontSize: 12 }}>({orderDetail.paymentMethod?.type})</span></div>
                    <div><span className="adm-label">Бот</span>{orderDetail.botAccount ? <><span style={{ fontWeight: 600 }}>{orderDetail.botAccount.name}</span> - <a href={orderDetail.botAccount.steamProfileUrl} target="_blank" rel="noopener noreferrer" style={{ color: "var(--accent)", fontSize: 12 }}>{orderDetail.botAccount.steamProfileUrl}</a></> : <span style={{ color: "var(--text-muted)" }}>Не назначен</span>}</div>
                    <div><span className="adm-label">Создан</span>{new Date(orderDetail.createdAt).toLocaleString("ru-RU")}</div>
                  </div>

                  <div style={{ marginTop: 12 }}>
                    <span className="adm-label" style={{ display: "block", marginBottom: 6 }}>Реквизиты выплаты</span>
                    <div style={{ background: "rgba(0,0,0,0.02)", borderRadius: 8, padding: "10px 12px" }}>
                      {orderDetail.paymentDetails && Object.keys(orderDetail.paymentDetails).length > 0 ? (
                        Object.entries(orderDetail.paymentDetails).map(([k, v]) => (
                          <div key={k} style={{ display: "flex", justifyContent: "space-between", gap: 12, padding: "4px 0", borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
                            <span style={{ color: "var(--text-muted)", fontSize: 12 }}>{k}</span>
                            <span style={{ fontSize: 13, textAlign: "right", wordBreak: "break-word" }}>{String(v ?? "-")}</span>
                          </div>
                        ))
                      ) : (
                        <span style={{ color: "var(--text-muted)", fontSize: 13 }}>Пользователь не указал реквизиты</span>
                      )}
                    </div>
                  </div>

                  <div style={{ marginTop: 12 }}>
                    <span className="adm-label" style={{ display: "block", marginBottom: 6 }}>Предметы ({orderDetail.items?.length ?? 0})</span>
                    <div style={{ maxHeight: 200, overflowY: "auto", background: "rgba(0,0,0,0.02)", borderRadius: 8, padding: "6px 10px" }}>
                      {orderDetail.items?.map((it: any, idx: number) => (
                        <div key={idx} style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", borderBottom: idx < (orderDetail.items?.length ?? 0) - 1 ? "1px solid rgba(0,0,0,0.06)" : "none", fontSize: 13 }}>
                          <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            {it.imageUrl && <img src={it.imageUrl} alt="" style={{ width: 32, height: 24, objectFit: "contain", borderRadius: 4 }} />}
                            <span>{it.name}</span>
                            {it.condition && <span style={{ color: "var(--text-muted)", fontSize: 11 }}>({it.condition})</span>}
                          </span>
                          <span style={{ fontWeight: 600, whiteSpace: "nowrap" }}>{parseFloat(it.buyoutPrice ?? it.basePrice ?? 0).toFixed(2)}$</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {orderDetail.status === "CREATED" && !orderDetail.botAccount && (
                    <div style={{ marginTop: 16, padding: 14, background: "rgba(99,102,241,0.06)", borderRadius: 10, border: "1px solid rgba(99,102,241,0.15)" }}>
                      <span className="adm-label" style={{ display: "block", marginBottom: 8 }}>Назначить бота для обмена</span>
                      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                        <input className="adm-input" placeholder="Ссылка на профиль бота Steam" value={botUrlInput} onChange={(e) => setBotUrlInput(e.target.value)} style={{ flex: 2, minWidth: 240 }} />
                        <input className="adm-input" placeholder="Ссылка на трейд оффер (необяз.)" value={tradeOfferUrlInput} onChange={(e) => setTradeOfferUrlInput(e.target.value)} style={{ flex: 2, minWidth: 240 }} />
                      </div>
                      <button className="adm-btn adm-btn--primary adm-btn--sm" style={{ marginTop: 10 }} disabled={!botUrlInput.trim() || botResolving} onClick={async () => {
                        setBotResolving(true);
                        try {
                          const profileRes = await fetch(`/api/steam/profile?url=${encodeURIComponent(botUrlInput.trim())}`);
                          const profileJson = await profileRes.json();
                          const botName = profileJson.success ? profileJson.data.name : "Bot";
                          const payload: Record<string, string> = { botName, botSteamProfileUrl: botUrlInput.trim() };
                          if (tradeOfferUrlInput.trim()) payload.tradeOfferUrl = tradeOfferUrlInput.trim();
                          const res = await handleAction("PATCH", `/api/admin/orders/${orderDetail.id}`, payload, "Бот назначен", async () => { fetchOrders(); });
                          if (res?.data) { setOrderDetail(res.data); setBotUrlInput(""); setTradeOfferUrlInput(""); }
                        } finally { setBotResolving(false); }
                      }}>{botResolving ? "Загрузка..." : "Принять заказ"}</button>
                    </div>
                  )}

                  <div className="adm-modal__actions" style={{ marginTop: 16 }}>
                    {orderDetail.status === "CREATED" && orderDetail.botAccount && (
                      <button className="adm-btn adm-btn--primary adm-btn--sm" onClick={async () => {
                        const res = await handleAction("PATCH", `/api/admin/orders/${orderDetail.id}`, { status: "TRADE_SENT" }, "Трейд отправлен", () => { fetchOrders(); });
                        if (res?.data) setOrderDetail(res.data);
                      }}>Трейд отправлен</button>
                    )}
                    {orderDetail.status === "TRADE_SENT" && (
                      <button className="adm-btn adm-btn--primary adm-btn--sm" onClick={async () => {
                        const res = await handleAction("PATCH", `/api/admin/orders/${orderDetail.id}`, { status: "TRADE_COMPLETED" }, "Предметы получены", () => { fetchOrders(); });
                        if (res?.data) setOrderDetail(res.data);
                      }}>Предметы получены</button>
                    )}
                    {(orderDetail.status === "TRADE_COMPLETED" || orderDetail.status === "PAYMENT_PENDING") && (
                      <button className="adm-btn adm-btn--primary adm-btn--sm" onClick={async () => {
                        const res = await handleAction("PATCH", `/api/admin/orders/${orderDetail.id}`, { status: "PAID" }, "Оплачено!", () => { fetchOrders(); });
                        if (res?.data) setOrderDetail(res.data);
                      }}>Оплатить</button>
                    )}
                    {orderDetail.status !== "TRADE_CANCELLED" && orderDetail.status !== "PAID" && (
                      <button className="adm-btn adm-btn--danger adm-btn--sm" onClick={async () => {
                        const res = await handleAction("PATCH", `/api/admin/orders/${orderDetail.id}`, { status: "TRADE_CANCELLED" }, "Заказ отменён", () => { fetchOrders(); });
                        if (res?.data) setOrderDetail(res.data);
                      }}>Отменить</button>
                    )}
                    <button className="adm-btn adm-btn--ghost adm-btn--sm" onClick={() => { setOrderDetail(null); setBotUrlInput(""); setTradeOfferUrlInput(""); }}>Закрыть</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── USERS ── */}
        {section === "users" && (
          <div className="adm-section">
            <div className="adm-section__top">
              <h1>Пользователи</h1>
              <div className="adm-section__actions">
                <input className="adm-input" placeholder="Поиск..." value={usersSearch} onChange={(e) => setUsersSearch(e.target.value)} />
                <button className="adm-btn adm-btn--ghost" onClick={fetchUsers}>Обновить</button>
              </div>
            </div>
            <div className="adm-card">
              <table className="adm-table">
                <thead><tr><th>Юзер</th><th>Steam ID</th><th>Баланс</th><th>Дата</th><th>Статус</th><th></th></tr></thead>
                <tbody>
                  {users.length > 0 ? users.map((u: any) => (
                    <tr key={u.id}>
                      <td>
                        <div className="adm-user">
                          {u.steamAvatar ? <img src={u.steamAvatar} alt="" className="adm-user__ava" /> : <div className="adm-user__ava adm-user__ava--placeholder">{(u.steamLogin ?? "U")[0]}</div>}
                          <span>{u.steamLogin ?? "-"}</span>
                        </div>
                      </td>
                      <td className="adm-mono">{u.steamId ?? "-"}</td>
                      <td className="adm-bold">{parseFloat(u.balance ?? 0).toFixed(2)}$</td>
                      <td>{u.createdAt ? new Date(u.createdAt).toLocaleDateString("ru-RU") : "-"}</td>
                      <td><span className={`adm-badge adm-badge--${u.status === "BLOCKED" ? "danger" : "success"}`}>{u.status ?? "ACTIVE"}</span></td>
                      <td>
                        {u.status !== "BLOCKED"
                          ? <button className="adm-btn adm-btn--danger adm-btn--sm" onClick={() => handleAction("PATCH", `/api/admin/users/${u.id}`, { status: "BLOCKED" }, "Заблокирован", fetchUsers)}>Блок</button>
                          : <button className="adm-btn adm-btn--primary adm-btn--sm" onClick={() => handleAction("PATCH", `/api/admin/users/${u.id}`, { status: "ACTIVE" }, "Разблокирован", fetchUsers)}>Разблок</button>
                        }
                      </td>
                    </tr>
                  )) : <tr><td colSpan={6} className="adm-empty">Нет пользователей</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── PAYMENTS & EXCHANGE RATE ── */}
        {section === "payments" && (
          <div className="adm-section">
            <div className="adm-section__top">
              <h1>Оплата и курс</h1>
              <div className="adm-section__actions">
                <button className="adm-btn adm-btn--ghost" onClick={async () => {
                  const res = await handleAction("POST", "/api/admin/seed-payments", undefined, "Методы по умолчанию добавлены", fetchPayments);
                  if (res) fetchPayments();
                }}>Добавить стандартные</button>
                <button className="adm-btn adm-btn--primary" onClick={() => setPmModal(true)}>+ Добавить метод</button>
              </div>
            </div>

            {/* Exchange rates card */}
            <div className="adm-card adm-card--accent" style={{ marginBottom: 20 }}>
              <div className="adm-exchange">
                <div className="adm-exchange__info">
                  <h3>Курсы валют</h3>
                  <p>Используются для конвертации цен на сайте</p>
                </div>
                <div className="adm-exchange__controls">
                  <span className="adm-exchange__prefix">1$ =</span>
                  <input className="adm-input adm-exchange__input" type="number" step="0.01" min="0" placeholder="88.50" value={exchangeRate} onChange={(e) => setExchangeRate(e.target.value)} />
                  <span className="adm-exchange__suffix">₽</span>
                  <span className="adm-exchange__divider">|</span>
                  <span className="adm-exchange__prefix">1$ =</span>
                  <input className="adm-input adm-exchange__input" type="number" step="0.001" min="0" placeholder="0.92" value={eurRate} onChange={(e) => setEurRate(e.target.value)} />
                  <span className="adm-exchange__suffix">€</span>
                  <button className="adm-btn adm-btn--primary" onClick={handleSaveExchangeRates} disabled={exchangeRateSaving}>{exchangeRateSaving ? "..." : "Сохранить"}</button>
                </div>
              </div>
            </div>

            {/* Payment methods table */}
            <div className="adm-card">
              <table className="adm-table">
                <thead><tr><th>Название</th><th>Тип</th><th>Комиссия</th><th>Мин. сумма</th><th>Валюты</th><th>Статус</th><th></th></tr></thead>
                <tbody>
                  {paymentMethods.length > 0 ? paymentMethods.map((pm: any) => (
                    <tr key={pm.id}>
                      <td className="adm-bold">{pm.name}</td>
                      <td>{pm.type}</td>
                      <td>{pm.commission}%</td>
                      <td>{pm.minAmount}$</td>
                      <td>{(pm.currencies ?? []).join(", ")}</td>
                      <td><span className={`adm-badge adm-badge--${pm.isActive !== false ? "success" : "danger"}`}>{pm.isActive !== false ? "Активен" : "Выкл"}</span></td>
                      <td className="adm-actions-cell">
                        <button className="adm-btn adm-btn--sm" onClick={() => { setPmEditModal(pm); setPmEditForm({ name: pm.name, commission: String(pm.commission), minAmount: String(pm.minAmount) }); }}>Ред.</button>
                        <button className="adm-btn adm-btn--sm" onClick={() => handleAction("PATCH", `/api/admin/payments/${pm.id}`, { isActive: pm.isActive === false }, pm.isActive === false ? "Включён" : "Выключен", fetchPayments)}>{pm.isActive === false ? "Вкл" : "Выкл"}</button>
                        <button className="adm-btn adm-btn--danger adm-btn--sm" onClick={() => handleDeletePayment(pm.id)}>Удалить</button>
                      </td>
                    </tr>
                  )) : <tr><td colSpan={7} className="adm-empty">Нет методов оплаты</td></tr>}
                </tbody>
              </table>
            </div>

            {/* Add payment modal */}
            {pmModal && (
              <div className="adm-overlay" onClick={() => setPmModal(false)}>
                <div className="adm-modal" onClick={(e) => e.stopPropagation()}>
                  <h2>Добавить метод оплаты</h2>
                  <div className="adm-form">
                    <label>Название<input className="adm-input" value={pmForm.name} onChange={(e) => setPmForm({ ...pmForm, name: e.target.value })} placeholder="Карта Сбербанк" /></label>
                    <label>Тип
                      <select className="adm-input adm-select" value={pmForm.type} onChange={(e) => setPmForm({ ...pmForm, type: e.target.value })}>
                        <option value="card">Card</option>
                        <option value="crypto">Crypto</option>
                        <option value="qiwi">QIWI</option>
                        <option value="yoomoney">YooMoney</option>
                        <option value="sbp">СБП</option>
                        <option value="other">Другое</option>
                      </select>
                    </label>
                    <label>Комиссия (%)<input className="adm-input" type="number" step="0.01" value={pmForm.commission} onChange={(e) => setPmForm({ ...pmForm, commission: e.target.value })} /></label>
                    <label>Мин. сумма ($)<input className="adm-input" type="number" step="0.01" value={pmForm.minAmount} onChange={(e) => setPmForm({ ...pmForm, minAmount: e.target.value })} /></label>
                    <label>Валюты (через запятую)<input className="adm-input" value={pmForm.currencies} onChange={(e) => setPmForm({ ...pmForm, currencies: e.target.value })} placeholder="RUB, USD" /></label>
                  </div>
                  <div className="adm-modal__actions">
                    <button className="adm-btn adm-btn--primary" onClick={handleAddPayment} disabled={pmSaving}>{pmSaving ? "Создание..." : "Создать"}</button>
                    <button className="adm-btn adm-btn--ghost" onClick={() => setPmModal(false)}>Отмена</button>
                  </div>
                </div>
              </div>
            )}

            {/* Edit payment modal */}
            {pmEditModal && (
              <div className="adm-overlay" onClick={() => setPmEditModal(null)}>
                <div className="adm-modal" onClick={(e) => e.stopPropagation()}>
                  <h2>Редактировать: {pmEditModal.name}</h2>
                  <div className="adm-form">
                    <label>Название<input className="adm-input" value={pmEditForm.name} onChange={(e) => setPmEditForm({ ...pmEditForm, name: e.target.value })} /></label>
                    <label>Комиссия (%)<input className="adm-input" type="number" step="0.01" value={pmEditForm.commission} onChange={(e) => setPmEditForm({ ...pmEditForm, commission: e.target.value })} /></label>
                    <label>Мин. сумма ($)<input className="adm-input" type="number" step="0.01" value={pmEditForm.minAmount} onChange={(e) => setPmEditForm({ ...pmEditForm, minAmount: e.target.value })} /></label>
                  </div>
                  <div className="adm-modal__actions">
                    <button className="adm-btn adm-btn--primary" onClick={handleEditPayment}>Сохранить</button>
                    <button className="adm-btn adm-btn--ghost" onClick={() => setPmEditModal(null)}>Отмена</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── PRICES ── */}
        {section === "prices" && (
          <div className="adm-section">
            <div className="adm-section__top">
              <h1>Ценообразование</h1>
              <div className="adm-section__actions">
                <button className="adm-btn adm-btn--ghost" onClick={fetchPrices}>Обновить</button>
                <button className="adm-btn adm-btn--primary" onClick={() => openPriceModal()}>+ Добавить правило</button>
              </div>
            </div>

            <div className="adm-grid-2" style={{ marginBottom: 16 }}>
              <div className="adm-card adm-card--stat">
                <span className="adm-stat__label">Источник цен</span>
                <span className="adm-stat__value">TM Market API</span>
                <span className="adm-badge adm-badge--success">Подключено</span>
              </div>
              <div className="adm-card adm-card--stat">
                <span className="adm-stat__label">Активных правил</span>
                <span className="adm-stat__value">{pricingRules.length}</span>
              </div>
            </div>

            <div className="adm-card adm-card--accent" style={{ marginBottom: 16 }}>
              <div style={{ padding: "16px 20px", fontSize: 13, color: "var(--text-sec)", lineHeight: 1.6 }}>
                <strong style={{ color: "var(--text)" }}>Как работают правила:</strong><br/>
                <strong>Наценка %</strong> - умножает базовую цену: +10% = цена × 1.10, -15% = цена × 0.85<br/>
                <strong>Фиксированная</strong> - прибавляет/вычитает сумму в $: +5 = цена + 5$, -3 = цена - 3$<br/>
                <strong>Игра</strong> - правило для конкретной игры или всех сразу<br/>
                <strong>Предмет</strong> - правило для конкретного предмета (ID) или глобально<br/>
                <strong>Исключить</strong> - предмет не будет показан на сайте
              </div>
            </div>

            <div className="adm-card">
              <table className="adm-table">
                <thead><tr><th>Игра</th><th>Предмет</th><th>Тип</th><th>Значение</th><th>Исключён</th><th>Обновлён</th><th></th></tr></thead>
                <tbody>
                  {pricingRules.length > 0 ? pricingRules.map((r: any) => {
                    const val = parseFloat(r.adjustmentValue);
                    const isPercent = r.adjustmentType === "percentage";
                    const display = isPercent ? `${val >= 0 ? "+" : ""}${val}%` : `${val >= 0 ? "+" : ""}${val}$`;
                    const color = val > 0 ? "var(--success)" : val < 0 ? "var(--danger)" : "var(--text-sec)";
                    return (
                      <tr key={r.id}>
                        <td><span className="adm-badge adm-badge--created">{r.game ?? "Все"}</span></td>
                        <td>{r.itemExternalId ? <span className="adm-mono">{r.itemExternalId.length > 20 ? r.itemExternalId.slice(0, 20) + "…" : r.itemExternalId}</span> : "Глобально"}</td>
                        <td>{isPercent ? "Процент" : "Фиксированная"}</td>
                        <td style={{ fontWeight: 700, color }}>{display}</td>
                        <td>{r.isExcluded ? <span className="adm-badge adm-badge--danger">Да</span> : <span className="adm-badge adm-badge--success">Нет</span>}</td>
                        <td>{r.updatedAt ? new Date(r.updatedAt).toLocaleDateString("ru-RU") : "-"}</td>
                        <td className="adm-actions-cell">
                          <button className="adm-btn adm-btn--sm" onClick={() => openPriceModal(r)}>Ред.</button>
                          <button className="adm-btn adm-btn--danger adm-btn--sm" onClick={() => handleDeletePriceRule(r.id)}>Удалить</button>
                        </td>
                      </tr>
                    );
                  }) : <tr><td colSpan={7} className="adm-empty">Нет правил</td></tr>}
                </tbody>
              </table>
            </div>

            {priceModal && (
              <div className="adm-overlay" onClick={() => setPriceModal(null)}>
                <div className="adm-modal" onClick={(e) => e.stopPropagation()}>
                  <h2>{priceModal === "new" ? "Новое правило" : "Редактировать правило"}</h2>
                  <div className="adm-form">
                    <label>Игра
                      <select className="adm-input adm-select" value={priceForm.game} onChange={(e) => setPriceForm({ ...priceForm, game: e.target.value })}>
                        <option value="">Все игры</option>
                        <option value="CS2">CS2</option>
                        <option value="DOTA2">Dota 2</option>
                        <option value="TF2">TF2</option>
                        <option value="RUST">Rust</option>
                      </select>
                    </label>
                    <label>ID предмета (пусто = глобально)
                      <input className="adm-input" placeholder="Оставьте пустым для всех предметов" value={priceForm.itemExternalId} onChange={(e) => setPriceForm({ ...priceForm, itemExternalId: e.target.value })} />
                    </label>
                    <label>Тип корректировки
                      <select className="adm-input adm-select" value={priceForm.adjustmentType} onChange={(e) => setPriceForm({ ...priceForm, adjustmentType: e.target.value })}>
                        <option value="percentage">Процент (наценка/скидка %)</option>
                        <option value="fixed">Фиксированная сумма ($)</option>
                      </select>
                    </label>
                    <label>
                      Значение {priceForm.adjustmentType === "percentage" ? "(%, напр. 10 или -15)" : "($, напр. 5 или -3)"}
                      <input className="adm-input" type="number" step="0.01" placeholder={priceForm.adjustmentType === "percentage" ? "10" : "5.00"} value={priceForm.adjustmentValue} onChange={(e) => setPriceForm({ ...priceForm, adjustmentValue: e.target.value })} />
                      <span style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>
                        {priceForm.adjustmentType === "percentage"
                          ? "Положительное = наценка, отрицательное = скидка"
                          : "Положительное = прибавить, отрицательное = вычесть"}
                      </span>
                    </label>
                    <label style={{ flexDirection: "row", alignItems: "center", gap: 8, display: "flex", cursor: "pointer" }}>
                      <input type="checkbox" checked={priceForm.isExcluded} onChange={(e) => setPriceForm({ ...priceForm, isExcluded: e.target.checked })} style={{ width: 18, height: 18, accentColor: "var(--accent)" }} />
                      <span>Исключить предмет (не показывать на сайте)</span>
                    </label>
                  </div>
                  <div className="adm-modal__actions">
                    <button className="adm-btn adm-btn--primary" onClick={handleSavePriceRule}>{priceModal === "new" ? "Создать" : "Сохранить"}</button>
                    <button className="adm-btn adm-btn--ghost" onClick={() => setPriceModal(null)}>Отмена</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── BALANCES ── */}
        {section === "balances" && (
          <div className="adm-section">
            <div className="adm-section__top">
              <h1>Балансы</h1>
              <input className="adm-input" placeholder="Поиск юзера..." value={balancesSearch} onChange={(e) => setBalancesSearch(e.target.value)} />
            </div>
            <div className="adm-card">
              <table className="adm-table">
                <thead><tr><th>Юзер</th><th>Steam ID</th><th>Баланс</th><th>Дата регистрации</th><th></th></tr></thead>
                <tbody>
                  {filteredBalanceUsers.length > 0 ? filteredBalanceUsers.map((u: any) => (
                    <tr key={u.id}>
                      <td className="adm-bold">{u.steamLogin ?? "-"}</td>
                      <td className="adm-mono">{u.steamId ?? "-"}</td>
                      <td className="adm-bold">{parseFloat(u.balance ?? 0).toFixed(2)}$</td>
                      <td>{u.createdAt ? new Date(u.createdAt).toLocaleDateString("ru-RU") : "-"}</td>
                      <td className="adm-actions-cell">
                        <button className="adm-btn adm-btn--primary adm-btn--sm" onClick={() => setBalanceModal({ userId: u.id, username: u.steamLogin ?? u.steamId, action: "CREDIT" })}>+</button>
                        <button className="adm-btn adm-btn--danger adm-btn--sm" onClick={() => setBalanceModal({ userId: u.id, username: u.steamLogin ?? u.steamId, action: "DEBIT" })}>-</button>
                      </td>
                    </tr>
                  )) : <tr><td colSpan={5} className="adm-empty">Нет пользователей</td></tr>}
                </tbody>
              </table>
            </div>
            {balanceModal && (
              <div className="adm-overlay" onClick={() => setBalanceModal(null)}>
                <div className="adm-modal" onClick={(e) => e.stopPropagation()}>
                  <h2>{balanceModal.action === "CREDIT" ? "Пополнить" : "Списать"} - {balanceModal.username}</h2>
                  <div className="adm-form">
                    <label>Сумма ($)<input className="adm-input" type="number" min="0" step="0.01" placeholder="0.00" value={balanceAmount} onChange={(e) => setBalanceAmount(e.target.value)} /></label>
                    <label>Комментарий<input className="adm-input" placeholder="Причина..." value={balanceComment} onChange={(e) => setBalanceComment(e.target.value)} /></label>
                  </div>
                  <div className="adm-modal__actions">
                    <button className="adm-btn adm-btn--primary" onClick={handleBalanceSubmit}>Подтвердить</button>
                    <button className="adm-btn adm-btn--ghost" onClick={() => setBalanceModal(null)}>Отмена</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── CASHOUTS ── */}
        {section === "cashouts" && (
          <div className="adm-section">
            <div className="adm-section__top">
              <h1>Запросы на вывод</h1>
              <div className="adm-section__actions">
                <select className="adm-input adm-select" value={cashoutsStatus} onChange={(e) => setCashoutsStatus(e.target.value)}>
                  <option value="">Все</option>
                  <option value="PENDING">Pending</option>
                  <option value="APPROVED">Approved</option>
                  <option value="REJECTED">Rejected</option>
                  <option value="PAID">Paid</option>
                </select>
                <button className="adm-btn adm-btn--ghost" onClick={fetchCashouts}>Обновить</button>
              </div>
            </div>
            <div className="adm-card">
              <table className="adm-table">
                <thead><tr><th>ID</th><th>Юзер</th><th>Сумма</th><th>Метод</th><th>Статус</th><th>Дата</th><th></th></tr></thead>
                <tbody>
                  {cashouts.length > 0 ? cashouts.map((c: any) => (
                    <tr key={c.id}>
                      <td className="adm-mono">#{c.id?.slice(0, 8)}</td>
                      <td>{c.user?.steamLogin ?? "-"}</td>
                      <td className="adm-bold">{parseFloat(c.amount ?? 0).toFixed(2)}$</td>
                      <td>{c.paymentMethod ?? "-"}</td>
                      <td><span className={`adm-badge adm-badge--${(c.status ?? "").toLowerCase()}`}>{c.status}</span></td>
                      <td>{c.createdAt ? new Date(c.createdAt).toLocaleDateString("ru-RU") : "-"}</td>
                      <td className="adm-actions-cell">
                        {c.status === "PENDING" && <>
                          <button className="adm-btn adm-btn--primary adm-btn--sm" onClick={() => handleAction("PATCH", `/api/admin/cashouts/${c.id}`, { status: "APPROVED" }, "Одобрено", fetchCashouts)}>ОК</button>
                          <button className="adm-btn adm-btn--danger adm-btn--sm" onClick={() => handleAction("PATCH", `/api/admin/cashouts/${c.id}`, { status: "REJECTED" }, "Отклонено", () => { fetchCashouts(); fetchUsers(); })}>Отклонить</button>
                        </>}
                        {c.status === "APPROVED" && <button className="adm-btn adm-btn--primary adm-btn--sm" onClick={() => handleAction("PATCH", `/api/admin/cashouts/${c.id}`, { status: "PAID" }, "Оплачено", fetchCashouts)}>Paid</button>}
                      </td>
                    </tr>
                  )) : <tr><td colSpan={7} className="adm-empty">Нет запросов</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── BOTS ── */}
        {section === "bots" && (
          <div className="adm-section">
            <div className="adm-section__top"><h1>Steam боты</h1></div>
            <div className="adm-card">
              <table className="adm-table">
                <thead><tr><th>Бот</th><th>Steam ID</th><th>Профиль</th><th>Статус</th><th></th></tr></thead>
                <tbody>
                  {bots.length > 0 ? bots.map((b: any, i: number) => (
                    <tr key={b.id ?? i}>
                      <td className="adm-bold">{b.name ?? `Bot #${i + 1}`}</td>
                      <td className="adm-mono">{b.steamId ?? "-"}</td>
                      <td>{b.steamProfileUrl ? <a href={b.steamProfileUrl} target="_blank" rel="noopener noreferrer" className="adm-link">Профиль</a> : "-"}</td>
                      <td><span className={`adm-badge adm-badge--${b.active !== false ? "success" : "danger"}`}>{b.active !== false ? "Активен" : "Выкл"}</span></td>
                      <td><button className="adm-btn adm-btn--sm" onClick={() => handleAction("PATCH", `/api/admin/bots/${b.id}`, { active: !b.active }, b.active ? "Выключен" : "Включён")}>{b.active ? "Выкл" : "Вкл"}</button></td>
                    </tr>
                  )) : <tr><td colSpan={5} className="adm-empty">Нет ботов</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── REFERRALS ── */}
        {section === "referrals" && (
          <div className="adm-section">
            <div className="adm-section__top"><h1>Реферальная программа</h1></div>
            <div className="adm-card">
              <table className="adm-table">
                <thead><tr><th>Партнёр</th><th>Код</th><th>Приведено</th><th>Активен</th><th>Создан</th></tr></thead>
                <tbody>
                  {referrals.length > 0 ? referrals.map((r: any) => (
                    <tr key={r.id}>
                      <td className="adm-bold">{r.name ?? "-"}</td>
                      <td className="adm-mono">{r.code ?? "-"}</td>
                      <td>{r.userCount ?? 0}</td>
                      <td><span className={`adm-badge adm-badge--${r.active !== false ? "success" : "danger"}`}>{r.active !== false ? "Да" : "Нет"}</span></td>
                      <td>{r.createdAt ? new Date(r.createdAt).toLocaleDateString("ru-RU") : "-"}</td>
                    </tr>
                  )) : <tr><td colSpan={5} className="adm-empty">Нет рефералов</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── AUDIT LOGS ── */}
        {section === "logs" && (
          <div className="adm-section">
            <div className="adm-section__top">
              <h1>Аудит</h1>
              <div className="adm-section__actions">
                <input className="adm-input" placeholder="Поиск в логах..." value={logsSearch} onChange={(e) => setLogsSearch(e.target.value)} />
                <button className="adm-btn adm-btn--ghost" onClick={fetchAuditLogs}>Обновить</button>
              </div>
            </div>
            <div className="adm-card">
              <table className="adm-table">
                <thead><tr><th>Время</th><th>Кто</th><th>Действие</th><th>Объект</th><th>Детали</th></tr></thead>
                <tbody>
                  {auditLogs.length > 0 ? auditLogs.map((l: any) => (
                    <tr key={l.id}>
                      <td>{l.createdAt ? new Date(l.createdAt).toLocaleString("ru-RU") : "-"}</td>
                      <td className="adm-mono">{l.actorId?.slice(0, 8) ?? "system"}</td>
                      <td>{l.action ?? "-"}</td>
                      <td>{l.entityType}{l.entityId ? ` #${l.entityId.slice(0, 8)}` : ""}</td>
                      <td className="adm-truncate">{typeof l.details === "object" ? JSON.stringify(l.details) : (l.details ?? "-")}</td>
                    </tr>
                  )) : <tr><td colSpan={5} className="adm-empty">Нет логов</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── SOCIAL ── */}
        {section === "social" && (
          <div className="adm-section">
            <div className="adm-section__top"><h1>Соц. ссылки</h1></div>
            <div className="adm-card">
              <div className="adm-form adm-form--wide">
                {[
                  { key: "social_discord", label: "Discord", placeholder: "https://discord.gg/..." },
                  { key: "social_twitter", label: "Twitter / X", placeholder: "https://x.com/..." },
                  { key: "social_steam_group", label: "Steam Group", placeholder: "https://steamcommunity.com/groups/..." },
                  { key: "social_telegram", label: "Telegram", placeholder: "https://t.me/..." },
                  { key: "social_contact_email", label: "Email", placeholder: "support@example.com" },
                ].map((sk) => (
                  <label key={sk.key}>{sk.label}<input className="adm-input" placeholder={sk.placeholder} value={socialLinks[sk.key] ?? ""} onChange={(e) => setSocialLinks((p) => ({ ...p, [sk.key]: e.target.value }))} /></label>
                ))}
              </div>
              <div style={{ marginTop: 20 }}>
                <button className="adm-btn adm-btn--primary" onClick={handleSaveSocial} disabled={socialSaving}>{socialSaving ? "Сохранение..." : "Сохранить"}</button>
              </div>
            </div>
          </div>
        )}

      </main>

      {/* Toasts */}
      <div className="adm-toasts">
        {toasts.map((msg, i) => <Toast key={`${msg}-${i}`} message={msg} onDone={() => removeToast(i)} />)}
      </div>
    </div>
  );
}
