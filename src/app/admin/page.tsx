"use client";

import { useEffect, useState, useCallback, type ReactNode } from "react";
import Link from "next/link";

type Section = "orders" | "users" | "payments" | "prices" | "balances" | "cashouts" | "bots" | "referrals" | "logs" | "social";

function Toast({ message, onDone }: { message: string; onDone: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDone, 3000);
    return () => clearTimeout(t);
  }, [onDone]);
  return (
    <div className="toast toast--success" style={{ animation: "fadeIn .2s" }}>
      {message}
    </div>
  );
}

export default function AdminPage() {
  const [activeSection, setActiveSection] = useState<Section>("orders");
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
  const [authError, setAuthError] = useState<string | null>(null);
  const [adminReady, setAdminReady] = useState(false);

  const SOCIAL_KEYS = [
    { key: "social_discord", label: "Discord", placeholder: "https://discord.gg/your-server" },
    { key: "social_twitter", label: "Twitter / X", placeholder: "https://x.com/your-account" },
    { key: "social_steam_group", label: "Steam Group", placeholder: "https://steamcommunity.com/groups/your-group" },
    { key: "social_telegram", label: "Telegram", placeholder: "https://t.me/your-channel" },
    { key: "social_contact_email", label: "Contact Email", placeholder: "support@skinwave.com" },
  ];
  const [socialLinks, setSocialLinks] = useState<Record<string, string>>({});
  const [socialSaving, setSocialSaving] = useState(false);

  const addToast = useCallback((msg: string) => {
    setToasts((prev) => [...prev, msg]);
  }, []);

  const removeToast = useCallback((idx: number) => {
    setToasts((prev) => prev.filter((_, i) => i !== idx));
  }, []);

  const safeFetch = useCallback(async (url: string): Promise<any> => {
    try {
      const r = await fetch(url);
      const d = await r.json();
      if (!d.success) {
        if (d.error === "Unauthorized" || d.error === "Forbidden") {
          setAuthError(d.error);
        }
        return null;
      }
      return d;
    } catch {
      return null;
    }
  }, []);

  const fetchOrders = useCallback(async () => {
    const d = await safeFetch("/api/admin/orders");
    if (d) setOrders(d.data?.orders ?? []);
  }, [safeFetch]);

  const fetchUsers = useCallback(async () => {
    const d = await safeFetch("/api/admin/users");
    if (d) setUsers(d.data?.users ?? []);
  }, [safeFetch]);

  const fetchCashouts = useCallback(async () => {
    const d = await safeFetch("/api/admin/cashouts");
    if (d) setCashouts(d.data?.cashouts ?? []);
  }, [safeFetch]);

  const fetchAuditLogs = useCallback(async () => {
    const d = await safeFetch("/api/admin/audit");
    if (d) setAuditLogs(d.data?.logs ?? []);
  }, [safeFetch]);

  useEffect(() => {
    const init = async () => {
      const sessionRes = await fetch("/api/auth/session");
      const session = await sessionRes.json();
      if (!session?.user?.isAdmin) {
        setAuthError(`Not admin. Steam ID: ${session?.user?.steamId ?? "not logged in"}. Add this ID to ADMIN_STEAM_IDS env var on Vercel.`);
        setAdminReady(true);
        return;
      }
      setAdminReady(true);
      fetchOrders();
      fetchUsers();
      safeFetch("/api/admin/payments").then((d) => { if (d) setPaymentMethods(d.data ?? []); });
      safeFetch("/api/admin/prices").then((d) => { if (d) setPricingRules(Array.isArray(d.data) ? d.data : []); });
      fetchCashouts();
      safeFetch("/api/admin/bots").then((d) => { if (d) setBots(d.data ?? []); });
      safeFetch("/api/admin/referrals").then((d) => { if (d) setReferrals(d.data ?? []); });
      fetchAuditLogs();
      safeFetch("/api/admin/settings").then((d) => { if (d?.data) setSocialLinks(d.data); });
    };
    init();
  }, [fetchOrders, fetchUsers, fetchCashouts, fetchAuditLogs, safeFetch]);

  const handleAction = async (method: string, url: string, body?: any, successMsg?: string, onSuccess?: () => void) => {
    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: body ? JSON.stringify(body) : undefined,
      });
      const json = await res.json();
      if (json.success) {
        addToast(successMsg ?? "Action completed");
        onSuccess?.();
        return json;
      } else {
        addToast("Error: " + (json.error ?? "Unknown error"));
      }
    } catch {
      addToast("Network error");
    }
    return null;
  };

  const handleSaveSocialLinks = async () => {
    setSocialSaving(true);
    try {
      for (const sk of SOCIAL_KEYS) {
        await fetch("/api/admin/settings", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ key: sk.key, value: socialLinks[sk.key] ?? "" }),
        });
      }
      addToast("Social links saved");
    } catch {
      addToast("Failed to save social links");
    } finally {
      setSocialSaving(false);
    }
  };

  const handleBalanceSubmit = async () => {
    if (!balanceModal) return;
    const amount = parseFloat(balanceAmount);
    if (!amount || amount <= 0) { addToast("Enter a valid amount"); return; }
    await handleAction("POST", "/api/admin/balance", {
      userId: balanceModal.userId,
      type: balanceModal.action,
      amount,
      comment: balanceComment || null,
    }, `Balance ${balanceModal.action === "CREDIT" ? "credited" : "debited"}`, () => {
      fetchUsers();
      setBalanceModal(null);
      setBalanceAmount("");
      setBalanceComment("");
    });
  };

  const navItems: { key: Section; label: string; badge?: string; icon: ReactNode }[] = [
    {
      key: "orders", label: "Orders",
      icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" /><path d="M3 9h18M9 21V9" /></svg>,
    },
    {
      key: "users", label: "Users",
      icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /></svg>,
    },
    {
      key: "payments", label: "Payment Methods",
      icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="1" y="4" width="22" height="16" rx="2" /><line x1="1" y1="10" x2="23" y2="10" /></svg>,
    },
    {
      key: "prices", label: "Prices",
      icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg>,
    },
    {
      key: "balances", label: "Balances",
      icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2" /><path d="M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4" /></svg>,
    },
    {
      key: "cashouts", label: "Cashout Requests",
      icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12l7 7 7-7" /></svg>,
    },
    {
      key: "bots", label: "Steam Bots",
      icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="10" rx="2" /><circle cx="12" cy="5" r="2" /><path d="M12 7v4" /><line x1="8" y1="16" x2="8" y2="16" /><line x1="16" y1="16" x2="16" y2="16" /></svg>,
    },
    {
      key: "referrals", label: "Referrals",
      icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="8.5" cy="7" r="4" /><path d="M20 8v6M23 11h-6" /></svg>,
    },
    {
      key: "logs", label: "Audit Log",
      icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /></svg>,
    },
    {
      key: "social", label: "Social Links",
      icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" /><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" /></svg>,
    },
  ];

  const filteredBalanceUsers = users.filter((u) => {
    if (!balancesSearch) return true;
    const q = balancesSearch.toLowerCase();
    return (u.steamId ?? "").toLowerCase().includes(q) || (u.steamLogin ?? "").toLowerCase().includes(q);
  });

  return (
    <>
      <header className="header admin-header">
        <div className="header__inner">
          <div className="header__left">
            <Link href="/admin" className="header__logo">
              <span className="header__logo-text">SKINWAVE <span className="admin-badge">Admin</span></span>
            </Link>
          </div>
          <div className="header__right">
            <div className="header__user">
              <span className="admin-header__name">Administrator</span>
              <div className="header__avatar"><span>A</span></div>
            </div>
          </div>
        </div>
      </header>

      {authError && (
        <div style={{ background: "#ef4444", color: "#fff", padding: "12px 24px", fontSize: 14, fontWeight: 600, textAlign: "center" }}>
          Admin access denied: {authError}
        </div>
      )}

      {!adminReady && (
        <div style={{ textAlign: "center", padding: "100px 24px", color: "#94a3b8", fontSize: 16 }}>Loading admin panel...</div>
      )}

      <div className="admin-layout" style={!adminReady || authError ? { display: "none" } : undefined}>
        <aside className="admin-sidebar" id="adminSidebar">
          <nav className="admin-nav">
            {navItems.map((item) => (
              <a
                href="#"
                key={item.key}
                className={`admin-nav__item${activeSection === item.key ? " active" : ""}`}
                data-section={item.key}
                onClick={(e) => { e.preventDefault(); setActiveSection(item.key); }}
              >
                {item.icon}
                {item.label}
                {item.badge && <span className="admin-nav__badge">{item.badge}</span>}
              </a>
            ))}
          </nav>
        </aside>

        <main className="admin-main">

          {/* ORDERS */}
          <section className="admin-section" id="sec-orders" style={{ display: activeSection === "orders" ? undefined : "none" }}>
            <div className="admin-section__header">
              <h2>Orders</h2>
              <div className="admin-section__actions">
                <input type="text" className="input" placeholder="Search by ID, Steam ID..." style={{ width: 280 }} value={ordersSearch} onChange={(e) => setOrdersSearch(e.target.value)} />
                <select className="input select" style={{ width: 160 }} value={ordersStatus} onChange={(e) => setOrdersStatus(e.target.value)}>
                  <option value="">All Statuses</option>
                  <option value="CREATED">Created</option>
                  <option value="TRADE_SENT">Trade Sent</option>
                  <option value="TRADE_COMPLETED">Trade Completed</option>
                  <option value="TRADE_CANCELLED">Cancelled</option>
                  <option value="PAYMENT_PENDING">Payment Pending</option>
                  <option value="PAID">Paid</option>
                </select>
                <button className="btn btn--secondary btn--sm" onClick={fetchOrders}>Refresh</button>
              </div>
            </div>
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr><th>Order ID</th><th>User</th><th>Items</th><th>Amount</th><th>Method</th><th>Bot</th><th>Status</th><th>Created</th><th>Actions</th></tr>
                </thead>
                <tbody>
                  {orders.length > 0 ? orders.map((o: any) => (
                    <tr key={o.id}>
                      <td><strong>#{o.orderNumber ?? o.id?.slice(0, 8)}</strong></td>
                      <td>{o.user?.steamLogin ?? o.user?.steamId ?? "—"}</td>
                      <td>{o.items?.length ?? 0}</td>
                      <td>{parseFloat(o.totalAmount ?? 0).toFixed(2)}$</td>
                      <td>{o.paymentMethod?.name ?? o.paymentMethodId ?? "—"}</td>
                      <td>{o.botAccount?.name ?? "—"}</td>
                      <td><span className={`status-badge status-badge--${(o.status ?? "CREATED").toLowerCase().replace(/_/g, "-")}`}>{o.status}</span></td>
                      <td>{o.createdAt ? new Date(o.createdAt).toLocaleDateString() : "—"}</td>
                      <td>
                        <button className="btn btn--ghost btn--sm" onClick={() => setOrderDetail(o)}>View</button>
                      </td>
                    </tr>
                  )) : (
                    <tr><td colSpan={9} style={{ textAlign: "center", padding: 40, color: "#94a3b8" }}>No orders found</td></tr>
                  )}
                </tbody>
              </table>
            </div>

            {orderDetail && (
              <div style={{ position: "fixed", inset: 0, zIndex: 10000, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center" }} onClick={() => setOrderDetail(null)}>
                <div className="card" style={{ maxWidth: 600, width: "90%", maxHeight: "80vh", overflow: "auto", padding: 24 }} onClick={(e) => e.stopPropagation()}>
                  <h3>Order #{orderDetail.orderNumber ?? orderDetail.id?.slice(0, 8)}</h3>
                  <div style={{ display: "grid", gap: 8, marginTop: 16, fontSize: 14 }}>
                    <div><strong>Status:</strong> {orderDetail.status}</div>
                    <div><strong>User:</strong> {orderDetail.user?.steamLogin} ({orderDetail.user?.steamId})</div>
                    <div><strong>Amount:</strong> {parseFloat(orderDetail.totalAmount ?? 0).toFixed(2)}$</div>
                    <div><strong>Method:</strong> {orderDetail.paymentMethod?.name ?? orderDetail.paymentMethodId}</div>
                    <div><strong>Bot:</strong> {orderDetail.botAccount?.name ?? "Not assigned"}</div>
                    <div><strong>Items:</strong> {orderDetail.items?.length ?? 0}</div>
                    {orderDetail.items?.map((it: any, idx: number) => (
                      <div key={idx} style={{ paddingLeft: 16 }}>• {it.name} — {parseFloat(it.price ?? 0).toFixed(2)}$</div>
                    ))}
                    <div><strong>Created:</strong> {new Date(orderDetail.createdAt).toLocaleString()}</div>
                    {orderDetail.tradeOfferId && <div><strong>Trade Offer:</strong> {orderDetail.tradeOfferId}</div>}
                  </div>
                  <div style={{ marginTop: 20, display: "flex", gap: 8, flexWrap: "wrap" }}>
                    {orderDetail.status === "CREATED" && (
                      <button className="btn btn--primary btn--sm" onClick={() => handleAction("PATCH", `/api/admin/orders/${orderDetail.id}`, { status: "TRADE_SENT" }, "Status → TRADE_SENT", () => { fetchOrders(); setOrderDetail(null); })}>Mark Trade Sent</button>
                    )}
                    {orderDetail.status === "TRADE_SENT" && (
                      <button className="btn btn--primary btn--sm" onClick={() => handleAction("PATCH", `/api/admin/orders/${orderDetail.id}`, { status: "TRADE_COMPLETED" }, "Status → TRADE_COMPLETED", () => { fetchOrders(); setOrderDetail(null); })}>Mark Completed</button>
                    )}
                    {(orderDetail.status === "TRADE_COMPLETED" || orderDetail.status === "PAYMENT_PENDING") && (
                      <button className="btn btn--primary btn--sm" onClick={() => handleAction("PATCH", `/api/admin/orders/${orderDetail.id}`, { status: "PAID" }, "Status → PAID", () => { fetchOrders(); setOrderDetail(null); })}>Mark Paid</button>
                    )}
                    {orderDetail.status !== "TRADE_CANCELLED" && orderDetail.status !== "PAID" && (
                      <button className="btn btn--ghost btn--sm" style={{ color: "var(--danger)" }} onClick={() => handleAction("PATCH", `/api/admin/orders/${orderDetail.id}`, { status: "TRADE_CANCELLED" }, "Order cancelled", () => { fetchOrders(); setOrderDetail(null); })}>Cancel</button>
                    )}
                    <button className="btn btn--ghost btn--sm" onClick={() => setOrderDetail(null)}>Close</button>
                  </div>
                </div>
              </div>
            )}
          </section>

          {/* USERS */}
          <section className="admin-section" id="sec-users" style={{ display: activeSection === "users" ? undefined : "none" }}>
            <div className="admin-section__header">
              <h2>Users</h2>
              <div className="admin-section__actions">
                <input type="text" className="input" placeholder="Search by Steam ID, username..." style={{ width: 300 }} value={usersSearch} onChange={(e) => setUsersSearch(e.target.value)} />
                <button className="btn btn--secondary btn--sm" onClick={fetchUsers}>Refresh</button>
              </div>
            </div>
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr><th>User</th><th>Steam ID</th><th>Balance</th><th>Joined</th><th>Status</th><th>Actions</th></tr>
                </thead>
                <tbody>
                  {users.length > 0 ? users.map((u: any) => (
                    <tr key={u.id}>
                      <td>
                        <div className="ref-user">
                          {u.steamAvatar ? <img src={u.steamAvatar} alt="" style={{ width: 28, height: 28, borderRadius: 6 }} /> : <div className="ref-user__avatar"><span>{(u.steamLogin ?? "U")[0].toUpperCase()}</span></div>}
                          <span>{u.steamLogin ?? "—"}</span>
                        </div>
                      </td>
                      <td style={{ fontSize: 12, fontFamily: "monospace" }}>{u.steamId ?? "—"}</td>
                      <td>{parseFloat(u.balance ?? 0).toFixed(2)}$</td>
                      <td>{u.createdAt ? new Date(u.createdAt).toLocaleDateString() : "—"}</td>
                      <td><span className={`badge badge--${u.status === "BLOCKED" ? "warning" : "success"}`}>{u.status ?? "ACTIVE"}</span></td>
                      <td>
                        {u.status !== "BLOCKED" ? (
                          <button className="btn btn--ghost btn--sm" style={{ color: "var(--danger)" }} onClick={() => handleAction("PATCH", `/api/admin/users/${u.id}`, { status: "BLOCKED" }, "User blocked", fetchUsers)}>Block</button>
                        ) : (
                          <button className="btn btn--ghost btn--sm" style={{ color: "var(--success)" }} onClick={() => handleAction("PATCH", `/api/admin/users/${u.id}`, { status: "ACTIVE" }, "User unblocked", fetchUsers)}>Unblock</button>
                        )}
                      </td>
                    </tr>
                  )) : (
                    <tr><td colSpan={6} style={{ textAlign: "center", padding: 40, color: "#94a3b8" }}>No users found</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>

          {/* PAYMENT METHODS */}
          <section className="admin-section" id="sec-payments" style={{ display: activeSection === "payments" ? undefined : "none" }}>
            <div className="admin-section__header">
              <h2>Payment Methods</h2>
            </div>
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr><th>Method</th><th>Type</th><th>Commission</th><th>Min Amount</th><th>Status</th><th>Actions</th></tr>
                </thead>
                <tbody>
                  {paymentMethods.length > 0 ? paymentMethods.map((pm: any, i: number) => (
                    <tr key={pm.id ?? i}>
                      <td><strong>{pm.name ?? "—"}</strong></td>
                      <td>{pm.type ?? "—"}</td>
                      <td>{pm.commission != null ? `${pm.commission}%` : "—"}</td>
                      <td>{pm.minAmount != null ? `${pm.minAmount}$` : "—"}</td>
                      <td><span className={`badge badge--${pm.active !== false ? "success" : "warning"}`}>{pm.active !== false ? "Active" : "Inactive"}</span></td>
                      <td>
                        <button className="btn btn--ghost btn--sm" onClick={() => handleAction("PATCH", `/api/admin/payments/${pm.id}`, { active: !pm.active }, pm.active ? "Deactivated" : "Activated")}>{pm.active ? "Deactivate" : "Activate"}</button>
                      </td>
                    </tr>
                  )) : (
                    <tr><td colSpan={6} style={{ textAlign: "center", padding: 40, color: "#94a3b8" }}>No payment methods found</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>

          {/* PRICES */}
          <section className="admin-section" id="sec-prices" style={{ display: activeSection === "prices" ? undefined : "none" }}>
            <div className="admin-section__header">
              <h2>Pricing Rules</h2>
            </div>
            <div className="admin-card-grid">
              <div className="card">
                <h3>Price Source</h3>
                <p className="admin-hint">Base prices from TM Market API, rules applied on top</p>
                <span className="badge badge--success">Connected</span>
              </div>
              <div className="card">
                <h3>Active Rules</h3>
                <p className="admin-hint">Total pricing rules configured</p>
                <strong style={{ fontSize: 24 }}>{pricingRules.length}</strong>
              </div>
            </div>
            <div className="card" style={{ marginTop: 16 }}>
              <h3>Pricing Rules</h3>
              <p className="admin-hint" style={{ marginBottom: 16 }}>Rules that modify base market prices. Create via API: POST /api/admin/prices</p>
              <div className="admin-table-wrap">
                <table className="admin-table">
                  <thead>
                    <tr><th>Game</th><th>Item</th><th>Adjustment</th><th>Value</th><th>Excluded</th><th>Updated</th></tr>
                  </thead>
                  <tbody>
                    {pricingRules.length > 0 ? pricingRules.map((r: any) => (
                      <tr key={r.id}>
                        <td>{r.game ?? "All"}</td>
                        <td>{r.itemExternalId ?? "Global"}</td>
                        <td>{r.adjustmentType}</td>
                        <td>{r.adjustmentValue}</td>
                        <td>{r.isExcluded ? "Yes" : "No"}</td>
                        <td>{r.updatedAt ? new Date(r.updatedAt).toLocaleDateString() : "—"}</td>
                      </tr>
                    )) : (
                      <tr><td colSpan={6} style={{ textAlign: "center", padding: 40, color: "#94a3b8" }}>No pricing rules configured</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </section>

          {/* BALANCES (uses users data + POST /api/admin/balance) */}
          <section className="admin-section" id="sec-balances" style={{ display: activeSection === "balances" ? undefined : "none" }}>
            <div className="admin-section__header">
              <h2>User Balances</h2>
              <input type="text" className="input" placeholder="Search user..." style={{ width: 260 }} value={balancesSearch} onChange={(e) => setBalancesSearch(e.target.value)} />
            </div>
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr><th>User</th><th>Steam ID</th><th>Balance</th><th>Joined</th><th>Actions</th></tr>
                </thead>
                <tbody>
                  {filteredBalanceUsers.length > 0 ? filteredBalanceUsers.map((u: any) => (
                    <tr key={u.id}>
                      <td><strong>{u.steamLogin ?? "—"}</strong></td>
                      <td style={{ fontSize: 12, fontFamily: "monospace" }}>{u.steamId ?? "—"}</td>
                      <td><strong>{parseFloat(u.balance ?? 0).toFixed(2)}$</strong></td>
                      <td>{u.createdAt ? new Date(u.createdAt).toLocaleDateString() : "—"}</td>
                      <td>
                        <button className="btn btn--ghost btn--sm" style={{ color: "var(--success)" }} onClick={() => setBalanceModal({ userId: u.id, username: u.steamLogin ?? u.steamId, action: "CREDIT" })}>Credit</button>
                        <button className="btn btn--ghost btn--sm" style={{ color: "var(--danger)" }} onClick={() => setBalanceModal({ userId: u.id, username: u.steamLogin ?? u.steamId, action: "DEBIT" })}>Debit</button>
                      </td>
                    </tr>
                  )) : (
                    <tr><td colSpan={5} style={{ textAlign: "center", padding: 40, color: "#94a3b8" }}>No users found</td></tr>
                  )}
                </tbody>
              </table>
            </div>

            {balanceModal && (
              <div style={{ position: "fixed", inset: 0, zIndex: 10000, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center" }} onClick={() => setBalanceModal(null)}>
                <div className="card" style={{ maxWidth: 400, width: "90%", padding: 24 }} onClick={(e) => e.stopPropagation()}>
                  <h3>{balanceModal.action === "CREDIT" ? "Credit" : "Debit"} Balance — {balanceModal.username}</h3>
                  <div style={{ display: "grid", gap: 12, marginTop: 16 }}>
                    <div>
                      <label style={{ fontWeight: 600, fontSize: 14 }}>Amount ($)</label>
                      <input type="number" className="input" placeholder="0.00" min={0} step={0.01} value={balanceAmount} onChange={(e) => setBalanceAmount(e.target.value)} style={{ width: "100%", marginTop: 4 }} />
                    </div>
                    <div>
                      <label style={{ fontWeight: 600, fontSize: 14 }}>Comment (optional)</label>
                      <input type="text" className="input" placeholder="Reason..." value={balanceComment} onChange={(e) => setBalanceComment(e.target.value)} style={{ width: "100%", marginTop: 4 }} />
                    </div>
                  </div>
                  <div style={{ marginTop: 20, display: "flex", gap: 8 }}>
                    <button className="btn btn--primary btn--sm" onClick={handleBalanceSubmit}>Confirm</button>
                    <button className="btn btn--ghost btn--sm" onClick={() => setBalanceModal(null)}>Cancel</button>
                  </div>
                </div>
              </div>
            )}
          </section>

          {/* CASHOUT REQUESTS */}
          <section className="admin-section" id="sec-cashouts" style={{ display: activeSection === "cashouts" ? undefined : "none" }}>
            <div className="admin-section__header">
              <h2>Cashout Requests</h2>
              <div className="admin-section__actions">
                <select className="input select" style={{ width: 160 }} value={cashoutsStatus} onChange={(e) => setCashoutsStatus(e.target.value)}>
                  <option value="">All Statuses</option>
                  <option value="PENDING">Pending</option>
                  <option value="APPROVED">Approved</option>
                  <option value="REJECTED">Rejected</option>
                  <option value="PAID">Paid</option>
                </select>
                <button className="btn btn--secondary btn--sm" onClick={fetchCashouts}>Refresh</button>
              </div>
            </div>
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr><th>ID</th><th>User</th><th>Amount</th><th>Method</th><th>Status</th><th>Created</th><th>Actions</th></tr>
                </thead>
                <tbody>
                  {cashouts.length > 0 ? cashouts.map((c: any) => (
                    <tr key={c.id}>
                      <td>#{c.id?.slice(0, 8)}</td>
                      <td>{c.user?.steamLogin ?? c.user?.steamId ?? "—"}</td>
                      <td>{parseFloat(c.amount ?? 0).toFixed(2)}$</td>
                      <td>{c.paymentMethod ?? "—"}</td>
                      <td><span className={`status-badge status-badge--${(c.status ?? "PENDING").toLowerCase()}`}>{c.status}</span></td>
                      <td>{c.createdAt ? new Date(c.createdAt).toLocaleDateString() : "—"}</td>
                      <td>
                        {c.status === "PENDING" && (
                          <>
                            <button className="btn btn--ghost btn--sm" style={{ color: "var(--success)" }} onClick={() => handleAction("PATCH", `/api/admin/cashouts/${c.id}`, { status: "APPROVED" }, "Cashout approved", fetchCashouts)}>Approve</button>
                            <button className="btn btn--ghost btn--sm" style={{ color: "var(--danger)" }} onClick={() => handleAction("PATCH", `/api/admin/cashouts/${c.id}`, { status: "REJECTED" }, "Cashout rejected", () => { fetchCashouts(); fetchUsers(); })}>Reject</button>
                          </>
                        )}
                        {c.status === "APPROVED" && (
                          <button className="btn btn--ghost btn--sm" style={{ color: "var(--success)" }} onClick={() => handleAction("PATCH", `/api/admin/cashouts/${c.id}`, { status: "PAID" }, "Cashout paid", fetchCashouts)}>Mark Paid</button>
                        )}
                      </td>
                    </tr>
                  )) : (
                    <tr><td colSpan={7} style={{ textAlign: "center", padding: 40, color: "#94a3b8" }}>No cashout requests</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>

          {/* STEAM BOTS */}
          <section className="admin-section" id="sec-bots" style={{ display: activeSection === "bots" ? undefined : "none" }}>
            <div className="admin-section__header">
              <h2>Steam Bots</h2>
            </div>
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr><th>Bot</th><th>Steam ID</th><th>Profile</th><th>Status</th><th>Actions</th></tr>
                </thead>
                <tbody>
                  {bots.length > 0 ? bots.map((b: any, i: number) => (
                    <tr key={b.id ?? i}>
                      <td><strong>{b.name ?? `Bot #${i + 1}`}</strong></td>
                      <td style={{ fontSize: 12, fontFamily: "monospace" }}>{b.steamId ?? "—"}</td>
                      <td>{b.steamProfileUrl ? <a href={b.steamProfileUrl} className="link" target="_blank" rel="noopener noreferrer">Profile</a> : "—"}</td>
                      <td><span className={`badge badge--${b.active !== false ? "success" : "warning"}`}>{b.active !== false ? "Active" : "Inactive"}</span></td>
                      <td>
                        <button className="btn btn--ghost btn--sm" onClick={() => handleAction("PATCH", `/api/admin/bots/${b.id}`, { active: !b.active }, b.active ? "Bot deactivated" : "Bot activated")}>{b.active ? "Deactivate" : "Activate"}</button>
                      </td>
                    </tr>
                  )) : (
                    <tr><td colSpan={5} style={{ textAlign: "center", padding: 40, color: "#94a3b8" }}>No bots configured</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>

          {/* REFERRALS */}
          <section className="admin-section" id="sec-referrals" style={{ display: activeSection === "referrals" ? undefined : "none" }}>
            <div className="admin-section__header">
              <h2>Referral Partners</h2>
            </div>
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr><th>Partner</th><th>Code</th><th>Referred Users</th><th>Active</th><th>Created</th></tr>
                </thead>
                <tbody>
                  {referrals.length > 0 ? referrals.map((r: any) => (
                    <tr key={r.id}>
                      <td><strong>{r.name ?? "—"}</strong></td>
                      <td style={{ fontFamily: "monospace" }}>{r.code ?? "—"}</td>
                      <td>{r.userCount ?? 0}</td>
                      <td><span className={`badge badge--${r.active !== false ? "success" : "warning"}`}>{r.active !== false ? "Active" : "Inactive"}</span></td>
                      <td>{r.createdAt ? new Date(r.createdAt).toLocaleDateString() : "—"}</td>
                    </tr>
                  )) : (
                    <tr><td colSpan={5} style={{ textAlign: "center", padding: 40, color: "#94a3b8" }}>No referrals</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>

          {/* AUDIT LOG */}
          <section className="admin-section" id="sec-logs" style={{ display: activeSection === "logs" ? undefined : "none" }}>
            <div className="admin-section__header">
              <h2>Audit Log</h2>
              <div className="admin-section__actions">
                <input type="text" className="input" placeholder="Search logs..." style={{ width: 260 }} value={logsSearch} onChange={(e) => setLogsSearch(e.target.value)} />
                <button className="btn btn--secondary btn--sm" onClick={fetchAuditLogs}>Refresh</button>
              </div>
            </div>
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr><th>Timestamp</th><th>Actor</th><th>Action</th><th>Entity</th><th>Details</th></tr>
                </thead>
                <tbody>
                  {auditLogs.length > 0 ? auditLogs.map((l: any) => (
                    <tr key={l.id}>
                      <td>{l.createdAt ? new Date(l.createdAt).toLocaleString() : "—"}</td>
                      <td>{l.actorId ?? "system"}</td>
                      <td>{l.action ?? "—"}</td>
                      <td>{l.entityType}{l.entityId ? ` #${l.entityId.slice(0, 8)}` : ""}</td>
                      <td style={{ maxWidth: 300, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{typeof l.details === "object" ? JSON.stringify(l.details) : (l.details ?? "—")}</td>
                    </tr>
                  )) : (
                    <tr><td colSpan={5} style={{ textAlign: "center", padding: 40, color: "#94a3b8" }}>No audit logs</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>

          {/* SOCIAL LINKS */}
          <section className="admin-section" id="sec-social" style={{ display: activeSection === "social" ? undefined : "none" }}>
            <div className="admin-section__header">
              <h2>Social Links</h2>
              <p style={{ color: "var(--text-muted)", fontSize: 14 }}>Configure links for footer, FAQ page, and contact buttons across the site</p>
            </div>
            <div className="card" style={{ padding: 24 }}>
              <div style={{ display: "grid", gap: 20 }}>
                {SOCIAL_KEYS.map((sk) => (
                  <div key={sk.key} style={{ display: "grid", gap: 6 }}>
                    <label style={{ fontWeight: 600, fontSize: 14, color: "var(--text-heading)" }}>{sk.label}</label>
                    <input
                      type="text"
                      className="input"
                      placeholder={sk.placeholder}
                      value={socialLinks[sk.key] ?? ""}
                      onChange={(e) => setSocialLinks((prev) => ({ ...prev, [sk.key]: e.target.value }))}
                      style={{ width: "100%", maxWidth: 500 }}
                    />
                  </div>
                ))}
              </div>
              <div style={{ marginTop: 24, display: "flex", gap: 12 }}>
                <button className="btn btn--primary" onClick={handleSaveSocialLinks} disabled={socialSaving}>
                  {socialSaving ? "Saving..." : "Save Social Links"}
                </button>
              </div>
            </div>
          </section>

        </main>
      </div>

      <div className="toast-container" id="toastContainer">
        {toasts.map((msg, i) => (
          <Toast key={`${msg}-${i}`} message={msg} onDone={() => removeToast(i)} />
        ))}
      </div>
    </>
  );
}
