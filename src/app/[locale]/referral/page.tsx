"use client";

import { useEffect, useState } from "react";
import { useSession } from "@/components/session-provider";
import { useTranslations } from "next-intl";

import "@/styles/skinwave-referral.css";

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

export default function ReferralPage() {
  const { user, loading: sessionLoading } = useSession();
  const [data, setData] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [userSearch, setUserSearch] = useState("");
  const [linkCopied, setLinkCopied] = useState(false);
  const [codeCopied, setCodeCopied] = useState(false);
  const [perPage, setPerPage] = useState(10);

  useEffect(() => {
    document.body.classList.add("page-dark");
    return () => document.body.classList.remove("page-dark");
  }, []);

  let t: (key: string) => string;
  try {
    t = useTranslations("referral");
  } catch {
    t = (key: string) => {
      const fallback: Record<string, string> = {
        title: "Referrals",
        availableEarnings: "Available Earnings",
        referredUsers: "Referred Users",
        totalEarnings: "Total Earnings",
        claim: "CLAIM",
        yourCode: "Your Affiliate Code",
        enterCode: "Enter code",
        yourLink: "Share Your Referral Link",
        howTitle: "How does it work?",
        how1: "Share your referral link with friends",
        how2: "They sign up and sell skins via your link",
        how3: "You earn a commission on every sale",
        transTitle: "Recent Transactions",
        searchPlaceholder: "Search by Steam ID",
        earnings: "Earnings",
        userCol: "User",
        date: "Date",
        noData: "No data available",
        itemsPerPage: "Items per page:",
        signInRequired: "Sign in to access your referral dashboard",
        signIn: "Sign in with Steam",
      };
      return fallback[key] || key;
    };
  }

  useEffect(() => {
    if (!user) return;
    fetch("/api/referral/stats")
      .then((r) => r.json())
      .then((json) => {
        if (json.success) setData(json.data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user]);

  const copyRefLink = () => {
    if (!data) return;
    const link = `${window.location.origin}/?ref=${data.code}`;
    navigator.clipboard.writeText(link).then(() => {
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    });
  };

  const copyRefCode = () => {
    if (!data) return;
    navigator.clipboard.writeText(data.code).then(() => {
      setCodeCopied(true);
      setTimeout(() => setCodeCopied(false), 2000);
    });
  };

  if (sessionLoading) {
    return (
      <main className="ref">
        <div className="container" style={{ display: "flex", justifyContent: "center", padding: "80px 0" }}>
          <div className="h-8 w-8 animate-spin rounded-full border-[3px] border-[var(--border)] border-t-[var(--accent)]" />
        </div>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="ref">
        <div className="container">
          <div className="ref-top">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
            <h1>{t("title")}</h1>
          </div>
          <div className="ref-guest">
            <div className="ref-guest__inner">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
              <h3>{t("signInRequired")}</h3>
              <a href="/api/auth/steam" className="ref-guest__btn">{t("signIn")}</a>
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (loading) {
    return (
      <main className="ref">
        <div className="container" style={{ display: "flex", justifyContent: "center", padding: "80px 0" }}>
          <div className="h-8 w-8 animate-spin rounded-full border-[3px] border-[var(--border)] border-t-[var(--accent)]" />
        </div>
      </main>
    );
  }

  const refCode = data?.code || "";
  const refLink = `${typeof window !== "undefined" ? window.location.origin : "https://skinsell.com"}/?ref=${refCode}`;

  const filteredUsers = (data?.users || []).filter((u) => {
    if (!userSearch) return true;
    const q = userSearch.toLowerCase();
    return (u.steamLogin ?? u.id).toLowerCase().includes(q);
  });

  const paginatedUsers = filteredUsers.slice(0, perPage);
  const totalUsers = filteredUsers.length;
  const showEnd = Math.min(perPage, totalUsers);

  return (
    <main className="ref">
      <div className="container">

        <div className="ref-top">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
          <h1>{t("title")}</h1>
        </div>

        <div className="ref-stats">
          <div className="ref-stat">
            <div className="ref-stat__body">
              <span className="ref-stat__label">{t("availableEarnings")}</span>
              <span className="ref-stat__val">{data?.volume || "0.00"} <small>$</small></span>
              <button className="ref-stat__claim" id="claimBtn">{t("claim")}</button>
            </div>
            <div className="ref-stat__icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="M2 10h20"/></svg>
            </div>
          </div>
          <div className="ref-stat">
            <div className="ref-stat__body">
              <span className="ref-stat__label">{t("referredUsers")}</span>
              <span className="ref-stat__val">{data?.signups || 0}</span>
            </div>
            <div className="ref-stat__icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
            </div>
          </div>
          <div className="ref-stat">
            <div className="ref-stat__body">
              <span className="ref-stat__label">{t("totalEarnings")}</span>
              <span className="ref-stat__val">{data?.volume || "0.00"} <small>$</small></span>
            </div>
            <div className="ref-stat__icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8"/><path d="M12 18V6"/></svg>
            </div>
          </div>
        </div>

        <div className="ref-cols">
          <div className="ref-code">
            <h3 className="ref-code__title">{t("yourCode")}</h3>
            <div className="ref-code__field">
              <div className="ref-code__icon">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
              </div>
              <input type="text" className="ref-code__input" value={refCode} readOnly placeholder={t("enterCode")} />
              <button
                className={`ref-code__btn${codeCopied ? " ref-code__btn--done" : ""}`}
                title="Copy"
                onClick={copyRefCode}
              >
                <svg className="ref-code__copy-ico" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                <svg className="ref-code__check-ico" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
              </button>
            </div>

            <h3 className="ref-code__title ref-code__title--link">{t("yourLink")}</h3>
            <div className="ref-code__field">
              <div className="ref-code__icon">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
              </div>
              <input type="text" className="ref-code__input" value={refLink} readOnly />
              <button
                className={`ref-code__btn${linkCopied ? " ref-code__btn--done" : ""}`}
                title="Copy"
                onClick={copyRefLink}
              >
                <svg className="ref-code__copy-ico" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                <svg className="ref-code__check-ico" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
              </button>
            </div>
          </div>

          <div className="ref-how">
            <h3 className="ref-how__title">{t("howTitle")}</h3>
            <div className="ref-how__list">
              <div className="ref-how__item">
                <div className="ref-how__icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/></svg>
                </div>
                <span>{t("how1")}</span>
              </div>
              <div className="ref-how__item">
                <div className="ref-how__icon ref-how__icon--gold">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                </div>
                <span>{t("how2")}</span>
              </div>
              <div className="ref-how__item">
                <div className="ref-how__icon ref-how__icon--green">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8"/><path d="M12 18V6"/></svg>
                </div>
                <span>{t("how3")}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="ref-trans">
          <div className="ref-trans__head">
            <div className="ref-trans__title">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/></svg>
              <h3>{t("transTitle")}</h3>
            </div>
            <div className="ref-trans__search">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              <input
                type="text"
                placeholder={t("searchPlaceholder")}
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
              />
            </div>
          </div>

          <div className="ref-trans__table">
            <table className="ref-table">
              <thead>
                <tr>
                  <th>{t("earnings")}</th>
                  <th>{t("userCol")}</th>
                  <th>{t("date")}</th>
                </tr>
              </thead>
              <tbody>
                {paginatedUsers.length > 0 ? (
                  paginatedUsers.map((u) => (
                    <tr key={u.id}>
                      <td>{u.totalVolume}$</td>
                      <td>{u.steamLogin ?? u.id.slice(0, 8)}</td>
                      <td>{new Date(u.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</td>
                    </tr>
                  ))
                ) : (
                  <tr className="ref-trans__empty">
                    <td colSpan={3}>{t("noData")}</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="ref-pag">
            <span className="ref-pag__label">{t("itemsPerPage")}</span>
            <select
              className="ref-pag__select"
              value={perPage}
              onChange={(e) => setPerPage(Number(e.target.value))}
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
            </select>
            <span className="ref-pag__info">
              {totalUsers > 0 ? `1-${showEnd}` : "0-0"} of {totalUsers}
            </span>
          </div>
        </div>

      </div>
    </main>
  );
}
