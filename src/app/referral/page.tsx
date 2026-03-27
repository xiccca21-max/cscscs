"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";

type ReferralUser = {
  id: string;
  steamLogin: string | null;
  createdAt: string;
  ordersCount: number;
  paidOrders: number;
  totalVolume: string;
};

type StatsData = {
  name: string;
  code: string;
  signups: number;
  ordered: number;
  done: number;
  volume: string;
  users: ReferralUser[];
};

export default function ReferralDashboardPage() {
  const router = useRouter();
  const [data, setData] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [userSearch, setUserSearch] = useState("");
  const [perPage, setPerPage] = useState(10);
  const [codeInput, setCodeInput] = useState("");
  const [codeSaved, setCodeSaved] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [claiming, setClaiming] = useState(false);

  const fetchStats = useCallback(async () => {
    try {
      const r = await fetch("/api/referral/stats");
      if (r.status === 401) {
        router.push("/referral/login");
        return;
      }
      const json = await r.json();
      if (json.success) {
        setData(json.data);
        setCodeInput(json.data.code || "");
      } else {
        router.push("/referral/login");
      }
    } catch {
      router.push("/referral/login");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    document.body.classList.add("page-dark");
    fetchStats();
    return () => {
      document.body.classList.remove("page-dark");
    };
  }, [fetchStats]);

  const saveCode = async () => {
    if (!codeInput.trim()) return;
    try {
      const r = await fetch("/api/referral/code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: codeInput.trim() }),
      });
      const json = await r.json();
      if (json.success) {
        setCodeSaved(true);
        setTimeout(() => setCodeSaved(false), 2000);
        fetchStats();
      }
    } catch {
      // ignore
    }
  };

  const copyLink = () => {
    if (!data) return;
    const link = `https://skinwave.com/ref/${data.code}`;
    navigator.clipboard.writeText(link).then(() => {
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    });
  };

  const claimEarnings = async () => {
    setClaiming(true);
    try {
      await fetch("/api/referral/claim", { method: "POST" });
      await fetchStats();
    } catch {
      // ignore
    } finally {
      setClaiming(false);
    }
  };

  const filteredUsers = useMemo(() => {
    if (!data) return [];
    if (!userSearch) return data.users;
    const q = userSearch.toLowerCase();
    return data.users.filter((u) =>
      (u.steamLogin ?? u.id).toLowerCase().includes(q)
    );
  }, [data, userSearch]);

  const paginatedUsers = useMemo(() => {
    return filteredUsers.slice(0, perPage);
  }, [filteredUsers, perPage]);

  const paginationInfo = useMemo(() => {
    const total = filteredUsers.length;
    if (total === 0) return "0-0 of 0";
    const end = Math.min(perPage, total);
    return `1-${end} of ${total}`;
  }, [filteredUsers, perPage]);

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "80px 0" }}>
        <div style={{ width: 32, height: 32, border: "3px solid rgba(255,255,255,0.1)", borderTopColor: "#6366f1", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
      </div>
    );
  }

  if (!data) return null;

  const refLink = `https://skinwave.com/ref/${data.code}`;

  return (
    <main className="ref">
      <div className="container">

        {/* Page title */}
        <div className="ref-top">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
          <h1>Referrals</h1>
        </div>

        {/* Stats row */}
        <div className="ref-stats">
          <div className="ref-stat">
            <div className="ref-stat__body">
              <span className="ref-stat__label">Available Earnings</span>
              <span className="ref-stat__val">0,00 <small>$</small></span>
              <button className="ref-stat__claim" id="claimBtn" onClick={claimEarnings} disabled={claiming}>CLAIM</button>
            </div>
            <div className="ref-stat__icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="4" width="20" height="16" rx="2" /><path d="M2 10h20" /></svg>
            </div>
          </div>
          <div className="ref-stat">
            <div className="ref-stat__body">
              <span className="ref-stat__label">Referred Users</span>
              <span className="ref-stat__val">{data.signups}</span>
            </div>
            <div className="ref-stat__icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
            </div>
          </div>
          <div className="ref-stat">
            <div className="ref-stat__body">
              <span className="ref-stat__label">Total Earnings</span>
              <span className="ref-stat__val">{data.volume} <small>$</small></span>
            </div>
            <div className="ref-stat__icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8" /><path d="M12 18V6" /></svg>
            </div>
          </div>
        </div>

        {/* Two columns: code + how it works */}
        <div className="ref-cols">

          {/* Left: code & link */}
          <div className="ref-code">
            <h3 className="ref-code__title">Your Affiliate Code</h3>
            <div className="ref-code__field">
              <div className="ref-code__icon">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
              </div>
              <input
                type="text"
                className="ref-code__input"
                id="refCode"
                placeholder="Enter your code"
                value={codeInput}
                onChange={(e) => setCodeInput(e.target.value)}
              />
              <button
                className={`ref-code__btn${codeSaved ? " ref-code__btn--done" : ""}`}
                id="saveRefCode"
                title="Save"
                onClick={saveCode}
              >
                <svg className="ref-code__copy-ico" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" /><polyline points="17 21 17 13 7 13 7 21" /><polyline points="7 3 7 8 15 8" /></svg>
                <svg className="ref-code__check-ico" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>
              </button>
            </div>

            <h3 className="ref-code__title ref-code__title--link">Share Your Referral Link</h3>
            <div className="ref-code__field">
              <div className="ref-code__icon">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" /><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" /></svg>
              </div>
              <input
                type="text"
                className="ref-code__input"
                id="refLink"
                value={refLink}
                readOnly
              />
              <button
                className={`ref-code__btn${linkCopied ? " ref-code__btn--done" : ""}`}
                id="copyRefLink"
                title="Copy"
                onClick={copyLink}
              >
                <svg className="ref-code__copy-ico" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></svg>
                <svg className="ref-code__check-ico" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>
              </button>
            </div>
          </div>

          {/* Right: how it works */}
          <div className="ref-how">
            <h3 className="ref-how__title">How does it work?</h3>
            <div className="ref-how__list">
              <div className="ref-how__item">
                <div className="ref-how__icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="8.5" cy="7" r="4" /><line x1="20" y1="8" x2="20" y2="14" /><line x1="23" y1="11" x2="17" y2="11" /></svg>
                </div>
                <span>Invite your friends or followers</span>
              </div>
              <div className="ref-how__item">
                <div className="ref-how__icon ref-how__icon--gold">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" /></svg>
                </div>
                <span>They receive a 1% bonus on each sale</span>
              </div>
              <div className="ref-how__item">
                <div className="ref-how__icon ref-how__icon--green">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8" /><path d="M12 18V6" /></svg>
                </div>
                <span>You earn a 1% commission on every sale</span>
              </div>
            </div>
          </div>

        </div>

        {/* Transactions table */}
        <div className="ref-trans">
          <div className="ref-trans__head">
            <div className="ref-trans__title">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" /><path d="M3 9h18M9 21V9" /></svg>
              <h3>Referred User Transactions</h3>
            </div>
            <div className="ref-trans__search">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
              <input
                type="text"
                id="refUserSearch"
                placeholder="Search by Steam ID"
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
              />
            </div>
          </div>

          <div className="ref-trans__table">
            <table className="ref-table">
              <thead>
                <tr>
                  <th>Earnings</th>
                  <th>User</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody id="refTransBody">
                {paginatedUsers.length === 0 ? (
                  <tr className="ref-trans__empty">
                    <td colSpan={3}>No data available</td>
                  </tr>
                ) : (
                  paginatedUsers.map((u) => (
                    <tr key={u.id}>
                      <td>{u.totalVolume}$</td>
                      <td>{u.steamLogin ?? u.id.slice(0, 8)}</td>
                      <td>{new Date(u.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="ref-pag">
            <span className="ref-pag__label">Items per page:</span>
            <select
              className="ref-pag__select"
              id="refPerPage"
              value={perPage}
              onChange={(e) => setPerPage(Number(e.target.value))}
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
            </select>
            <span className="ref-pag__info">{paginationInfo}</span>
          </div>
        </div>

      </div>
    </main>
  );
}
