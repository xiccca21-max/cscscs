"use client";

import { useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";

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

type FilterType = "all" | "credit" | "withdrawal";

export default function BalancePage() {
  const t = useTranslations("balance");
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

  const handleCashout = async () => {
    const amount = parseFloat(cashoutAmount);
    if (!Number.isFinite(amount) || amount <= 0) {
      setCashoutError("Enter a valid amount");
      return;
    }
    if (amount > balance) {
      setCashoutError("Insufficient balance");
      return;
    }
    if (!cashoutMethod) {
      setCashoutError("Select a withdrawal method");
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
        setCashoutError(json.error ?? "Failed");
      }
    } catch {
      setCashoutError("Network error");
    } finally {
      setSubmitting(false);
    }
  };

  const filteredTransactions = data
    ? data.transactions.filter((tx) => {
        if (filter === "credit") return tx.type === "CREDIT";
        if (filter === "withdrawal") return tx.type === "DEBIT";
        return true;
      })
    : [];

  if (!sessionLoading && !user) {
    return (
      <main className="balance-page">
        <div className="container">
          <h1 className="balance-page__title">{t("title")}</h1>
          <div className="balance-login-prompt">
            <p>Please sign in to view your balance.</p>
            <form action="/api/auth/steam" method="get">
              <button type="submit" className="btn btn--primary">
                Sign in with Steam
              </button>
            </form>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="balance-page">
      <div className="container">

        <h1 className="balance-page__title">{t("title")}</h1>

        {loading ? (
          <div className="balance-loading">
            <div className="balance-spinner" />
          </div>
        ) : (
          <>
            {/* Balance overview */}
            <div className="balance-overview">
              <div className="balance-card balance-card--main">
                <span className="balance-card__label">{t("available")}</span>
                <span className="balance-card__value">{balance.toFixed(2)}$</span>
                <button
                  type="button"
                  className="btn btn--primary"
                  onClick={() => setCashoutOpen(true)}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12l7 7 7-7" /></svg>
                  {t("cashout")}
                </button>
              </div>
              <div className="balance-card">
                <span className="balance-card__label">{t("totalEarned")}</span>
                <span className="balance-card__value balance-card__value--secondary">{totalEarned.toFixed(2)}$</span>
              </div>
              <div className="balance-card">
                <span className="balance-card__label">{t("totalWithdrawn")}</span>
                <span className="balance-card__value balance-card__value--secondary">{totalWithdrawn.toFixed(2)}$</span>
              </div>
              <div className="balance-card">
                <span className="balance-card__label">{t("pending")}</span>
                <span className="balance-card__value balance-card__value--warning">{Math.max(0, pendingFrozen).toFixed(2)}$</span>
              </div>
            </div>

            {/* Cash Out Form */}
            {cashoutOpen && (
              <div className="cashout-form card">
                <div className="cashout-form__header">
                  <h3>{t("cashoutTitle")}</h3>
                  <button
                    type="button"
                    className="btn btn--ghost btn--sm"
                    onClick={() => setCashoutOpen(false)}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                  </button>
                </div>

                <div className="cashout-form__body">
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
                        onChange={(e) => setCashoutAmount(e.target.value)}
                        style={{ paddingLeft: "12px", paddingRight: "72px" }}
                      />
                      <span className="cashout-amount-prefix" style={{ left: "auto", right: "48px" }}>$</span>
                      <button
                        type="button"
                        className="btn btn--ghost btn--sm"
                        onClick={() => setCashoutAmount(balance.toFixed(2))}
                      >
                        MAX
                      </button>
                    </div>
                    <span className="cashout-available">Available: {balance.toFixed(2)}$</span>
                  </div>

                  <div className="form-group">
                    <label>Withdrawal Method</label>
                    <div className="payment-methods-grid">
                      <button
                        type="button"
                        className={`payment-method${cashoutMethod === "card" ? " active" : ""}`}
                        onClick={() => setCashoutMethod("card")}
                      >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="1" y="4" width="22" height="16" rx="2" /><line x1="1" y1="10" x2="23" y2="10" /></svg>
                        <span>Card</span>
                      </button>
                      <button
                        type="button"
                        className={`payment-method${cashoutMethod === "crypto" ? " active" : ""}`}
                        onClick={() => setCashoutMethod("crypto")}
                      >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="10" /><path d="M9.5 8l5 8M14.5 8l-5 8" /></svg>
                        <span>Crypto</span>
                      </button>
                      <button
                        type="button"
                        className={`payment-method${cashoutMethod === "bank" ? " active" : ""}`}
                        onClick={() => setCashoutMethod("bank")}
                      >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M3 21h18M3 10h18M5 6l7-3 7 3M4 10v11M20 10v11M8 14v3M12 14v3M16 14v3" /></svg>
                        <span>Bank</span>
                      </button>
                    </div>
                  </div>

                  <div className="cashout-summary">
                    <div className="summary-row">
                      <span>Withdrawal amount</span>
                      <span>{cashoutAmountNum.toFixed(2)}$</span>
                    </div>
                    <div className="summary-row">
                      <span>Commission (2%)</span>
                      <span>{commissionAmount.toFixed(2)}$</span>
                    </div>
                    <div className="summary-row summary-row--total">
                      <span>You receive</span>
                      <span>{youReceive.toFixed(2)}$</span>
                    </div>
                  </div>

                  {cashoutError && (
                    <p className="cashout-modal__error">{cashoutError}</p>
                  )}

                  <button
                    type="button"
                    className="btn btn--primary btn--lg"
                    disabled={submitting || !cashoutMethod || cashoutAmountNum <= 0}
                    onClick={handleCashout}
                    style={{ width: "100%" }}
                  >
                    {submitting ? "…" : t("submit")}
                  </button>
                </div>
              </div>
            )}

            {/* Transaction History */}
            <div className="balance-history card">
              <div className="balance-history__header">
                <h3>{t("history")}</h3>
                <div className="balance-history__filters">
                  <button
                    type="button"
                    className={`chip chip--sm${filter === "all" ? " active" : ""}`}
                    onClick={() => setFilter("all")}
                  >
                    All
                  </button>
                  <button
                    type="button"
                    className={`chip chip--sm${filter === "credit" ? " active" : ""}`}
                    onClick={() => setFilter("credit")}
                  >
                    Credits
                  </button>
                  <button
                    type="button"
                    className={`chip chip--sm${filter === "withdrawal" ? " active" : ""}`}
                    onClick={() => setFilter("withdrawal")}
                  >
                    Withdrawals
                  </button>
                </div>
              </div>

              <div className="balance-history__table">
                {filteredTransactions.length > 0 ? (
                  <table>
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Type</th>
                        <th>Description</th>
                        <th>Amount</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredTransactions.map((tx) => (
                        <tr key={tx.id}>
                          <td>{new Date(tx.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</td>
                          <td>
                            <span className={`badge ${tx.type === "CREDIT" ? "badge--success" : "badge--accent"}`}>
                              {tx.type === "CREDIT" ? "Credit" : "Withdrawal"}
                            </span>
                          </td>
                          <td>{tx.comment ?? "—"}</td>
                          <td className={tx.type === "CREDIT" ? "amount-positive" : "amount-negative"}>
                            {tx.type === "CREDIT" ? "+" : "-"}{Math.abs(parseFloat(tx.amount)).toFixed(2)}$
                          </td>
                          <td>
                            <span className="status-badge status-badge--paid">
                              {tx.type === "CREDIT" ? "Completed" : "Paid"}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <p className="balance-history__empty">{t("noTransactions")}</p>
                )}
              </div>
            </div>
          </>
        )}

      </div>
    </main>
  );
}
