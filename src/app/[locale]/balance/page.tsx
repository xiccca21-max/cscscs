"use client";

import { useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useLocale } from "next-intl";
import { Link } from "@/i18n/navigation";

import "@/styles/skinwave-balance.css";

import { useSession } from "@/components/session-provider";

type Transaction = {
  id: string;
  type: "CREDIT" | "DEBIT" | "FREEZE" | "UNFREEZE";
  amount: string;
  balanceAfter: string;
  comment: string | null;
  createdAt: string;
};

type BalanceData = {
  balance: string;
  transactions: Transaction[];
};

type FilterType = "all" | "credit" | "withdraw";

export default function BalancePage() {
  const t = useTranslations("balance");
  const locale = useLocale();
  const { user, loading: sessionLoading, refresh: refreshSession } = useSession();
  const [data, setData] = useState<BalanceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [cashoutOpen, setCashoutOpen] = useState(false);
  const [cashoutAmount, setCashoutAmount] = useState("");
  const [cashoutMethod, setCashoutMethod] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [cashoutError, setCashoutError] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterType>("all");

  const fetchBalance = useCallback(async () => {
    try {
      const res = await fetch("/api/balance");
      const json = await res.json();
      if (json.success) {
        setData(json.data);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!sessionLoading && user) {
      fetchBalance();
    } else if (!sessionLoading && !user) {
      setLoading(false);
    }
  }, [sessionLoading, user, fetchBalance]);

  const balance = data ? parseFloat(data.balance) : 0;

  const totalEarned = data
    ? data.transactions
        .filter((tx) => tx.type === "CREDIT")
        .reduce((sum, tx) => sum + parseFloat(tx.amount), 0)
    : 0;

  const totalWithdrawn = data
    ? data.transactions
        .filter((tx) => tx.type === "DEBIT")
        .reduce((sum, tx) => sum + Math.abs(parseFloat(tx.amount)), 0)
    : 0;

  const pendingFrozen = data
    ? data.transactions
        .filter((tx) => tx.type === "FREEZE")
        .reduce((sum, tx) => sum + parseFloat(tx.amount), 0) -
      data.transactions
        .filter((tx) => tx.type === "UNFREEZE")
        .reduce((sum, tx) => sum + parseFloat(tx.amount), 0)
    : 0;

  const cashoutAmountNum = parseFloat(cashoutAmount) || 0;
  const commissionRate = 0.02;
  const commissionAmount = cashoutAmountNum * commissionRate;
  const youReceive = cashoutAmountNum - commissionAmount;

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = parseFloat(e.target.value);
    if (val > balance) {
      setCashoutAmount(balance.toFixed(2));
    } else if (val < 0) {
      setCashoutAmount("");
    } else {
      setCashoutAmount(e.target.value);
    }
  };

  const handleCashout = async () => {
    const amount = parseFloat(cashoutAmount);
    if (!Number.isFinite(amount) || amount <= 0) {
      setCashoutError(t("errorInvalidAmount"));
      return;
    }
    if (amount > balance) {
      setCashoutError(t("errorInsufficient"));
      return;
    }
    if (!cashoutMethod) {
      setCashoutError(t("errorSelectMethod"));
      return;
    }

    setSubmitting(true);
    setCashoutError(null);

    try {
      const res = await fetch("/api/cashout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount,
          paymentMethod: cashoutMethod,
          currency: "USD",
          paymentDetails: {},
        }),
      });
      const json = await res.json();
      if (json.success) {
        setCashoutOpen(false);
        setCashoutAmount("");
        setCashoutMethod(null);
        fetchBalance();
        refreshSession();
      } else {
        setCashoutError(json.error ?? t("errorFailed"));
      }
    } catch {
      setCashoutError(t("errorNetwork"));
    } finally {
      setSubmitting(false);
    }
  };

  const filteredTransactions = data
    ? data.transactions.filter((tx) => {
        if (filter === "credit") return tx.type === "CREDIT";
        if (filter === "withdraw") return tx.type === "DEBIT";
        return true;
      })
    : [];

  if (!sessionLoading && !user) {
    return (
      <main className="bal">
        <div className="container">
          <div className="bal-guest">
            <div className="bal-guest__glow" aria-hidden />
            <div className="bal-guest__card">
              <div className="bal-guest__intro">
                <h1 className="bal-title bal-title--onDark">{t("title")}</h1>
                <p className="bal-subtitle bal-subtitle--onDark">{t("subtitle")}</p>
              </div>
              <div className="bal-guest__intro-sep" aria-hidden />
              <div className="bal-guest__decor" aria-hidden>
                <span className="bal-guest__circle bal-guest__circle--1" />
                <span className="bal-guest__circle bal-guest__circle--2" />
              </div>
              <div className="bal-guest__steam">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                  <path d="M11.979 0C5.678 0 .511 4.86.022 11.037l6.432 2.658c.545-.371 1.203-.59 1.912-.59.063 0 .125.004.188.006l2.861-4.142V8.91c0-2.495 2.028-4.524 4.524-4.524s4.524 2.031 4.524 4.527-2.03 4.525-4.524 4.525h-.105l-4.076 2.911c0 .052.004.105.004.159 0 1.875-1.515 3.396-3.39 3.396-1.635 0-3.016-1.173-3.331-2.727L.436 15.27C1.862 20.307 6.486 24 11.979 24c6.627 0 12-5.372 12-12S18.606 0 11.979 0zm7.54 18.196-1.473-1.263c.407-.43.743-.935.99-1.496.25-.56.422-1.14.522-1.723l1.45-.335c.047-.366.127-.725.238-1.075l-1.725-.713c.065-.126.133-.25.204-.373.838-1.457 2.409-2.445 4.214-2.445 1.01 0 1.96.285 2.766.78l-1.01 1.463a3.5 3.5 0 0 0-1.756-.472c-1.93 0-3.5 1.57-3.5 3.5s1.57 3.5 3.5 3.5c.297 0 .584-.04.858-.114l1.58 1.354a5.478 5.478 0 0 1-3.438 1.228c-1.799 0-3.407-.885-4.396-2.244z" />
                </svg>
              </div>
              <h2 className="bal-guest__headline">{t("guestHeadline")}</h2>
              <p className="bal-guest__text">{t("signInPrompt")}</p>
              <form action="/api/auth/steam" method="get">
                <button type="submit" className="bal-guest__btn">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                    <path d="M11.979 0C5.678 0 .511 4.86.022 11.037l6.432 2.658c.545-.371 1.203-.59 1.912-.59.063 0 .125.004.188.006l2.861-4.142V8.91c0-2.495 2.028-4.524 4.524-4.524s4.524 2.031 4.524 4.527-2.03 4.525-4.524 4.525h-.105l-4.076 2.911c0 .052.004.105.004.159 0 1.875-1.515 3.396-3.39 3.396-1.635 0-3.016-1.173-3.331-2.727L.436 15.27C1.862 20.307 6.486 24 11.979 24c6.627 0 12-5.372 12-12S18.606 0 11.979 0zm7.54 18.196-1.473-1.263c.407-.43.743-.935.99-1.496.25-.56.422-1.14.522-1.723l1.45-.335c.047-.366.127-.725.238-1.075l-1.725-.713c.065-.126.133-.25.204-.373.838-1.457 2.409-2.445 4.214-2.445 1.01 0 1.96.285 2.766.78l-1.01 1.463a3.5 3.5 0 0 0-1.756-.472c-1.93 0-3.5 1.57-3.5 3.5s1.57 3.5 3.5 3.5c.297 0 .584-.04.858-.114l1.58 1.354a5.478 5.478 0 0 1-3.438 1.228c-1.799 0-3.407-.885-4.396-2.244z" />
                  </svg>
                  {t("signInBtn")}
                </button>
              </form>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="bal">
      <div className="container">

        {loading ? (
          <>
            <div className="bal-wallet">
              <div className="bal-wallet__glow" />
              <div className="bal-wallet__main">
                <h1 className="bal-wallet__page-title">{t("title")}</h1>
                <div className="bal-skeleton__wallet bal-skeleton__wallet--in-stack" aria-hidden>
                  <div className="bal-skeleton__line bal-skeleton__line--sm" />
                  <div className="bal-skeleton__line bal-skeleton__line--xl" />
                  <div className="bal-skeleton__actions">
                    <div className="bal-skeleton__pill" />
                    <div className="bal-skeleton__pill bal-skeleton__pill--narrow" />
                  </div>
                  <div className="bal-skeleton__stats">
                    <div className="bal-skeleton__stat" />
                    <div className="bal-skeleton__stat" />
                    <div className="bal-skeleton__stat" />
                  </div>
                </div>
              </div>
            </div>
            <div className="bal-skeleton bal-skeleton--below" aria-busy="true" aria-label={t("loading")}>
              <div className="bal-skeleton__history">
                <div className="bal-skeleton__history-head">
                  <div className="bal-skeleton__line bal-skeleton__line--md" />
                  <div className="bal-skeleton__filters">
                    <div className="bal-skeleton__chip" />
                    <div className="bal-skeleton__chip" />
                    <div className="bal-skeleton__chip" />
                  </div>
                </div>
                <div className="bal-skeleton__rows">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="bal-skeleton__row" />
                  ))}
                </div>
              </div>
            </div>
          </>
        ) : (
          <>
            {/* Wallet card */}
            <div className="bal-wallet">
              <div className="bal-wallet__glow"></div>
              <div className="bal-wallet__main">
                <div className="bal-wallet__decor" aria-hidden>
                  <span className="bal-wallet__circle bal-wallet__circle--1" />
                  <span className="bal-wallet__circle bal-wallet__circle--2" />
                </div>
                <h1 className="bal-wallet__page-title">{t("title")}</h1>
                <div className="bal-wallet__top">
                  <span className="bal-wallet__label">{t("available")}</span>
                  <div className="bal-wallet__icon">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2"/><path d="M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4"/></svg>
                  </div>
                </div>
                <h2 className="bal-wallet__amount">{balance.toFixed(2)}<small>$</small></h2>
                <div className="bal-wallet__actions">
                  <button
                    className="bal-wallet__cashout"
                    onClick={() => {
                      setCashoutOpen((prev) => !prev);
                    }}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12l7 7 7-7"/></svg>
                    <span>{t("cashout")}</span>
                  </button>
                  <Link href="/sell" className="bal-wallet__sell">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                    <span>{t("sellSkins")}</span>
                  </Link>
                </div>
              </div>

              {/* Stats row inside wallet */}
              <div className="bal-wallet__stats">
                <div className="bal-wstat">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>
                  <div className="bal-wstat__text">
                    <span className="bal-wstat__label">{t("totalEarned")}</span>
                    <span className="bal-wstat__val">{totalEarned.toFixed(2)}$</span>
                  </div>
                </div>
                <div className="bal-wstat__sep"></div>
                <div className="bal-wstat">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12l7 7 7-7"/></svg>
                  <div className="bal-wstat__text">
                    <span className="bal-wstat__label">{t("totalWithdrawn")}</span>
                    <span className="bal-wstat__val">{totalWithdrawn.toFixed(2)}$</span>
                  </div>
                </div>
                <div className="bal-wstat__sep"></div>
                <div className="bal-wstat">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                  <div className="bal-wstat__text">
                    <span className="bal-wstat__label">{t("pending")}</span>
                    <span className="bal-wstat__val">{Math.max(0, pendingFrozen).toFixed(2)}$</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Cash Out Form (collapsible) */}
            <div className={`bal-cashout${cashoutOpen ? " open" : ""}`}>
              <div className="bal-cashout__head">
                <h3>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12l7 7 7-7"/></svg>
                  <span>{t("cashoutTitle")}</span>
                </h3>
                <button className="bal-cashout__close" onClick={() => setCashoutOpen(false)}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="18 15 12 9 6 15"/></svg>
                  <span>{t("hide")}</span>
                </button>
              </div>

              <div className="bal-cashout__body">
                <div className="form-group">
                  <label>{t("amount")}</label>
                  <div className="cashout-amount-wrap">
                    <input
                      type="number"
                      className="input"
                      placeholder="0.00"
                      max={balance}
                      min={1}
                      value={cashoutAmount}
                      onChange={handleAmountChange}
                    />
                    <button
                      className="cashout-max"
                      onClick={() => setCashoutAmount(balance.toFixed(2))}
                    >
                      {t("max")}
                    </button>
                  </div>
                  <span className="cashout-available">{t("availableAmount")} <strong>{balance.toFixed(2)}$</strong></span>
                </div>

                <div className="form-group">
                  <label>{t("selectMethod")}</label>
                  <div className="bal-methods">
                    <button
                      className={`bal-method${cashoutMethod === "card" ? " active" : ""}`}
                      onClick={() => setCashoutMethod("card")}
                    >
                      <div className="bal-method__icon">
                        <img src="/icons/pay-card.png" alt="Card" width="36" height="36" style={{ objectFit: "contain" }} />
                      </div>
                      <span className="bal-method__name">{t("debitCard")}</span>
                      <span className="bal-method__desc">{t("visaMc")}</span>
                      <div className="bal-method__conditions">
                        <span>{t("methodMin")}: <strong>1$</strong></span>
                        <span>{t("methodFee")}: <strong>0%</strong></span>
                        <span>{t("methodSpeed")}: <strong>{t("methodInstant")}</strong></span>
                      </div>
                    </button>
                    <button
                      className={`bal-method${cashoutMethod === "crypto" ? " active" : ""}`}
                      onClick={() => setCashoutMethod("crypto")}
                    >
                      <div className="bal-method__icon">
                        <img src="/icons/tether.png" alt="Crypto" width="36" height="36" style={{ objectFit: "contain" }} />
                      </div>
                      <span className="bal-method__name">{t("cryptocurrency")}</span>
                      <span className="bal-method__desc">{t("cryptoDesc")}</span>
                      <div className="bal-method__conditions">
                        <span>{t("methodMin")}: <strong>5$</strong></span>
                        <span>{t("methodFee")}: <strong>0%</strong></span>
                        <span>{t("methodSpeed")}: <strong>{t("methodInstant")}</strong></span>
                      </div>
                    </button>
                    <button
                      className={`bal-method${cashoutMethod === "bank" ? " active" : ""}`}
                      onClick={() => setCashoutMethod("bank")}
                    >
                      <div className="bal-method__icon">
                        <img src="/icons/pay-bank.png" alt="Bank" width="36" height="36" style={{ objectFit: "contain" }} />
                      </div>
                      <span className="bal-method__name">{t("bankTransfer")}</span>
                      <span className="bal-method__desc">{t("ibanSwift")}</span>
                      <div className="bal-method__conditions">
                        <span>{t("methodMin")}: <strong>50$</strong></span>
                        <span>{t("methodFee")}: <strong>0%</strong></span>
                        <span>{t("methodSpeed")}: <strong>1-2 {t("methodDays")}</strong></span>
                      </div>
                    </button>
                  </div>
                </div>

                <div className="bal-summary">
                  <div className="bal-summary__row">
                    <span>{t("withdrawalAmount")}</span>
                    <span>{cashoutAmountNum.toFixed(2)}$</span>
                  </div>
                  <div className="bal-summary__row">
                    <span>{t("commission")}</span>
                    <span>{commissionAmount.toFixed(2)}$</span>
                  </div>
                  <div className="bal-summary__row bal-summary__row--total">
                    <span>{t("youReceive")}</span>
                    <span>{youReceive.toFixed(2)}$</span>
                  </div>
                </div>

                {cashoutError && (
                  <p style={{ color: "#ef4444", fontSize: 13, fontWeight: 600, marginBottom: 12 }}>{cashoutError}</p>
                )}

                <button
                  className="bal-continue"
                  disabled={submitting || !cashoutMethod || cashoutAmountNum <= 0}
                  onClick={handleCashout}
                >
                  <span>{submitting ? "…" : t("submit")}</span>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 18 15 12 9 6"/></svg>
                </button>
              </div>
            </div>

            {/* Transaction History */}
            <div className="bal-history">
              <div className="bal-history__head">
                <h3>{t("history")}</h3>
                <div className="bal-history__filters">
                  <button
                    className={`bal-fil${filter === "all" ? " active" : ""}`}
                    onClick={() => setFilter("all")}
                  >
                    {t("filterAll")}
                  </button>
                  <button
                    className={`bal-fil${filter === "credit" ? " active" : ""}`}
                    onClick={() => setFilter("credit")}
                  >
                    {t("filterSales")}
                  </button>
                  <button
                    className={`bal-fil${filter === "withdraw" ? " active" : ""}`}
                    onClick={() => setFilter("withdraw")}
                  >
                    {t("filterWithdrawals")}
                  </button>
                </div>
              </div>
              <div className="bal-history__table-wrap">
                {filteredTransactions.length > 0 ? (
                  <table className="bal-table">
                    <thead>
                      <tr>
                        <th>{t("colDate")}</th>
                        <th>{t("colDescription")}</th>
                        <th>{t("colAmount")}</th>
                        <th>{t("colStatus")}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredTransactions.map((tx) => (
                        <tr key={tx.id} className="bal-row" data-type={tx.type === "CREDIT" ? "credit" : "withdraw"}>
                          <td>
                            <span className="bal-row__date">
                              {new Date(tx.createdAt).toLocaleDateString(locale === "ru" ? "ru-RU" : "en-US", { month: "short", day: "numeric", year: "numeric" })}
                            </span>
                          </td>
                          <td>
                            <span className="bal-row__desc-wrap">
                              <span
                                className={`bal-row__type${tx.type === "CREDIT" ? " bal-row__type--credit" : " bal-row__type--debit"}`}
                                aria-hidden
                              >
                                {tx.type === "CREDIT" ? (
                                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M12 19V5M5 12l7-7 7 7" />
                                  </svg>
                                ) : (
                                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M12 5v14M19 12l-7 7-7-7" />
                                  </svg>
                                )}
                              </span>
                              <span className="bal-row__desc">
                                {tx.type === "CREDIT"
                                  ? <>{t("skinSale")} - <strong>#{tx.id.slice(0, 8).toUpperCase()}</strong></>
                                  : <>{t("withdrawal")} - <strong>{cashoutMethod ?? t("payout")}</strong></>
                                }
                                {tx.comment && <> - {tx.comment}</>}
                              </span>
                            </span>
                          </td>
                          <td>
                            <span className={`bal-row__amt ${tx.type === "CREDIT" ? "bal-row__amt--plus" : "bal-row__amt--minus"}`}>
                              {tx.type === "CREDIT" ? "+" : "-"}{Math.abs(parseFloat(tx.amount)).toFixed(2)}$
                            </span>
                          </td>
                          <td>
                            <span className={`bal-badge ${tx.type === "CREDIT" ? "bal-badge--credit" : "bal-badge--paid"}`}>
                              {tx.type === "CREDIT" ? t("credit") : t("paid")}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="bal-empty">
                    <div className="bal-empty__icon">
                      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/></svg>
                    </div>
                    <p>{t("noTransactions")}</p>
                  </div>
                )}
              </div>
            </div>
          </>
        )}

      </div>
    </main>
  );
}
