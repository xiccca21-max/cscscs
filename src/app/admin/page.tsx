"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import Link from "next/link";
import { PRICING_PHASE_OPTIONS, skinMarketNameHasPhases } from "@/lib/pricingPhases";

type Section = "orders" | "users" | "payments" | "prices" | "balances" | "cashouts" | "bots" | "referrals" | "logs" | "social" | "reviews" | "promo";

type ToastItem = { id: number; message: string; type?: "order" | "cashout" | "message" | "default" };

let toastIdCounter = 0;

function createWorkerInterval(callback: () => void, ms: number): () => void {
  try {
    const blob = new Blob(
      [`setInterval(()=>postMessage(1),${ms})`],
      { type: "application/javascript" },
    );
    const w = new Worker(URL.createObjectURL(blob));
    w.onmessage = () => callback();
    return () => w.terminate();
  } catch {
    const id = setInterval(callback, ms);
    return () => clearInterval(id);
  }
}

async function playNotifSound(type: "order" | "cashout" | "message" | "default") {
  try {
    const ctx = new AudioContext();
    if (ctx.state === "suspended") await ctx.resume();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    gain.gain.value = 0.18;
    if (type === "order") {
      osc.frequency.value = 880;
      osc.type = "sine";
      gain.gain.setValueAtTime(0.18, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
      osc.start();
      osc.stop(ctx.currentTime + 0.4);
      setTimeout(() => {
        const osc2 = ctx.createOscillator();
        const g2 = ctx.createGain();
        osc2.connect(g2); g2.connect(ctx.destination);
        osc2.frequency.value = 1100;
        osc2.type = "sine";
        g2.gain.value = 0.18;
        g2.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5 + 0.3);
        osc2.start(ctx.currentTime + 0.5);
        osc2.stop(ctx.currentTime + 0.5 + 0.3);
      }, 200);
    } else if (type === "cashout") {
      osc.frequency.value = 660;
      osc.type = "triangle";
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
      osc.start();
      osc.stop(ctx.currentTime + 0.5);
    } else {
      osc.frequency.value = 520;
      osc.type = "sine";
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
      osc.start();
      osc.stop(ctx.currentTime + 0.3);
    }
  } catch {}
}

const TOAST_COLORS: Record<string, string> = {
  order: "#22c55e",
  cashout: "#f59e0b",
  message: "#3b82f6",
  default: "#6366f1",
};

function Toast({ item, onRemove }: { item: ToastItem; onRemove: (id: number) => void }) {
  useEffect(() => {
    const t = setTimeout(() => onRemove(item.id), 8000);
    return () => clearTimeout(t);
  }, [item.id, onRemove]);
  const color = TOAST_COLORS[item.type ?? "default"];
  return (
    <div className="adm-toast" style={{ borderLeft: `4px solid ${color}` }}>
      {item.message}
    </div>
  );
}

export default function AdminPage() {
  const [section, setSection] = useState<Section>("orders");
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const prevOrderIdsRef = useRef<Set<string>>(new Set());
  const prevCashoutIdsRef = useRef<Set<string>>(new Set());
  const prevChatCountRef = useRef<number>(0);
  const prevUnreadRef = useRef<number>(0);
  const [newOrdersCount, setNewOrdersCount] = useState(0);
  const [newCashoutsCount, setNewCashoutsCount] = useState(0);

  const [orders, setOrders] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<any[]>([]);
  const [pricingRules, setPricingRules] = useState<any[]>([]);
  const [cashouts, setCashouts] = useState<any[]>([]);
  const [cashoutDetail, setCashoutDetail] = useState<any | null>(null);
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

  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [chatSending, setChatSending] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [adminReady, setAdminReady] = useState(false);

  const [socialLinks, setSocialLinks] = useState<Record<string, string>>({});
  const [socialSaving, setSocialSaving] = useState(false);

  const [reviewsList, setReviewsList] = useState<any[]>([]);
  const [reviewModal, setReviewModal] = useState<any | null>(null);
  const [reviewForm, setReviewForm] = useState({ user: "", steam: "", avatar: "", textEn: "", textRu: "", game: "CS2", stars: "5" });
  const [reviewFetching, setReviewFetching] = useState(false);

  const [promoList, setPromoList] = useState<any[]>([]);
  const [promoModal, setPromoModal] = useState<any | null>(null);
  const [promoForm, setPromoForm] = useState({ code: "", discount: "", usageLimit: "", expiresAt: "" });
  const [promoSaving, setPromoSaving] = useState(false);

  const [exchangeRate, setExchangeRate] = useState("");
  const [eurRate, setEurRate] = useState("");
  const [exchangeRateSaving, setExchangeRateSaving] = useState(false);

  const [minItemPrice, setMinItemPrice] = useState("");
  const [minItemPriceSaving, setMinItemPriceSaving] = useState(false);

  const [pmModal, setPmModal] = useState(false);
  const [pmForm, setPmForm] = useState({ name: "", type: "card", commission: "0", minAmount: "0", currencies: "RUB" });
  const [pmSaving, setPmSaving] = useState(false);

  const [pmEditModal, setPmEditModal] = useState<any>(null);
  const [pmEditForm, setPmEditForm] = useState({ name: "", commission: "", minAmount: "" });

  const [priceModal, setPriceModal] = useState<any | null>(null);
  const [priceForm, setPriceForm] = useState({
    game: "",
    itemExternalId: "",
    phase: "",
    adjustmentType: "percentage",
    adjustmentValue: "",
    isExcluded: false,
  });
  const [tmItemQuery, setTmItemQuery] = useState("");
  const [tmItemResults, setTmItemResults] = useState<string[]>([]);
  const [tmItemLoading, setTmItemLoading] = useState(false);
  const [tmItemOpen, setTmItemOpen] = useState(false);
  const [tmSearchDebounced, setTmSearchDebounced] = useState("");
  const tmComboRef = useRef<HTMLDivElement>(null);

  const addToast = useCallback((msg: string, type?: ToastItem["type"]) => {
    const id = ++toastIdCounter;
    setToasts((p) => [...p, { id, message: msg, type: type ?? "default" }]);
    if (type && type !== "default") playNotifSound(type);
  }, []);
  const removeToast = useCallback((id: number) => setToasts((p) => p.filter((t) => t.id !== id)), []);

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

  useEffect(() => {
    const id = setTimeout(() => setTmSearchDebounced(tmItemQuery), 280);
    return () => clearTimeout(id);
  }, [tmItemQuery]);

  useEffect(() => {
    if (!priceModal || !priceForm.game) {
      setTmItemResults([]);
      return;
    }
    const q = tmSearchDebounced.trim();
    if (q.length < 2) {
      setTmItemResults([]);
      return;
    }
    let cancelled = false;
    setTmItemLoading(true);
    fetch(
      `/api/admin/tm-items?game=${encodeURIComponent(priceForm.game)}&q=${encodeURIComponent(q)}`,
    )
      .then((r) => r.json())
      .then((j) => {
        if (!cancelled && j?.success && Array.isArray(j.data)) setTmItemResults(j.data);
      })
      .catch(() => {
        if (!cancelled) setTmItemResults([]);
      })
      .finally(() => {
        if (!cancelled) setTmItemLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [priceModal, priceForm.game, tmSearchDebounced]);

  useEffect(() => {
    if (!priceModal || !tmItemOpen) return;
    const fn = (e: MouseEvent) => {
      if (tmComboRef.current && !tmComboRef.current.contains(e.target as Node)) setTmItemOpen(false);
    };
    document.addEventListener("mousedown", fn);
    return () => document.removeEventListener("mousedown", fn);
  }, [priceModal, tmItemOpen]);

  useEffect(() => {
    if (!priceModal) {
      setTmItemQuery("");
      setTmItemResults([]);
      setTmItemOpen(false);
    }
  }, [priceModal]);

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
  const fetchReviews = useCallback(async () => { const d = await safeFetch("/api/admin/reviews"); if (d?.data) setReviewsList(d.data); }, [safeFetch]);
  const fetchPromos = useCallback(async () => { const d = await safeFetch("/api/admin/promo"); if (d?.data) setPromoList(d.data); }, [safeFetch]);

  useEffect(() => {
    const init = async () => {
      const sessionRes = await fetch("/api/auth/session");
      const session = await sessionRes.json();
      const u = session?.data;
      if (!u) { setAuthError("Войдите через Steam"); setAdminReady(true); return; }
      if (!u.isAdmin) { setAuthError(`Нет прав. Steam ID: ${u.steamId}. Добавьте в ADMIN_STEAM_IDS.`); setAdminReady(true); return; }
      setAdminReady(true);
      {
        const params = new URLSearchParams(); params.set("limit", "50");
        const d = await safeFetch(`/api/admin/orders?${params.toString()}`);
        if (d) {
          const initOrders = d.data?.orders ?? [];
          setOrders(initOrders);
          prevOrderIdsRef.current = new Set(initOrders.map((o: any) => o.id));
        }
      }
      fetchUsers(); fetchPayments();
      fetchPrices();
      {
        const dc = await safeFetch("/api/admin/cashouts");
        if (dc) {
          const initCashouts = dc.data?.cashouts ?? [];
          setCashouts(initCashouts);
          prevCashoutIdsRef.current = new Set(initCashouts.map((c: any) => c.id));
        }
      }
      safeFetch("/api/admin/bots").then((d) => { if (d) setBots(d.data ?? []); });
      safeFetch("/api/admin/referrals").then((d) => { if (d) setReferrals(d.data ?? []); });
      fetchAuditLogs();
      fetchReviews();
      fetchPromos();
      safeFetch("/api/admin/settings").then((d) => {
        if (d?.data) {
          setSocialLinks(d.data);
          if (d.data.exchange_rate_usd_rub) setExchangeRate(d.data.exchange_rate_usd_rub);
          if (d.data.exchange_rate_usd_eur) setEurRate(d.data.exchange_rate_usd_eur);
          if (d.data.min_item_price_usd) setMinItemPrice(d.data.min_item_price_usd);
        }
      });
    };
    init();
  }, [fetchUsers, fetchAuditLogs, fetchPayments, fetchPrices, fetchReviews, fetchPromos, safeFetch]);

  const pollRef = useRef<() => void>(() => {});
  pollRef.current = async () => {
    {
      const params = new URLSearchParams();
      params.set("limit", "50");
      if (section === "orders") {
        if (ordersStatus) params.set("status", ordersStatus);
        if (ordersSearch.trim()) params.set("search", ordersSearch.trim());
      }
      const d = await safeFetch(`/api/admin/orders?${params.toString()}`);
      if (d) {
        const newOrders = d.data?.orders ?? [];
        const newIds = new Set<string>(newOrders.map((o: any) => o.id as string));
        if (prevOrderIdsRef.current.size > 0) {
          const fresh = newOrders.filter((o: any) => !prevOrderIdsRef.current.has(o.id));
          fresh.forEach((o: any) => addToast(`Новый заказ #${o.orderNumber} — $${parseFloat(o.totalAmount).toFixed(2)}`, "order"));
        }
        prevOrderIdsRef.current = newIds;
        if (section === "orders") setOrders(newOrders);
        setNewOrdersCount(newOrders.filter((o: any) => o.status === "CREATED").length);
      }
    }
    {
      const dc = await safeFetch("/api/admin/cashouts");
      if (dc) {
        const newCashouts = dc.data?.cashouts ?? [];
        const newCIds = new Set<string>(newCashouts.map((c: any) => c.id as string));
        if (prevCashoutIdsRef.current.size > 0) {
          const fresh = newCashouts.filter((c: any) => !prevCashoutIdsRef.current.has(c.id));
          fresh.forEach((c: any) => addToast(`Новый запрос на вывод — $${parseFloat(c.amount ?? 0).toFixed(2)}`, "cashout"));
        }
        prevCashoutIdsRef.current = newCIds;
        if (section === "cashouts") setCashouts(newCashouts);
        setNewCashoutsCount(newCashouts.filter((c: any) => c.status === "CREATED").length);
      }
    }
    {
      const dm = await safeFetch("/api/admin/orders/unread-messages");
      if (dm) {
        const cnt = dm.data?.count ?? 0;
        if (prevUnreadRef.current > 0 && cnt > prevUnreadRef.current) {
          addToast(`Новое сообщение от клиента`, "message");
        }
        prevUnreadRef.current = cnt;
      }
    }
  };

  useEffect(() => {
    if (!adminReady || authError) return;
    return createWorkerInterval(() => pollRef.current(), 3000);
  }, [adminReady, authError]);

  useEffect(() => {
    if (!adminReady || authError || section !== "orders") return;
    const t = setTimeout(() => {
      fetchOrders();
    }, 250);
    return () => clearTimeout(t);
  }, [ordersSearch, ordersStatus, section, adminReady, authError, fetchOrders]);

  const orderDetailPollRef = useRef<() => void>(() => {});
  orderDetailPollRef.current = async () => {
    if (!orderDetail?.id || section !== "orders") return;
    const d = await safeFetch(`/api/admin/orders/${orderDetail.id}`);
    if (d?.data) setOrderDetail(d.data);
  };
  useEffect(() => {
    if (!orderDetail?.id || section !== "orders") return;
    return createWorkerInterval(() => orderDetailPollRef.current(), 3000);
  }, [orderDetail?.id, section]);

  const chatPollRef = useRef<() => void>(() => {});
  chatPollRef.current = async () => {
    if (!orderDetail?.id) return;
    const d = await safeFetch(`/api/admin/orders/${orderDetail.id}/messages`);
    if (d?.data) {
      const msgs = d.data;
      const userMsgs = msgs.filter((m: any) => m.authorRole === "user");
      if (prevChatCountRef.current > 0 && userMsgs.length > prevChatCountRef.current) {
        addToast(`Новое сообщение от клиента (заказ #${orderDetail.orderNumber ?? ""})`, "message");
      }
      prevChatCountRef.current = userMsgs.length;
      setChatMessages(msgs);
    }
  };
  useEffect(() => {
    if (!orderDetail?.id) { setChatMessages([]); prevChatCountRef.current = 0; return; }
    chatPollRef.current();
    return createWorkerInterval(() => chatPollRef.current(), 4000);
  }, [orderDetail?.id]);


  const sendChatMsg = async () => {
    if (!chatInput.trim() || !orderDetail?.id || chatSending) return;
    setChatSending(true);
    try {
      const r = await fetch(`/api/admin/orders/${orderDetail.id}/messages`, {
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
    setTmItemQuery("");
    setTmItemResults([]);
    setTmItemOpen(false);
    setTmSearchDebounced("");
    if (rule) {
      setPriceForm({
        game: rule.game ?? "",
        itemExternalId: rule.itemExternalId ?? "",
        phase: rule.phase ?? "",
        adjustmentType: rule.adjustmentType ?? "percentage",
        adjustmentValue: String(rule.adjustmentValue ?? ""),
        isExcluded: !!rule.isExcluded,
      });
      setPriceModal(rule);
    } else {
      setPriceForm({
        game: "",
        itemExternalId: "",
        phase: "",
        adjustmentType: "percentage",
        adjustmentValue: "",
        isExcluded: false,
      });
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
      phase: priceForm.phase || null,
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
    { key: "reviews", label: "Отзывы" },
    { key: "promo", label: "Промокоды" },
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
          SKINSELL <span className="adm-header__badge">admin</span>
        </Link>
        <nav className="adm-tabs">
          {tabs.map((t) => (
            <button key={t.key} className={`adm-tab${section === t.key ? " adm-tab--active" : ""}`} onClick={() => setSection(t.key)}>
              {t.label}
              {t.key === "orders" && newOrdersCount > 0 && <span className="adm-tab__badge">{newOrdersCount}</span>}
              {t.key === "cashouts" && newCashoutsCount > 0 && <span className="adm-tab__badge">{newCashoutsCount}</span>}
            </button>
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
                      <td style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <button className="adm-btn adm-btn--sm" onClick={() => setOrderDetail(o)}>Детали</button>
                        {(o._count?.messages ?? 0) > 0 && <span className="adm-tab__badge" title="Непрочитанных сообщений">{o._count.messages}</span>}
                      </td>
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

                  {orderDetail.status === "CREATED" && (
                    <div style={{ marginTop: 16, padding: 14, background: "rgba(99,102,241,0.06)", borderRadius: 10, border: "1px solid rgba(99,102,241,0.15)" }}>
                      <span className="adm-label" style={{ display: "block", marginBottom: 8 }}>Отправить трейд оффер</span>
                      {orderDetail.tradeUrl && (
                        <div style={{ marginBottom: 10, padding: 10, background: "rgba(34,197,94,0.06)", borderRadius: 8, border: "1px solid rgba(34,197,94,0.15)" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                            <button
                              className="adm-btn adm-btn--primary adm-btn--sm"
                              onClick={() => {
                                const GAME_APP_IDS: Record<string, string> = { CS2: "730", DOTA2: "570", TF2: "440", RUST: "252490" };
                                const tradeUrl: string = orderDetail.tradeUrl;
                                const url = new URL(tradeUrl);
                                const partner = url.searchParams.get("partner") ?? "";
                                const token = url.searchParams.get("token") ?? "";
                                if (!partner || !token) { alert("Невалидный Trade URL пользователя"); return; }
                                const params = new URLSearchParams({ partner, token });
                                (orderDetail.items ?? []).forEach((it: any) => {
                                  const appId = GAME_APP_IDS[it.game] ?? "730";
                                  if (it.externalId) params.append("for_item", `${appId}_2_${it.externalId}`);
                                });
                                window.open(`https://steamcommunity.com/tradeoffer/new/?${params.toString()}`, "_blank");
                              }}
                            >
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                              {" "}Открыть трейд с предметами
                            </button>
                            <button
                              className="adm-btn adm-btn--ghost adm-btn--sm"
                              onClick={() => {
                                const tradeUrl: string = orderDetail.tradeUrl;
                                const url = new URL(tradeUrl);
                                const partner = url.searchParams.get("partner") ?? "";
                                const token = url.searchParams.get("token") ?? "";
                                if (!partner || !token) { alert("Невалидный Trade URL пользователя"); return; }
                                window.open(`https://steamcommunity.com/tradeoffer/new/?partner=${partner}&token=${token}`, "_blank");
                              }}
                            >Открыть трейд (без предвыбора)</button>
                          </div>
                          <span style={{ fontSize: 11, color: "rgba(255,255,255,0.45)", marginTop: 6, display: "block", lineHeight: 1.5 }}>
                            Предвыбор предметов работает только с расширением{" "}
                            <a href="https://steamdb.info/extension/" target="_blank" rel="noopener noreferrer" style={{ color: "var(--accent)", textDecoration: "underline" }}>SteamDB</a>
                            {" "}(Chrome / Firefox). Без него — откроется пустой трейд.
                          </span>
                        </div>
                      )}
                      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                        <input className="adm-input" placeholder="Ссылка на профиль бота Steam" value={botUrlInput} onChange={(e) => setBotUrlInput(e.target.value)} />
                        <input className="adm-input" placeholder="ID трейд оффера (число)" value={tradeOfferUrlInput} onChange={(e) => setTradeOfferUrlInput(e.target.value)} />
                      </div>
                      <span style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginTop: 6, display: "block" }}>Создайте оффер в Steam → скопируйте ID из отправленных офферов</span>
                      <button className="adm-btn adm-btn--primary adm-btn--sm" style={{ marginTop: 10 }} disabled={!botUrlInput.trim() || !tradeOfferUrlInput.trim() || botResolving} onClick={async () => {
                        setBotResolving(true);
                        try {
                          const profileRes = await fetch(`/api/steam/profile?url=${encodeURIComponent(botUrlInput.trim())}`);
                          const profileJson = await profileRes.json();
                          const botName = profileJson.success ? profileJson.data.name : "Bot";
                          const raw = tradeOfferUrlInput.trim();
                          const offerId = raw.match(/tradeoffer\/(\d+)/)?.[1] ?? raw.replace(/\D/g, "");
                          const offerUrl = `https://steamcommunity.com/tradeoffer/${offerId}/`;
                          const res = await handleAction("PATCH", `/api/admin/orders/${orderDetail.id}`, {
                            botName,
                            botSteamProfileUrl: botUrlInput.trim(),
                            tradeOfferUrl: offerUrl,
                            status: "TRADE_SENT",
                          }, "Трейд оффер отправлен", async () => { fetchOrders(); });
                          if (res?.data) { setOrderDetail(res.data); setBotUrlInput(""); setTradeOfferUrlInput(""); }
                        } finally { setBotResolving(false); }
                      }}>{botResolving ? "Загрузка..." : "Трейд отправлен"}</button>
                    </div>
                  )}

                  {/* ── Chat ── */}
                  <div className="adm-chat">
                    <div className="adm-chat__accent" />
                    <div className="adm-chat__header">
                      <div className="adm-chat__header-left">
                        <div className="adm-chat__header-icon">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                        </div>
                        <span>Чат с клиентом</span>
                      </div>
                      <div className="adm-chat__status">
                        <span className="adm-chat__status-dot" />
                        {chatMessages.length > 0 ? `${chatMessages.length} сообщ.` : "Пусто"}
                      </div>
                    </div>
                    <div className="adm-chat__messages">
                      {chatMessages.length === 0 && (
                        <div className="adm-chat__empty">
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                          <span>Нет сообщений</span>
                        </div>
                      )}
                      {chatMessages.map((m: any) => (
                        <div key={m.id} className={`adm-chat__msg adm-chat__msg--${m.authorRole}`}>
                          <div className="adm-chat__bubble">{m.body}</div>
                          <span className="adm-chat__time">
                            {m.authorRole === "admin" ? "Вы" : "Клиент"} · {new Date(m.createdAt).toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" })}
                          </span>
                        </div>
                      ))}
                    </div>
                    <div className="adm-chat__input-area">
                      <input
                        className="adm-chat__input"
                        placeholder="Написать сообщение..."
                        value={chatInput}
                        onChange={(e) => setChatInput(e.target.value)}
                        onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendChatMsg(); } }}
                        maxLength={2000}
                      />
                      <button className="adm-chat__send" disabled={chatSending || !chatInput.trim()} onClick={sendChatMsg}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
                      </button>
                    </div>
                  </div>

                  <div className="adm-modal__actions" style={{ marginTop: 16 }}>
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
                        {!["balance","card","crypto","btc","usdt-trc20","usdt-erc20","eth","ltc","bank"].includes(pm.type) ? (
                          <button className="adm-btn adm-btn--danger adm-btn--sm" onClick={() => handleDeletePayment(pm.id)}>Удалить</button>
                        ) : (
                          <span style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", padding: "4px 8px" }}>Системный</span>
                        )}
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
                        <option value="balance">Balance</option>
                        <option value="card">Card</option>
                        <option value="btc">Bitcoin (BTC)</option>
                        <option value="usdt-trc20">USDT (TRC-20)</option>
                        <option value="eth">Ethereum (ETH)</option>
                        <option value="usdt-erc20">USDT (ERC-20)</option>
                        <option value="ltc">Litecoin (LTC)</option>
                        <option value="bank">Bank</option>
                        <option value="sbp">СБП</option>
                        <option value="qiwi">QIWI</option>
                        <option value="yoomoney">YooMoney</option>
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

            <div className="adm-card" style={{ marginBottom: 16, padding: "16px 20px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                <span style={{ fontWeight: 700, fontSize: 14, whiteSpace: "nowrap" }}>Мин. цена предмета ($)</span>
                <span style={{ fontSize: 12, color: "var(--text-muted)" }}>Предметы дешевле этого порога нельзя будет выбрать для продажи</span>
                <div style={{ display: "flex", gap: 8, alignItems: "center", marginLeft: "auto" }}>
                  <input
                    className="adm-input"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    value={minItemPrice}
                    onChange={(e) => setMinItemPrice(e.target.value)}
                    style={{ width: 120 }}
                  />
                  <button
                    className="adm-btn adm-btn--primary adm-btn--sm"
                    disabled={minItemPriceSaving}
                    onClick={async () => {
                      setMinItemPriceSaving(true);
                      try {
                        await fetch("/api/admin/settings", {
                          method: "PATCH",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ key: "min_item_price_usd", value: minItemPrice || "0" }),
                        });
                        addToast("Мин. цена сохранена", "default");
                      } catch { addToast("Ошибка сохранения", "default"); }
                      finally { setMinItemPriceSaving(false); }
                    }}
                  >{minItemPriceSaving ? "..." : "Сохранить"}</button>
                </div>
              </div>
            </div>

            <div className="adm-card adm-card--accent" style={{ marginBottom: 16 }}>
              <div style={{ padding: "16px 20px", fontSize: 13, color: "var(--text-sec)", lineHeight: 1.6 }}>
                <strong style={{ color: "var(--text)" }}>Как работают правила:</strong><br/>
                <strong>Наценка %</strong> - умножает базовую цену: +10% = цена × 1.10, -15% = цена × 0.85<br/>
                <strong>Фиксированная</strong> - прибавляет/вычитает сумму в $: +5 = цена + 5$, -3 = цена - 3$<br/>
                <strong>Игра</strong> - правило для конкретной игры или всех сразу<br/>
                <strong>Предмет</strong> - правило для конкретного предмета (ID) или глобально<br/>
                <strong>Исключить</strong> - предмет не будет показан на сайте<br/>
                <strong>Фаза</strong> — только для Doppler / Gamma Doppler; пусто = все фазы. С правилом без фазы эффекты суммируются.
              </div>
            </div>

            <div className="adm-card">
              <table className="adm-table">
                <thead><tr><th>Игра</th><th>Предмет</th><th>Фаза</th><th>Тип</th><th>Значение</th><th>Исключён</th><th>Обновлён</th><th></th></tr></thead>
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
                        <td>{r.phase ? <span className="adm-mono">{r.phase}</span> : "—"}</td>
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
                  }) : <tr><td colSpan={8} className="adm-empty">Нет правил</td></tr>}
                </tbody>
              </table>
            </div>

            {priceModal && (
              <div className="adm-overlay" onClick={() => setPriceModal(null)}>
                <div className="adm-modal" onClick={(e) => e.stopPropagation()}>
                  <h2>{priceModal === "new" ? "Новое правило" : "Редактировать правило"}</h2>
                  <div className="adm-form">
                    <label>Игра
                      <select
                        className="adm-input adm-select"
                        value={priceForm.game}
                        onChange={(e) =>
                          setPriceForm({
                            ...priceForm,
                            game: e.target.value,
                            itemExternalId: "",
                            phase: "",
                          })
                        }
                      >
                        <option value="">Все игры</option>
                        <option value="CS2">CS2</option>
                        <option value="DOTA2">Dota 2</option>
                        <option value="TF2">TF2</option>
                        <option value="RUST">Rust</option>
                      </select>
                    </label>
                    <div style={{ display: "grid", gap: 4, fontSize: 13, fontWeight: 600, color: "var(--text)", position: "relative", zIndex: tmItemOpen ? 50 : 1 }}>
                      <span>Предмет (пусто = глобально)</span>
                      {!priceForm.game ? (
                        <span style={{ fontSize: 12, color: "var(--text-muted)", fontWeight: 400 }}>Сначала выберите игру для поиска по TM</span>
                      ) : (
                        <div ref={tmComboRef} style={{ position: "relative" }}>
                          {priceForm.itemExternalId ? (
                            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8, flexWrap: "wrap" }}>
                              <span className="adm-mono" style={{ fontSize: 12, wordBreak: "break-all" }}>{priceForm.itemExternalId}</span>
                              <button
                                type="button"
                                className="adm-btn adm-btn--sm adm-btn--ghost"
                                onClick={() => setPriceForm({ ...priceForm, itemExternalId: "", phase: "" })}
                              >
                                Сбросить
                              </button>
                            </div>
                          ) : null}
                          <input
                            className="adm-input"
                            placeholder="Поиск на TM (от 2 символов)…"
                            value={tmItemQuery}
                            onChange={(e) => {
                              setTmItemQuery(e.target.value);
                              setTmItemOpen(true);
                            }}
                            onFocus={() => setTmItemOpen(true)}
                          />
                          {tmItemOpen && tmItemResults.length > 0 && (
                            <div
                              style={{
                                position: "absolute",
                                zIndex: 9999,
                                left: 0,
                                right: 0,
                                top: "100%",
                                marginTop: 4,
                                maxHeight: 220,
                                overflowY: "auto",
                                background: "var(--bg-card)",
                                border: "1px solid var(--border)",
                                borderRadius: 8,
                                boxShadow: "0 12px 32px rgba(0,0,0,0.45)",
                              }}
                            >
                              {tmItemResults.map((name) => (
                                <button
                                  key={name}
                                  type="button"
                                  onMouseDown={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    setPriceForm({ ...priceForm, itemExternalId: name, phase: "" });
                                    setTmItemQuery("");
                                    setTmItemOpen(false);
                                  }}
                                  style={{
                                    display: "block",
                                    width: "100%",
                                    textAlign: "left",
                                    padding: "10px 14px",
                                    fontSize: 13,
                                    border: "none",
                                    borderBottom: "1px solid var(--border)",
                                    background: "var(--bg-card)",
                                    color: "var(--text)",
                                    cursor: "pointer",
                                  }}
                                  onMouseEnter={(e) => { (e.target as HTMLElement).style.background = "var(--accent)"; (e.target as HTMLElement).style.color = "#fff"; }}
                                  onMouseLeave={(e) => { (e.target as HTMLElement).style.background = "var(--bg-card)"; (e.target as HTMLElement).style.color = "var(--text)"; }}
                                >
                                  {name}
                                </button>
                              ))}
                            </div>
                          )}
                          {tmItemLoading && <span style={{ fontSize: 11, color: "var(--text-muted)" }}>Загрузка…</span>}
                        </div>
                      )}
                      <input
                        className="adm-input"
                        style={{ marginTop: 8 }}
                        placeholder="Или вставьте market_hash_name вручную"
                        value={priceForm.itemExternalId}
                        onChange={(e) => setPriceForm({ ...priceForm, itemExternalId: e.target.value })}
                      />
                    </div>
                    {(skinMarketNameHasPhases(priceForm.itemExternalId) || !!priceForm.phase) && (
                      <label>Фаза (Doppler / Gamma)
                        <select
                          className="adm-input adm-select"
                          value={priceForm.phase}
                          onChange={(e) => setPriceForm({ ...priceForm, phase: e.target.value })}
                        >
                          <option value="">Любая фаза</option>
                          {PRICING_PHASE_OPTIONS.map((o) => (
                            <option key={o.value} value={o.value}>{o.label}</option>
                          ))}
                        </select>
                      </label>
                    )}
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
          <>
          <div className="adm-section">
              <div className="adm-section__top">
                <h1>Запросы на вывод</h1>
                <div className="adm-section__actions">
                  <select className="adm-input adm-select" value={cashoutsStatus} onChange={(e) => setCashoutsStatus(e.target.value)}>
                    <option value="">Все</option>
                    <option value="CREATED">Created</option>
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
                        <td><button className="adm-btn adm-btn--sm" onClick={() => setCashoutDetail(c)}>Детали</button></td>
                      </tr>
                    )) : <tr><td colSpan={7} className="adm-empty">Нет запросов</td></tr>}
                  </tbody>
                </table>
              </div>
          </div>
          {cashoutDetail && (
            <div className="adm-overlay" onClick={() => setCashoutDetail(null)}>
              <div className="adm-modal adm-modal--wide" onClick={(e) => e.stopPropagation()}>
                <h2>Вывод #{cashoutDetail.id?.slice(0, 8)}</h2>

                <div className="adm-modal__grid">
                  <div><span className="adm-label">Статус</span><span className={`adm-badge adm-badge--${(cashoutDetail.status ?? "").toLowerCase()}`}>{cashoutDetail.status}</span></div>
                  <div><span className="adm-label">Юзер</span><span style={{ fontWeight: 600 }}>{cashoutDetail.user?.steamLogin ?? "—"}</span> <span style={{ color: "var(--text-muted)", fontSize: 12 }}>({cashoutDetail.user?.steamId ?? "—"})</span></div>
                  <div><span className="adm-label">Сумма</span><span className="adm-bold">{parseFloat(cashoutDetail.amount ?? 0).toFixed(2)}$</span></div>
                  <div><span className="adm-label">Комиссия</span><span className="adm-bold">{parseFloat(cashoutDetail.commission ?? 0).toFixed(2)}$</span></div>
                  <div><span className="adm-label">К выплате</span><span className="adm-bold" style={{ color: "#22c55e" }}>{parseFloat(cashoutDetail.totalAmount ?? 0).toFixed(2)}$</span></div>
                  <div><span className="adm-label">Метод</span><span className="adm-bold">{cashoutDetail.paymentMethod ?? "—"}</span></div>
                  <div><span className="adm-label">Дата</span><span>{cashoutDetail.createdAt ? new Date(cashoutDetail.createdAt).toLocaleString("ru-RU") : "—"}</span></div>
                </div>

                <div style={{ marginTop: 16, padding: 14, background: "rgba(0,0,0,0.02)", borderRadius: 10 }}>
                  <span className="adm-label" style={{ display: "block", marginBottom: 8 }}>Реквизиты</span>
                  {cashoutDetail.paymentDetails && typeof cashoutDetail.paymentDetails === "object" && Object.keys(cashoutDetail.paymentDetails).length > 0 ? (
                    Object.entries(cashoutDetail.paymentDetails as Record<string, string>).map(([key, val]) => (
                      <div key={key} style={{ display: "flex", justifyContent: "space-between", gap: 12, padding: "4px 0", borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
                        <span style={{ opacity: 0.6, textTransform: "capitalize" }}>{key.replace(/([A-Z])/g, " $1").trim()}</span>
                        <span style={{ fontWeight: 600, wordBreak: "break-all", textAlign: "right", maxWidth: "60%" }}>{val || "—"}</span>
                      </div>
                    ))
                  ) : (
                    <span style={{ opacity: 0.5 }}>Реквизиты не указаны</span>
                  )}
                </div>

                <div className="adm-modal__actions" style={{ marginTop: 16 }}>
                  {(cashoutDetail.status === "CREATED" || cashoutDetail.status === "PENDING") && (
                    <>
                      <button className="adm-btn adm-btn--primary adm-btn--sm" onClick={async () => { await handleAction("PATCH", `/api/admin/cashouts/${cashoutDetail.id}`, { status: "APPROVED" }, "Одобрено", () => { fetchCashouts(); }); setCashoutDetail((p: any) => p ? { ...p, status: "APPROVED" } : null); }}>Одобрить</button>
                      <button className="adm-btn adm-btn--danger adm-btn--sm" onClick={async () => { await handleAction("PATCH", `/api/admin/cashouts/${cashoutDetail.id}`, { status: "REJECTED" }, "Отклонено", () => { fetchCashouts(); fetchUsers(); }); setCashoutDetail(null); }}>Отклонить</button>
                    </>
                  )}
                  {cashoutDetail.status === "APPROVED" && (
                    <>
                      <button className="adm-btn adm-btn--primary adm-btn--sm" onClick={async () => { await handleAction("PATCH", `/api/admin/cashouts/${cashoutDetail.id}`, { status: "PAID" }, "Выплачено", () => { fetchCashouts(); }); setCashoutDetail((p: any) => p ? { ...p, status: "PAID" } : null); }}>Выплачено</button>
                      <button className="adm-btn adm-btn--danger adm-btn--sm" onClick={async () => { await handleAction("PATCH", `/api/admin/cashouts/${cashoutDetail.id}`, { status: "REJECTED" }, "Отменено", () => { fetchCashouts(); fetchUsers(); }); setCashoutDetail(null); }}>Отменить</button>
                    </>
                  )}
                  {(cashoutDetail.status === "PAID" || cashoutDetail.status === "REJECTED") && (
                    <span style={{ opacity: 0.5, fontSize: 13 }}>{cashoutDetail.status === "PAID" ? "Выплата завершена" : "Вывод отклонён"}</span>
                  )}
                  <button className="adm-btn adm-btn--ghost adm-btn--sm" onClick={() => setCashoutDetail(null)}>Закрыть</button>
                </div>
              </div>
            </div>
          )}
          </>
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

        {/* ── REVIEWS ── */}
        {section === "reviews" && (
          <div className="adm-section">
            <div className="adm-section__top">
              <h1>Отзывы ({reviewsList.length})</h1>
              <button className="adm-btn adm-btn--primary" onClick={() => { setReviewModal("new"); setReviewForm({ user: "", steam: "", avatar: "", textEn: "", textRu: "", game: "CS2", stars: "5" }); }}>+ Добавить</button>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: 12 }}>
              {reviewsList.map((rv) => (
                <div key={rv.id} className="adm-card" style={{ padding: 14, display: "flex", flexDirection: "column", gap: 8, opacity: rv.isActive ? 1 : 0.5 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    {rv.avatar ? <img src={rv.avatar} alt="" width="36" height="36" style={{ borderRadius: 8, flexShrink: 0 }} /> : <div style={{ width: 36, height: 36, borderRadius: 8, background: "var(--accent-soft)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, fontWeight: 700, color: "var(--accent)" }}>{(rv.user || "?")[0]}</div>}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: 14, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{rv.user}</div>
                      <div style={{ fontSize: 11, color: "var(--muted)", display: "flex", gap: 8, alignItems: "center" }}>
                        <span>{rv.game}</span>
                        <span>{"★".repeat(rv.stars)}{"☆".repeat(5 - rv.stars)}</span>
                        <a href={rv.steam} target="_blank" rel="noopener" style={{ color: "var(--accent)", textDecoration: "none" }}>Steam</a>
                      </div>
                    </div>
                    <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 6, background: rv.isActive ? "rgba(34,197,94,0.15)" : "rgba(239,68,68,0.15)", color: rv.isActive ? "#22c55e" : "#ef4444", fontWeight: 600 }}>{rv.isActive ? "Активен" : "Скрыт"}</span>
                  </div>
                  {rv.textRu && <div style={{ fontSize: 12, color: "var(--text)", lineHeight: 1.4 }}><b>RU:</b> {rv.textRu.length > 100 ? rv.textRu.slice(0, 100) + "…" : rv.textRu}</div>}
                  {rv.textEn && <div style={{ fontSize: 12, color: "var(--muted)", lineHeight: 1.4 }}><b>EN:</b> {rv.textEn.length > 100 ? rv.textEn.slice(0, 100) + "…" : rv.textEn}</div>}
                  {!rv.textRu && !rv.textEn && <div style={{ fontSize: 12, color: "var(--muted)" }}>Нет текста</div>}
                  <div style={{ display: "flex", gap: 6, marginTop: "auto" }}>
                    <button className="adm-btn adm-btn--sm" onClick={() => { setReviewModal(rv); setReviewForm({ user: rv.user, steam: rv.steam, avatar: rv.avatar ?? "", textEn: rv.textEn ?? "", textRu: rv.textRu ?? "", game: rv.game, stars: String(rv.stars) }); }}>Ред.</button>
                    <button className="adm-btn adm-btn--sm" onClick={() => handleAction("PATCH", `/api/admin/reviews/${rv.id}`, { isActive: !rv.isActive }, rv.isActive ? "Скрыт" : "Показан", fetchReviews)}>{rv.isActive ? "Скрыть" : "Показать"}</button>
                    <button className="adm-btn adm-btn--danger adm-btn--sm" onClick={async () => { if (!confirm("Удалить отзыв?")) return; await handleAction("DELETE", `/api/admin/reviews/${rv.id}`, undefined, "Удалён", fetchReviews); }}>Удалить</button>
                  </div>
                </div>
              ))}
              {reviewsList.length === 0 && <div className="adm-card" style={{ padding: 24, textAlign: "center", color: "var(--muted)" }}>Нет отзывов</div>}
            </div>

            {reviewModal && (
              <div className="adm-overlay" onClick={() => setReviewModal(null)}>
                <div className="adm-modal" onClick={(e) => e.stopPropagation()}>
                  <h2>{reviewModal === "new" ? "Новый отзыв" : "Редактировать отзыв"}</h2>
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    <label>Ссылка в Steam
                      <div style={{ display: "flex", gap: 8 }}>
                        <input className="adm-input" placeholder="https://steamcommunity.com/id/..." value={reviewForm.steam} onChange={(e) => setReviewForm((p) => ({ ...p, steam: e.target.value }))} style={{ flex: 1 }} />
                        <button className="adm-btn adm-btn--primary" disabled={reviewFetching || !reviewForm.steam.includes("steamcommunity.com")} onClick={async () => {
                          setReviewFetching(true);
                          try {
                            const r = await fetch(`/api/steam/profile?url=${encodeURIComponent(reviewForm.steam)}`);
                            const d = await r.json();
                            if (d.success && d.data) {
                              setReviewForm((p) => ({ ...p, user: d.data.name || p.user, avatar: d.data.avatarUrl || p.avatar }));
                              addToast("Данные загружены из Steam");
                            } else { addToast("Не удалось загрузить профиль"); }
                          } catch { addToast("Ошибка загрузки"); }
                          setReviewFetching(false);
                        }}>{reviewFetching ? "..." : "Загрузить"}</button>
                      </div>
                    </label>
                    {reviewForm.avatar && <div style={{ display: "flex", alignItems: "center", gap: 10 }}><img src={reviewForm.avatar} alt="" width="40" height="40" style={{ borderRadius: 8 }} /><span style={{ fontSize: 12, color: "var(--muted)" }}>Аватар загружен</span></div>}
                    <label>Имя пользователя<input className="adm-input" value={reviewForm.user} onChange={(e) => setReviewForm((p) => ({ ...p, user: e.target.value }))} /></label>
                    <label>Аватар (URL)<input className="adm-input" placeholder="Авто из Steam или вставьте вручную" value={reviewForm.avatar} onChange={(e) => setReviewForm((p) => ({ ...p, avatar: e.target.value }))} /></label>
                    <label>Текст (RU) <span style={{ fontSize: 10, color: "var(--muted)" }}>— если пусто, отзыв не покажется на RU версии</span><textarea className="adm-input" rows={3} value={reviewForm.textRu} onChange={(e) => setReviewForm((p) => ({ ...p, textRu: e.target.value }))} /></label>
                    <label>Текст (EN) <span style={{ fontSize: 10, color: "var(--muted)" }}>— если пусто, отзыв не покажется на EN версии</span><textarea className="adm-input" rows={3} value={reviewForm.textEn} onChange={(e) => setReviewForm((p) => ({ ...p, textEn: e.target.value }))} /></label>
                    <div style={{ display: "flex", gap: 10 }}>
                      <label style={{ flex: 1 }}>Игра
                        <select className="adm-input" value={reviewForm.game} onChange={(e) => setReviewForm((p) => ({ ...p, game: e.target.value }))}>
                          <option value="CS2">CS2</option><option value="Dota 2">Dota 2</option><option value="TF2">TF2</option><option value="Rust">Rust</option>
                        </select>
                      </label>
                      <label style={{ flex: 1 }}>Звёзды
                        <select className="adm-input" value={reviewForm.stars} onChange={(e) => setReviewForm((p) => ({ ...p, stars: e.target.value }))}>
                          {[5,4,3,2,1].map((n) => <option key={n} value={n}>{n}</option>)}
                        </select>
                      </label>
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
                    <button className="adm-btn adm-btn--primary" onClick={async () => {
                      const payload = { ...reviewForm, stars: Number(reviewForm.stars) };
                      if (reviewModal === "new") {
                        await handleAction("POST", "/api/admin/reviews", payload, "Отзыв добавлен", fetchReviews);
                      } else {
                        await handleAction("PATCH", `/api/admin/reviews/${reviewModal.id}`, payload, "Отзыв обновлён", fetchReviews);
                      }
                      setReviewModal(null);
                    }}>{reviewModal === "new" ? "Добавить" : "Сохранить"}</button>
                    <button className="adm-btn adm-btn--ghost" onClick={() => setReviewModal(null)}>Отмена</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── PROMO CODES ── */}
        {section === "promo" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h2 className="adm-section-title">Промокоды</h2>
              <button className="adm-btn adm-btn--primary" onClick={() => {
                setPromoForm({ code: "", discount: "", usageLimit: "", expiresAt: "" });
                setPromoModal("new");
              }}>+ Добавить</button>
            </div>
            <div className="adm-table-wrap">
              <table className="adm-table">
                <thead>
                  <tr>
                    <th>Код</th>
                    <th>Скидка %</th>
                    <th>Использований</th>
                    <th>Лимит</th>
                    <th>Истекает</th>
                    <th>Статус</th>
                    <th>Действия</th>
                  </tr>
                </thead>
                <tbody>
                  {promoList.map((p: any) => (
                    <tr key={p.id}>
                      <td><code style={{ background: "rgba(99,102,241,0.1)", padding: "2px 8px", borderRadius: 4, fontWeight: 700 }}>{p.code}</code></td>
                      <td style={{ fontWeight: 700, color: "#22c55e" }}>+{Number(p.discount)}%</td>
                      <td>{p.usageCount}</td>
                      <td>{p.usageLimit ?? "∞"}</td>
                      <td>{p.expiresAt ? new Date(p.expiresAt).toLocaleDateString("ru-RU") : "—"}</td>
                      <td>
                        <span style={{
                          padding: "2px 10px", borderRadius: 12, fontSize: 11, fontWeight: 700,
                          background: p.isActive ? "rgba(34,197,94,0.12)" : "rgba(239,68,68,0.12)",
                          color: p.isActive ? "#22c55e" : "#ef4444",
                        }}>{p.isActive ? "Активен" : "Выключен"}</span>
                      </td>
                      <td>
                        <div style={{ display: "flex", gap: 6 }}>
                          <button className="adm-btn adm-btn--sm" onClick={() => {
                            setPromoForm({
                              code: p.code,
                              discount: String(Number(p.discount)),
                              usageLimit: p.usageLimit != null ? String(p.usageLimit) : "",
                              expiresAt: p.expiresAt ? new Date(p.expiresAt).toISOString().slice(0, 10) : "",
                            });
                            setPromoModal(p);
                          }}>Изменить</button>
                          <button className="adm-btn adm-btn--sm" onClick={() => handleAction("POST", "/api/admin/promo", { id: p.id, code: p.code, discount: Number(p.discount), isActive: !p.isActive }, p.isActive ? "Выключен" : "Включён", fetchPromos)}>
                            {p.isActive ? "Выкл" : "Вкл"}
                          </button>
                          <button className="adm-btn adm-btn--danger adm-btn--sm" onClick={async () => {
                            if (!confirm("Удалить промокод?")) return;
                            await handleAction("DELETE", "/api/admin/promo", { id: p.id }, "Удалён", fetchPromos);
                          }}>Удалить</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {promoList.length === 0 && (
                    <tr><td colSpan={7} style={{ textAlign: "center", padding: 24, color: "var(--muted)" }}>Нет промокодов</td></tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Promo modal */}
            {promoModal && (
              <div className="adm-overlay" onClick={() => setPromoModal(null)}>
                <div className="adm-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 440 }}>
                  <h3 className="adm-modal__title">{promoModal === "new" ? "Новый промокод" : "Редактировать промокод"}</h3>
                  <div className="adm-form">
                    <label className="adm-label">Код</label>
                    <input className="adm-input" value={promoForm.code} onChange={(e) => setPromoForm({ ...promoForm, code: e.target.value.toUpperCase() })} placeholder="SUMMER10" />
                    <label className="adm-label" style={{ marginTop: 12 }}>Скидка (%)</label>
                    <input className="adm-input" type="number" min="0.01" max="100" step="0.01" value={promoForm.discount} onChange={(e) => setPromoForm({ ...promoForm, discount: e.target.value })} placeholder="10" />
                    <label className="adm-label" style={{ marginTop: 12 }}>Лимит использований (пусто = безлимит)</label>
                    <input className="adm-input" type="number" min="0" value={promoForm.usageLimit} onChange={(e) => setPromoForm({ ...promoForm, usageLimit: e.target.value })} placeholder="Без лимита" />
                    <label className="adm-label" style={{ marginTop: 12 }}>Дата истечения (пусто = бессрочно)</label>
                    <input className="adm-input" type="date" value={promoForm.expiresAt} onChange={(e) => setPromoForm({ ...promoForm, expiresAt: e.target.value })} />
                  </div>
                  <div style={{ display: "flex", gap: 8, marginTop: 20 }}>
                    <button className="adm-btn adm-btn--primary" disabled={promoSaving} onClick={async () => {
                      setPromoSaving(true);
                      const payload: any = {
                        code: promoForm.code,
                        discount: Number(promoForm.discount),
                        usageLimit: promoForm.usageLimit ? Number(promoForm.usageLimit) : null,
                        expiresAt: promoForm.expiresAt || null,
                      };
                      if (promoModal !== "new") payload.id = promoModal.id;
                      await handleAction("POST", "/api/admin/promo", payload, promoModal === "new" ? "Промокод создан" : "Промокод обновлён", fetchPromos);
                      setPromoSaving(false);
                      setPromoModal(null);
                    }}>{promoSaving ? "..." : promoModal === "new" ? "Создать" : "Сохранить"}</button>
                    <button className="adm-btn adm-btn--ghost" onClick={() => setPromoModal(null)}>Отмена</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

      </main>

      {/* Toasts */}
      <div className="adm-toasts">
        {toasts.map((item) => <Toast key={item.id} item={item} onRemove={removeToast} />)}
      </div>
    </div>
  );
}
