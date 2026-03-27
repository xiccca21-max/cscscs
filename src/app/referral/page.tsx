"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

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
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetch("/api/referral/stats")
      .then(async (r) => {
        if (r.status === 401) {
          router.push("/referral/login");
          return null;
        }
        return r.json();
      })
      .then((json) => {
        if (!json) return;
        if (json.success) {
          setData(json.data);
        } else {
          router.push("/referral/login");
        }
      })
      .catch(() => router.push("/referral/login"))
      .finally(() => setLoading(false));
  }, [router]);

  const copyLink = () => {
    if (!data) return;
    const link = `https://skinwave.com/?ref=${data.code}`;
    navigator.clipboard.writeText(link).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-[3px] border-[var(--border)] border-t-[var(--accent)]" />
      </div>
    );
  }

  if (!data) return null;

  const refLink = `https://skinwave.com/?ref=${data.code}`;

  const filteredUsers = data.users.filter((u) => {
    if (!userSearch) return true;
    const q = userSearch.toLowerCase();
    return (u.steamLogin ?? u.id).toLowerCase().includes(q);
  });

  return (
    <main className="referral-page">
      <div className="container">

        <div className="referral-header">
          <h1>Referral Dashboard</h1>
          <p>Track your referral performance and earnings</p>
        </div>

        {/* Referral link */}
        <div className="referral-link-card card">
          <div className="referral-link-card__left">
            <h3>Your Referral Link</h3>
            <div className="referral-link-field">
              <input type="text" className="input" value={refLink} readOnly />
              <button className="btn btn--primary btn--sm" onClick={copyLink}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></svg>
                {copied ? "Copied!" : "Copy"}
              </button>
            </div>
          </div>
          <div className="referral-link-card__right">
            <span className="referral-link-card__code">{data.code}</span>
            <span className="referral-link-card__label">Your code</span>
          </div>
        </div>

        {/* Stats overview */}
        <div className="referral-stats">
          <div className="ref-stat-card">
            <div className="ref-stat-card__icon">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
            </div>
            <span className="ref-stat-card__value">{data.signups}</span>
            <span className="ref-stat-card__label">Users Referred</span>
          </div>
          <div className="ref-stat-card">
            <div className="ref-stat-card__icon">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12" /></svg>
            </div>
            <span className="ref-stat-card__value">{data.ordered}</span>
            <span className="ref-stat-card__label">Created Orders</span>
          </div>
          <div className="ref-stat-card">
            <div className="ref-stat-card__icon">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12" /></svg>
            </div>
            <span className="ref-stat-card__value">{data.done}</span>
            <span className="ref-stat-card__label">Successful Deals</span>
          </div>
          <div className="ref-stat-card">
            <div className="ref-stat-card__icon">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg>
            </div>
            <span className="ref-stat-card__value">{data.volume}$</span>
            <span className="ref-stat-card__label">Total Deal Volume</span>
          </div>
        </div>

        {/* Referred users table */}
        <div className="referral-users card">
          <div className="referral-users__header">
            <h3>Referred Users</h3>
            <div className="referral-users__search">
              <input
                type="text"
                className="input"
                placeholder="Search users..."
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
              />
            </div>
          </div>

          <div className="referral-users__table">
            <table>
              <thead>
                <tr>
                  <th>User</th>
                  <th>Joined</th>
                  <th>Orders</th>
                  <th>Successful</th>
                  <th>Volume</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((u) => (
                  <tr key={u.id}>
                    <td>
                      <div className="ref-user">
                        <div className="ref-user__avatar">
                          <span>{(u.steamLogin ?? u.id)[0].toUpperCase()}</span>
                        </div>
                        <span>{u.steamLogin ?? u.id.slice(0, 8)}</span>
                      </div>
                    </td>
                    <td>{new Date(u.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</td>
                    <td>{u.ordersCount}</td>
                    <td>{u.paidOrders}</td>
                    <td>{u.totalVolume}$</td>
                  </tr>
                ))}
                {filteredUsers.length === 0 && (
                  <tr>
                    <td colSpan={5} style={{ textAlign: "center", padding: 20 }}>No users found</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </main>
  );
}
