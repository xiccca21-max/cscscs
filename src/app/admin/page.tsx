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
  const [prices, setPrices] = useState<any>(null);
  const [balances, setBalances] = useState<any[]>([]);
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

  useEffect(() => {
    fetch("/api/admin/orders").then((r) => r.json()).then((d) => { if (d.success) setOrders(d.data ?? d.orders ?? []); });
    fetch("/api/admin/users").then((r) => r.json()).then((d) => { if (d.success) setUsers(d.data ?? d.users ?? []); });
    fetch("/api/admin/payments").then((r) => r.json()).then((d) => { if (d.success) setPaymentMethods(d.data ?? d.methods ?? []); });
    fetch("/api/admin/prices").then((r) => r.json()).then((d) => { if (d.success) setPrices(d.data ?? d); });
    fetch("/api/admin/balance").then((r) => r.json()).then((d) => { if (d.success) setBalances(d.data ?? d.balances ?? []); });
    fetch("/api/admin/cashouts").then((r) => r.json()).then((d) => { if (d.success) setCashouts(d.data ?? d.cashouts ?? []); });
    fetch("/api/admin/bots").then((r) => r.json()).then((d) => { if (d.success) setBots(d.data ?? d.bots ?? []); });
    fetch("/api/admin/referrals").then((r) => r.json()).then((d) => { if (d.success) setReferrals(d.data ?? d.referrals ?? []); });
    fetch("/api/admin/audit").then((r) => r.json()).then((d) => { if (d.success) setAuditLogs(d.data ?? d.logs ?? []); });
    fetch("/api/admin/settings").then((r) => r.json()).then((d) => { if (d.success && d.data) setSocialLinks(d.data); });
  }, []);

  const handleAction = async (method: string, url: string, body?: any, successMsg?: string) => {
    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: body ? JSON.stringify(body) : undefined,
      });
      const json = await res.json();
      if (json.success) {
        addToast(successMsg ?? "Action completed");
      } else {
        addToast("Error: " + (json.error ?? "Unknown error"));
      }
    } catch {
      addToast("Network error");
    }
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

  const navItems: { key: Section; label: string; badge?: string; icon: ReactNode }[] = [
    {
      key: "orders", label: "Orders", badge: "12",
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
      key: "cashouts", label: "Cashout Requests", badge: "3",
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

  return (
    <>
      {/* Admin Header */}
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

      {/* Admin Layout */}
      <div className="admin-layout">
        {/* Sidebar */}
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

        {/* Main content */}
        <main className="admin-main">

          {/* ORDERS */}
          <section className="admin-section" id="sec-orders" style={{ display: activeSection === "orders" ? undefined : "none" }}>
            <div className="admin-section__header">
              <h2>Orders</h2>
              <div className="admin-section__actions">
                <input type="text" className="input" placeholder="Search by ID, Steam ID..." style={{ width: 280 }} value={ordersSearch} onChange={(e) => setOrdersSearch(e.target.value)} />
                <select className="input select" style={{ width: 160 }} value={ordersStatus} onChange={(e) => setOrdersStatus(e.target.value)}>
                  <option value="">All Statuses</option>
                  <option>Created</option>
                  <option>Trade Sent</option>
                  <option>Trade Completed</option>
                  <option>Cancelled</option>
                  <option>Payment Pending</option>
                  <option>Paid</option>
                </select>
              </div>
            </div>
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Order ID</th>
                    <th>User</th>
                    <th>Items</th>
                    <th>Amount</th>
                    <th>Method</th>
                    <th>Bot</th>
                    <th>Status</th>
                    <th>Created</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.length > 0 ? orders.map((o: any, i: number) => (
                    <tr key={o.id ?? i}>
                      <td><strong>#{o.id ?? o.orderId ?? `SW-${i}`}</strong></td>
                      <td><a href="#" className="link">{o.user ?? o.steamLogin ?? "—"}</a></td>
                      <td>{o.itemsCount ?? o.items ?? "—"}</td>
                      <td>{o.amount ?? "—"}</td>
                      <td>{o.method ?? o.payoutMethod ?? "—"}</td>
                      <td>{o.bot ?? "—"}</td>
                      <td><span className={`status-badge status-badge--${(o.status ?? "created").toLowerCase().replace(/\s+/g, "-")}`}>{o.status ?? "Created"}</span></td>
                      <td>{o.createdAt ? new Date(o.createdAt).toLocaleDateString() : "—"}</td>
                      <td><button className="btn btn--ghost btn--sm" onClick={() => handleAction("GET", `/api/admin/orders/${o.id}`, undefined, "Order details loaded")}>View</button></td>
                    </tr>
                  )) : (
                    <tr>
                      <td><strong>#SW-2847</strong></td>
                      <td><a href="#" className="link">user123</a></td>
                      <td>3</td>
                      <td>160.40$</td>
                      <td>Crypto</td>
                      <td>—</td>
                      <td><span className="status-badge status-badge--created">Created</span></td>
                      <td>Mar 24, 14:35</td>
                      <td><button className="btn btn--ghost btn--sm">View</button></td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>

          {/* USERS */}
          <section className="admin-section" id="sec-users" style={{ display: activeSection === "users" ? undefined : "none" }}>
            <div className="admin-section__header">
              <h2>Users</h2>
              <div className="admin-section__actions">
                <input type="text" className="input" placeholder="Search by Steam ID, username..." style={{ width: 300 }} value={usersSearch} onChange={(e) => setUsersSearch(e.target.value)} />
              </div>
            </div>
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Steam ID</th>
                    <th>Orders</th>
                    <th>Balance</th>
                    <th>Referral</th>
                    <th>Joined</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.length > 0 ? users.map((u: any, i: number) => (
                    <tr key={u.id ?? i}>
                      <td>
                        <div className="ref-user">
                          <div className="ref-user__avatar"><span>{(u.username ?? u.steamLogin ?? "U")[0].toUpperCase()}</span></div>
                          <span>{u.username ?? u.steamLogin ?? "—"}</span>
                        </div>
                      </td>
                      <td>{u.steamId ?? "—"}</td>
                      <td>{u.ordersCount ?? 0}</td>
                      <td>{u.balance ?? "0.00"}$</td>
                      <td>{u.referralCode ?? "—"}</td>
                      <td>{u.createdAt ? new Date(u.createdAt).toLocaleDateString() : "—"}</td>
                      <td><span className="badge badge--success">{u.status ?? "Active"}</span></td>
                      <td>
                        <button className="btn btn--ghost btn--sm" onClick={() => handleAction("PATCH", `/api/admin/users/${u.id}`, {}, "User updated")}>Edit</button>
                        <button className="btn btn--ghost btn--sm" style={{ color: "var(--danger)" }} onClick={() => handleAction("PATCH", `/api/admin/users/${u.id}`, { blocked: true }, "User blocked")}>Block</button>
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td><div className="ref-user"><div className="ref-user__avatar"><span>U</span></div><span>user123</span></div></td>
                      <td>76561198012345</td>
                      <td>14</td>
                      <td>245.50$</td>
                      <td>PARTNER123</td>
                      <td>Mar 10, 2026</td>
                      <td><span className="badge badge--success">Active</span></td>
                      <td>
                        <button className="btn btn--ghost btn--sm">Edit</button>
                        <button className="btn btn--ghost btn--sm" style={{ color: "var(--danger)" }}>Block</button>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>

          {/* PAYMENT METHODS */}
          <section className="admin-section" id="sec-payments" style={{ display: activeSection === "payments" ? undefined : "none" }}>
            <div className="admin-section__header">
              <h2>Payment Methods</h2>
              <button className="btn btn--primary btn--sm" onClick={() => handleAction("POST", "/api/admin/payments", {}, "Payment method added")}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
                Add Method
              </button>
            </div>
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Method</th>
                    <th>Type</th>
                    <th>Commission</th>
                    <th>Min Amount</th>
                    <th>Currencies</th>
                    <th>Status</th>
                    <th>Order</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paymentMethods.length > 0 ? paymentMethods.map((pm: any, i: number) => (
                    <tr key={pm.id ?? i}>
                      <td><strong>{pm.name ?? pm.method ?? "—"}</strong></td>
                      <td>{pm.type ?? "—"}</td>
                      <td>{pm.commission ?? "—"}</td>
                      <td>{pm.minAmount ?? "—"}</td>
                      <td>{pm.currencies ?? "—"}</td>
                      <td><span className={`badge badge--${pm.active !== false ? "success" : "warning"}`}>{pm.active !== false ? "Active" : "Inactive"}</span></td>
                      <td>{pm.order ?? pm.sortOrder ?? i + 1}</td>
                      <td><button className="btn btn--ghost btn--sm" onClick={() => handleAction("PATCH", `/api/admin/payments/${pm.id}`, {}, "Payment method updated")}>Edit</button></td>
                    </tr>
                  )) : (
                    <>
                      <tr><td><strong>Visa / Mastercard</strong></td><td>Card</td><td>2.5%</td><td>10.00$</td><td>USD, EUR, RUB</td><td><span className="badge badge--success">Active</span></td><td>1</td><td><button className="btn btn--ghost btn--sm">Edit</button></td></tr>
                      <tr><td><strong>Bitcoin (BTC)</strong></td><td>Crypto</td><td>1.0%</td><td>20.00$</td><td>USD</td><td><span className="badge badge--success">Active</span></td><td>2</td><td><button className="btn btn--ghost btn--sm">Edit</button></td></tr>
                      <tr><td><strong>USDT (TRC-20)</strong></td><td>Crypto</td><td>0.5%</td><td>15.00$</td><td>USD</td><td><span className="badge badge--success">Active</span></td><td>3</td><td><button className="btn btn--ghost btn--sm">Edit</button></td></tr>
                      <tr><td><strong>Bank Transfer</strong></td><td>Bank</td><td>3.0%</td><td>50.00$</td><td>USD, EUR</td><td><span className="badge badge--warning">Inactive</span></td><td>4</td><td><button className="btn btn--ghost btn--sm">Edit</button></td></tr>
                      <tr><td><strong>Site Balance</strong></td><td>Balance</td><td>0%</td><td>1.00$</td><td>USD</td><td><span className="badge badge--success">Active</span></td><td>5</td><td><button className="btn btn--ghost btn--sm">Edit</button></td></tr>
                    </>
                  )}
                </tbody>
              </table>
            </div>
          </section>

          {/* PRICES */}
          <section className="admin-section" id="sec-prices" style={{ display: activeSection === "prices" ? undefined : "none" }}>
            <div className="admin-section__header">
              <h2>Pricing Settings</h2>
            </div>
            <div className="admin-card-grid">
              <div className="card">
                <h3>Global Price Modifier</h3>
                <p className="admin-hint">Applied to all TM Market API prices</p>
                <div className="admin-inline-form">
                  <input type="number" className="input" defaultValue={prices?.modifier ?? -5} style={{ width: 100 }} id="priceModifier" />
                  <span>%</span>
                  <button className="btn btn--primary btn--sm" onClick={() => {
                    const val = (document.getElementById("priceModifier") as HTMLInputElement)?.value;
                    handleAction("PATCH", "/api/admin/prices", { modifier: Number(val) }, "Price modifier saved");
                  }}>Save</button>
                </div>
              </div>
              <div className="card">
                <h3>Price Source</h3>
                <p className="admin-hint">Base prices from TM Market API</p>
                <div className="admin-inline-form">
                  <span className="badge badge--success">Connected</span>
                  <button className="btn btn--secondary btn--sm" onClick={() => handleAction("POST", "/api/admin/prices/sync", {}, "Prices synced")}>Sync Now</button>
                </div>
              </div>
            </div>
            <div className="card" style={{ marginTop: 16 }}>
              <h3>Item Price Overrides</h3>
              <p className="admin-hint" style={{ marginBottom: 16 }}>Override individual item prices or disable them from buyout</p>
              <div className="admin-table-wrap">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Item</th>
                      <th>Game</th>
                      <th>Market Price</th>
                      <th>Buyout Price</th>
                      <th>Override</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {prices?.overrides?.length > 0 ? prices.overrides.map((p: any, i: number) => (
                      <tr key={p.id ?? i}>
                        <td>{p.item ?? p.name ?? "—"}</td>
                        <td>{p.game ?? "CS2"}</td>
                        <td>{p.marketPrice ?? "—"}</td>
                        <td>{p.buyoutPrice ?? "—"}</td>
                        <td>{p.override ?? "—"}</td>
                        <td><span className={`badge badge--${p.active !== false ? "success" : "warning"}`}>{p.active !== false ? "Active" : "Disabled"}</span></td>
                        <td><button className="btn btn--ghost btn--sm" onClick={() => handleAction("PATCH", `/api/admin/prices/${p.id}`, {}, "Price override updated")}>Edit</button></td>
                      </tr>
                    )) : (
                      <>
                        <tr><td>AK-47 | Case Hardened (FN)</td><td>CS2</td><td>712.50$</td><td>675.00$</td><td>—</td><td><span className="badge badge--success">Active</span></td><td><button className="btn btn--ghost btn--sm">Edit</button></td></tr>
                        <tr><td>Dragonclaw Hook</td><td>Dota 2</td><td>200.00$</td><td>185.00$</td><td>185.00$</td><td><span className="badge badge--success">Active</span></td><td><button className="btn btn--ghost btn--sm">Edit</button></td></tr>
                      </>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </section>

          {/* BALANCES */}
          <section className="admin-section" id="sec-balances" style={{ display: activeSection === "balances" ? undefined : "none" }}>
            <div className="admin-section__header">
              <h2>User Balances</h2>
              <input type="text" className="input" placeholder="Search user..." style={{ width: 260 }} value={balancesSearch} onChange={(e) => setBalancesSearch(e.target.value)} />
            </div>
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Steam ID</th>
                    <th>Balance</th>
                    <th>Last Activity</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {balances.length > 0 ? balances.map((b: any, i: number) => (
                    <tr key={b.id ?? i}>
                      <td><strong>{b.username ?? b.steamLogin ?? "—"}</strong></td>
                      <td>{b.steamId ?? "—"}</td>
                      <td><strong>{b.balance ?? "0.00"}$</strong></td>
                      <td>{b.lastActivity ? new Date(b.lastActivity).toLocaleDateString() : "—"}</td>
                      <td>
                        <button className="btn btn--ghost btn--sm" style={{ color: "var(--success)" }} onClick={() => handleAction("PATCH", `/api/admin/balance/${b.id}`, { action: "credit" }, "Balance credited")}>Credit</button>
                        <button className="btn btn--ghost btn--sm" style={{ color: "var(--danger)" }} onClick={() => handleAction("PATCH", `/api/admin/balance/${b.id}`, { action: "debit" }, "Balance debited")}>Debit</button>
                        <button className="btn btn--ghost btn--sm" onClick={() => handleAction("GET", `/api/admin/balance/${b.id}/history`, undefined, "History loaded")}>History</button>
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td><strong>user123</strong></td>
                      <td>76561198012345</td>
                      <td><strong>245.50$</strong></td>
                      <td>Mar 24, 2026</td>
                      <td>
                        <button className="btn btn--ghost btn--sm" style={{ color: "var(--success)" }}>Credit</button>
                        <button className="btn btn--ghost btn--sm" style={{ color: "var(--danger)" }}>Debit</button>
                        <button className="btn btn--ghost btn--sm">History</button>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>

          {/* CASHOUT REQUESTS */}
          <section className="admin-section" id="sec-cashouts" style={{ display: activeSection === "cashouts" ? undefined : "none" }}>
            <div className="admin-section__header">
              <h2>Cashout Requests</h2>
              <select className="input select" style={{ width: 160 }} value={cashoutsStatus} onChange={(e) => setCashoutsStatus(e.target.value)}>
                <option value="">All Statuses</option>
                <option>Created</option>
                <option>Pending</option>
                <option>Approved</option>
                <option>Rejected</option>
                <option>Paid</option>
              </select>
            </div>
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>User</th>
                    <th>Amount</th>
                    <th>Commission</th>
                    <th>Net</th>
                    <th>Method</th>
                    <th>Status</th>
                    <th>Created</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {cashouts.length > 0 ? cashouts.map((c: any, i: number) => (
                    <tr key={c.id ?? i}>
                      <td>#{c.id ?? `CO-${i}`}</td>
                      <td>{c.user ?? c.username ?? "—"}</td>
                      <td>{c.amount ?? "—"}</td>
                      <td>{c.commission ?? "—"}</td>
                      <td>{c.net ?? "—"}</td>
                      <td>{c.method ?? "—"}</td>
                      <td><span className={`status-badge status-badge--${(c.status ?? "created").toLowerCase()}`}>{c.status ?? "Pending"}</span></td>
                      <td>{c.createdAt ? new Date(c.createdAt).toLocaleDateString() : "—"}</td>
                      <td>
                        <button className="btn btn--ghost btn--sm" style={{ color: "var(--success)" }} onClick={() => handleAction("PATCH", `/api/admin/cashouts/${c.id}`, { status: "approved" }, "Cashout approved")}>Approve</button>
                        <button className="btn btn--ghost btn--sm" style={{ color: "var(--danger)" }} onClick={() => handleAction("PATCH", `/api/admin/cashouts/${c.id}`, { status: "rejected" }, "Cashout rejected")}>Reject</button>
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td>#CO-115</td>
                      <td>user123</td>
                      <td>200.00$</td>
                      <td>4.00$</td>
                      <td>196.00$</td>
                      <td>USDT (TRC-20)</td>
                      <td><span className="status-badge status-badge--created">Pending</span></td>
                      <td>Mar 24, 2026</td>
                      <td>
                        <button className="btn btn--ghost btn--sm" style={{ color: "var(--success)" }}>Approve</button>
                        <button className="btn btn--ghost btn--sm" style={{ color: "var(--danger)" }}>Reject</button>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>

          {/* STEAM BOTS */}
          <section className="admin-section" id="sec-bots" style={{ display: activeSection === "bots" ? undefined : "none" }}>
            <div className="admin-section__header">
              <h2>Steam Bots</h2>
              <button className="btn btn--primary btn--sm" onClick={() => handleAction("POST", "/api/admin/bots", {}, "Bot added")}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
                Add Bot
              </button>
            </div>
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Bot</th>
                    <th>Steam ID</th>
                    <th>Profile</th>
                    <th>Active Orders</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {bots.length > 0 ? bots.map((b: any, i: number) => (
                    <tr key={b.id ?? i}>
                      <td><strong>{b.name ?? `Bot #${i + 1}`}</strong></td>
                      <td>{b.steamId ?? "—"}</td>
                      <td><a href={b.profileUrl ?? "#"} className="link" target="_blank" rel="noopener noreferrer">Steam Profile</a></td>
                      <td>{b.activeOrders ?? 0}</td>
                      <td><span className={`badge badge--${b.active !== false ? "success" : "warning"}`}>{b.active !== false ? "Active" : "Inactive"}</span></td>
                      <td><button className="btn btn--ghost btn--sm" onClick={() => handleAction("PATCH", `/api/admin/bots/${b.id}`, {}, "Bot updated")}>Edit</button></td>
                    </tr>
                  )) : (
                    <>
                      <tr><td><strong>Bot #1 — TradeBot Alpha</strong></td><td>76561198099001</td><td><a href="#" className="link">Steam Profile</a></td><td>2</td><td><span className="badge badge--success">Active</span></td><td><button className="btn btn--ghost btn--sm">Edit</button></td></tr>
                      <tr><td><strong>Bot #2 — TradeBot Beta</strong></td><td>76561198099002</td><td><a href="#" className="link">Steam Profile</a></td><td>1</td><td><span className="badge badge--success">Active</span></td><td><button className="btn btn--ghost btn--sm">Edit</button></td></tr>
                      <tr><td><strong>Bot #3 — TradeBot Gamma</strong></td><td>76561198099003</td><td><a href="#" className="link">Steam Profile</a></td><td>0</td><td><span className="badge badge--warning">Inactive</span></td><td><button className="btn btn--ghost btn--sm">Edit</button></td></tr>
                    </>
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
                  <tr>
                    <th>Partner</th>
                    <th>Code</th>
                    <th>Referred Users</th>
                    <th>Orders</th>
                    <th>Successful</th>
                    <th>Volume</th>
                  </tr>
                </thead>
                <tbody>
                  {referrals.length > 0 ? referrals.map((r: any, i: number) => (
                    <tr key={r.id ?? i}>
                      <td><strong>{r.partner ?? r.name ?? "—"}</strong></td>
                      <td>{r.code ?? "—"}</td>
                      <td>{r.referredUsers ?? r.signups ?? 0}</td>
                      <td>{r.orders ?? r.ordered ?? 0}</td>
                      <td>{r.successful ?? r.done ?? 0}</td>
                      <td>{r.volume ?? "0.00"}$</td>
                    </tr>
                  )) : (
                    <tr>
                      <td><strong>PARTNER123</strong></td>
                      <td>PARTNER123</td>
                      <td>147</td>
                      <td>89</td>
                      <td>72</td>
                      <td>12,450.00$</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>

          {/* AUDIT LOG */}
          <section className="admin-section" id="sec-logs" style={{ display: activeSection === "logs" ? undefined : "none" }}>
            <div className="admin-section__header">
              <h2>Audit Log</h2>
              <input type="text" className="input" placeholder="Search logs..." style={{ width: 260 }} value={logsSearch} onChange={(e) => setLogsSearch(e.target.value)} />
            </div>
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Timestamp</th>
                    <th>Actor</th>
                    <th>Action</th>
                    <th>Entity</th>
                    <th>Details</th>
                  </tr>
                </thead>
                <tbody>
                  {auditLogs.length > 0 ? auditLogs.map((l: any, i: number) => (
                    <tr key={l.id ?? i}>
                      <td>{l.timestamp ? new Date(l.timestamp).toLocaleString() : "—"}</td>
                      <td>{l.actor ?? "—"}</td>
                      <td>{l.action ?? "—"}</td>
                      <td>{l.entity ?? "—"}</td>
                      <td>{l.details ?? "—"}</td>
                    </tr>
                  )) : (
                    <>
                      <tr><td>Mar 24, 14:38</td><td>admin</td><td>Status changed</td><td>Order #SW-2846</td><td>CREATED → TRADE_SENT</td></tr>
                      <tr><td>Mar 24, 14:36</td><td>admin</td><td>Bot assigned</td><td>Order #SW-2846</td><td>Assigned Bot #2</td></tr>
                      <tr><td>Mar 24, 11:10</td><td>admin</td><td>Balance credited</td><td>user: maria_d</td><td>+89.50$ (Order #SW-2845)</td></tr>
                      <tr><td>Mar 24, 11:08</td><td>admin</td><td>Status changed</td><td>Order #SW-2845</td><td>PAYMENT_PENDING → PAID</td></tr>
                      <tr><td>Mar 24, 09:50</td><td>system</td><td>Order cancelled</td><td>Order #SW-2844</td><td>Trade not accepted</td></tr>
                    </>
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

      {/* Toast container */}
      <div className="toast-container" id="toastContainer">
        {toasts.map((msg, i) => (
          <Toast key={`${msg}-${i}`} message={msg} onDone={() => removeToast(i)} />
        ))}
      </div>
    </>
  );
}
