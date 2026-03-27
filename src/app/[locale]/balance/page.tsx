"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
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
type PaymentMethod = "card" | "crypto" | "bank";

const COMMISSION = 0.02;

const CRYPTO_LIST = [
  { key: "btc", name: "Bitcoin", ticker: "BTC" },
  { key: "usdt", name: "Tether", ticker: "USDT" },
  { key: "eth", name: "Ethereum", ticker: "ETH" },
  { key: "ltc", name: "Litecoin", ticker: "LTC" },
  { key: "sol", name: "Solana", ticker: "SOL" },
  { key: "trx", name: "TRON", ticker: "TRX" },
] as const;

const METHOD_LABELS: Record<PaymentMethod, string> = {
  card: "Debit Card",
  crypto: "Cryptocurrency",
  bank: "Bank Transfer",
};

export default function BalancePage() {
  const t = useTranslations("balance");
  const { user, loading: sessionLoading, refresh: refreshSession } = useSession();

  const [data, setData] = useState<BalanceData | null>(null);
  const [loading, setLoading] = useState(true);

  const [cashoutOpen, setCashoutOpen] = useState(false);
  const [cashoutAmount, setCashoutAmount] = useState("");
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [selectedCrypto, setSelectedCrypto] = useState("btc");

  const [cardFirst, setCardFirst] = useState("");
  const [cardLast, setCardLast] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [cardEmail, setCardEmail] = useState("");

  const [cryptoWallet, setCryptoWallet] = useState("");
  const [cryptoEmail, setCryptoEmail] = useState("");

  const [bankFirst, setBankFirst] = useState("");
  const [bankLast, setBankLast] = useState("");
  const [bankEmail, setBankEmail] = useState("");
  const [bankIban, setBankIban] = useState("");
  const [bankSwift, setBankSwift] = useState("");

  const [fieldErrors, setFieldErrors] = useState<Set<string>>(new Set());

  const [filter, setFilter] = useState<FilterType>("all");
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const cashoutFormRef = useRef<HTMLDivElement>(null);

  const fetchBalance = useCallback(async () => {
    try {
      const res = await fetch("/api/balance");
      const json = await res.json();
      if (json.success) setData(json.data);
    } catch {
      /* ignore */
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

  const totalIn = data
    ? data.transactions
        .filter((tx) => tx.type === "CREDIT")
        .reduce((s, tx) => s + parseFloat(tx.amount), 0)
    : 0;

  const totalOut = data
    ? data.transactions
        .filter((tx) => tx.type === "DEBIT")
        .reduce((s, tx) => s + Math.abs(parseFloat(tx.amount)), 0)
    : 0;

  const pending = data
    ? Math.max(
        0,
        data.transactions
          .filter((tx) => tx.type === "FREEZE")
          .reduce((s, tx) => s + parseFloat(tx.amount), 0) -
          data.transactions
            .filter((tx) => tx.type === "UNFREEZE")
            .reduce((s, tx) => s + parseFloat(tx.amount), 0),
      )
    : 0;

  const amountNum = parseFloat(cashoutAmount) || 0;
  const commission = amountNum * COMMISSION;
  const youReceive = amountNum - commission;

  const handleAmountChange = (val: string) => {
    let num = parseFloat(val);
    if (num > balance) {
      setCashoutAmount(balance.toString());
      return;
    }
    if (num < 0) {
      setCashoutAmount("");
      return;
    }
    setCashoutAmount(val);
  };

  const handleCashoutToggle = () => {
    setCashoutOpen((prev) => {
      const next = !prev;
      if (next) {
        setTimeout(() => {
          cashoutFormRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
        }, 50);
      }
      return next;
    });
  };

  const canContinue = amountNum > 0 && selectedMethod !== null;

  const handleContinue = () => {
    if (!canContinue) return;
    setModalOpen(true);
    document.body.style.overflow = "hidden";
  };

  const closeModal = () => {
    setModalOpen(false);
    document.body.style.overflow = "";
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && modalOpen) closeModal();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [modalOpen]);

  const clearFieldError = (field: string) => {
    setFieldErrors((prev) => {
      const next = new Set(prev);
      next.delete(field);
      return next;
    });
  };

  const handleSubmitWithdrawal = async () => {
    const errors = new Set<string>();
    let details: Record<string, string> = {};

    if (selectedMethod === "card") {
      if (!cardFirst.trim()) errors.add("cardFirst");
      if (!cardLast.trim()) errors.add("cardLast");
      if (!cardNumber.trim()) errors.add("cardNumber");
      if (!cardEmail.trim()) errors.add("cardEmail");
      details = { firstName: cardFirst, lastName: cardLast, cardNumber, email: cardEmail };
    } else if (selectedMethod === "crypto") {
      if (!cryptoWallet.trim()) errors.add("cryptoWallet");
      if (!cryptoEmail.trim()) errors.add("cryptoEmail");
      details = { crypto: selectedCrypto, wallet: cryptoWallet, email: cryptoEmail };
    } else if (selectedMethod === "bank") {
      if (!bankFirst.trim()) errors.add("bankFirst");
      if (!bankLast.trim()) errors.add("bankLast");
      if (!bankEmail.trim()) errors.add("bankEmail");
      if (!bankIban.trim()) errors.add("bankIban");
      if (!bankSwift.trim()) errors.add("bankSwift");
      details = { firstName: bankFirst, lastName: bankLast, email: bankEmail, iban: bankIban, swift: bankSwift };
    }

    if (errors.size > 0) {
      setFieldErrors(errors);
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/cashout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: amountNum, method: selectedMethod, details }),
      });
      const json = await res.json();
      if (json.success) {
        closeModal();
        setCashoutOpen(false);
        setCashoutAmount("");
        setSelectedMethod(null);
        setCardFirst(""); setCardLast(""); setCardNumber(""); setCardEmail("");
        setCryptoWallet(""); setCryptoEmail("");
        setBankFirst(""); setBankLast(""); setBankEmail(""); setBankIban(""); setBankSwift("");
        fetchBalance();
        refreshSession();
        setToast("Withdrawal request submitted!");
        setTimeout(() => setToast(null), 3000);
      }
    } catch {
      /* ignore */
    } finally {
      setSubmitting(false);
    }
  };

  const filteredTx = data
    ? data.transactions.filter((tx) => {
        if (filter === "credit") return tx.type === "CREDIT";
        if (filter === "withdraw") return tx.type === "DEBIT";
        return true;
      })
    : [];

  const fmt = (n: number) =>
    n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const fmtDate = (iso: string) =>
    new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

  const cryptoName = CRYPTO_LIST.find((c) => c.key === selectedCrypto)?.name ?? "Bitcoin";

  if (!sessionLoading && !user) {
    return (
      <main className="bal">
        <div className="container">
          <h1 className="bal-title">{t("title")}</h1>
          <div style={{ textAlign: "center", padding: "60px 0" }}>
            <p style={{ color: "#64748b", marginBottom: 16 }}>Please sign in to view your balance.</p>
            <form action="/api/auth/steam" method="get">
              <button type="submit" className="bal-wallet__cashout">Sign in with Steam</button>
            </form>
          </div>
        </div>
      </main>
    );
  }

  const inputStyle = (field: string): React.CSSProperties | undefined =>
    fieldErrors.has(field) ? { borderColor: "#ef4444" } : undefined;

  return (
    <>
      <main className="bal">
        <div className="container">

          <h1 className="bal-title">{t("title")}</h1>

          {loading ? (
            <div style={{ textAlign: "center", padding: "60px 0", color: "#94a3b8" }}>Loading…</div>
          ) : (
            <>
              {/* ── Wallet card ── */}
              <div className="bal-wallet">
                <div className="bal-wallet__glow" />
                <div className="bal-wallet__main">
                  <div className="bal-wallet__top">
                    <span className="bal-wallet__label">{t("available")}</span>
                    <div className="bal-wallet__icon">
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2"/><path d="M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4"/></svg>
                    </div>
                  </div>
                  <h2 className="bal-wallet__amount">{fmt(balance)}<small>$</small></h2>
                  <div className="bal-wallet__actions">
                    <button type="button" className="bal-wallet__cashout" onClick={handleCashoutToggle}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12l7 7 7-7"/></svg>
                      <span>{t("cashOut")}</span>
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
                      <span className="bal-wstat__label">{t("totalIn")}</span>
                      <span className="bal-wstat__val">{fmt(totalIn)}$</span>
                    </div>
                  </div>
                  <div className="bal-wstat__sep" />
                  <div className="bal-wstat">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12l7 7 7-7"/></svg>
                    <div className="bal-wstat__text">
                      <span className="bal-wstat__label">{t("totalOut")}</span>
                      <span className="bal-wstat__val">{fmt(totalOut)}$</span>
                    </div>
                  </div>
                  <div className="bal-wstat__sep" />
                  <div className="bal-wstat">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                    <div className="bal-wstat__text">
                      <span className="bal-wstat__label">{t("pending")}</span>
                      <span className="bal-wstat__val">{fmt(pending)}$</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* ── Cash Out Form (collapsible) ── */}
              <div ref={cashoutFormRef} className={`bal-cashout${cashoutOpen ? " open" : ""}`}>
                <div className="bal-cashout__head">
                  <h3>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12l7 7 7-7"/></svg>
                    <span>{t("cashOutFunds")}</span>
                  </h3>
                  <button type="button" className="bal-cashout__close" onClick={() => setCashoutOpen(false)}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="18 15 12 9 6 15"/></svg>
                    <span>{t("hideCashout")}</span>
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
                        onChange={(e) => handleAmountChange(e.target.value)}
                      />
                      <span className="cashout-currency">$</span>
                      <button type="button" className="cashout-max" onClick={() => setCashoutAmount(balance.toString())}>MAX</button>
                    </div>
                    <span className="cashout-available"><span>{t("availableShort")}</span>: <strong>{fmt(balance)}$</strong></span>
                  </div>

                  <div className="form-group">
                    <label>{t("selectPayoutMethod")}</label>
                    <div className="bal-methods">
                      {(["card", "crypto", "bank"] as const).map((method) => (
                        <button
                          key={method}
                          type="button"
                          className={`bal-method${selectedMethod === method ? " active" : ""}`}
                          onClick={() => setSelectedMethod(method)}
                        >
                          <div className="bal-method__icon">
                            {method === "card" && <img src="/icons/pay-card.png" alt="Card" width="28" height="28" style={{ objectFit: "contain" }} />}
                            {method === "crypto" && <img src="/icons/tether.png" alt="Crypto" width="28" height="28" style={{ objectFit: "contain" }} />}
                            {method === "bank" && <img src="/icons/pay-bank.png" alt="Bank" width="28" height="28" style={{ objectFit: "contain" }} />}
                          </div>
                          <span className="bal-method__name">
                            {method === "card" && t("methodDebitCard")}
                            {method === "crypto" && t("methodCrypto")}
                            {method === "bank" && t("methodBankTransfer")}
                          </span>
                          <span className="bal-method__desc">
                            {method === "card" && "Visa / Mastercard"}
                            {method === "crypto" && "BTC, USDT, ETH..."}
                            {method === "bank" && "IBAN / SWIFT"}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="bal-summary">
                    <div className="bal-summary__row">
                      <span>{t("withdrawalAmount")}</span>
                      <span>{fmt(amountNum)}$</span>
                    </div>
                    <div className="bal-summary__row">
                      <span>{t("commissionPct")}</span>
                      <span>{fmt(commission)}$</span>
                    </div>
                    <div className="bal-summary__row bal-summary__row--total">
                      <span>{t("youReceive")}</span>
                      <span>{fmt(youReceive)}$</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    className="bal-continue"
                    disabled={!canContinue}
                    onClick={handleContinue}
                  >
                    <span>{t("continue")}</span>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 18 15 12 9 6"/></svg>
                  </button>
                </div>
              </div>

              {/* ── Transaction History ── */}
              <div className="bal-history">
                <div className="bal-history__head">
                  <h3>{t("history")}</h3>
                  <div className="bal-history__filters">
                    {([
                      { key: "all" as FilterType, label: t("filterAll") },
                      { key: "credit" as FilterType, label: t("filterSales") },
                      { key: "withdraw" as FilterType, label: t("filterWithdrawals") },
                    ]).map((f) => (
                      <button
                        key={f.key}
                        type="button"
                        className={`bal-fil${filter === f.key ? " active" : ""}`}
                        onClick={() => setFilter(f.key)}
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="bal-history__table-wrap">
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
                      {filteredTx.length > 0 ? (
                        filteredTx.map((tx) => {
                          const isCredit = tx.type === "CREDIT";
                          const absAmt = Math.abs(parseFloat(tx.amount));
                          return (
                            <tr key={tx.id} className="bal-row" data-type={isCredit ? "credit" : "withdraw"}>
                              <td><span className="bal-row__date">{fmtDate(tx.createdAt)}</span></td>
                              <td><span className="bal-row__desc">{tx.comment ?? "—"}</span></td>
                              <td>
                                <span className={`bal-row__amt ${isCredit ? "bal-row__amt--plus" : "bal-row__amt--minus"}`}>
                                  {isCredit ? "+" : "-"}{fmt(absAmt)}$
                                </span>
                              </td>
                              <td>
                                <span className={`bal-badge ${isCredit ? "bal-badge--credit" : "bal-badge--paid"}`}>
                                  {isCredit ? t("badgeCredit") : t("badgePaid")}
                                </span>
                              </td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td colSpan={4} style={{ textAlign: "center", padding: "32px", color: "#94a3b8" }}>
                            {t("noTransactions")}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

        </div>
      </main>

      {/* ── Withdrawal Modal ── */}
      <div
        className={`wdraw-overlay${modalOpen ? " active" : ""}`}
        onClick={(e) => { if (e.target === e.currentTarget) closeModal(); }}
      >
        <div className="wdraw">
          <div className="wdraw__accent" />
          <div className="wdraw__head">
            <div className="wdraw__head-left">
              <div className="wdraw__head-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12l7 7 7-7"/></svg>
              </div>
              <div>
                <h2 className="wdraw__title">{t("wdrawTitle")}</h2>
                <span className="wdraw__sub">{t("wdrawSub")}</span>
              </div>
            </div>
            <button type="button" className="wdraw__close" onClick={closeModal}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>

          <div className="wdraw__amount">
            <span className="wdraw__amount-label">{t("wdrawAmountLabel")}</span>
            <span className="wdraw__amount-val">{fmt(amountNum)}<small>$</small></span>
            <span className="wdraw__amount-method">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="M2 10h20"/></svg>
              <span> via {selectedMethod ? METHOD_LABELS[selectedMethod] : ""}</span>
            </span>
          </div>

          <div className="wdraw__body">

            {/* CARD fields */}
            {selectedMethod === "card" && (
              <div className="wdraw__fields">
                <div className="wdraw__row">
                  <div className="wdraw__field">
                    <label className="wdraw__label">First Name</label>
                    <div className="wdraw__input-wrap">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                      <input type="text" className="wdraw__input" placeholder="John" value={cardFirst} onChange={(e) => { setCardFirst(e.target.value); clearFieldError("cardFirst"); }} style={inputStyle("cardFirst")} />
                    </div>
                  </div>
                  <div className="wdraw__field">
                    <label className="wdraw__label">Last Name</label>
                    <div className="wdraw__input-wrap">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                      <input type="text" className="wdraw__input" placeholder="Doe" value={cardLast} onChange={(e) => { setCardLast(e.target.value); clearFieldError("cardLast"); }} style={inputStyle("cardLast")} />
                    </div>
                  </div>
                </div>
                <div className="wdraw__field">
                  <label className="wdraw__label">Card Number</label>
                  <div className="wdraw__input-wrap">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="M2 10h20"/></svg>
                    <input type="text" className="wdraw__input" placeholder="4242 4242 4242 4242" maxLength={19} value={cardNumber} onChange={(e) => { setCardNumber(e.target.value); clearFieldError("cardNumber"); }} style={inputStyle("cardNumber")} />
                  </div>
                </div>
                <div className="wdraw__field">
                  <label className="wdraw__label">Email Address</label>
                  <div className="wdraw__input-wrap">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                    <input type="email" className="wdraw__input" placeholder="your@email.com" value={cardEmail} onChange={(e) => { setCardEmail(e.target.value); clearFieldError("cardEmail"); }} style={inputStyle("cardEmail")} />
                  </div>
                </div>
              </div>
            )}

            {/* CRYPTO fields */}
            {selectedMethod === "crypto" && (
              <div className="wdraw__fields">
                <label className="wdraw__label">Select Cryptocurrency</label>
                <div className="wdraw__crypto-grid">
                  {CRYPTO_LIST.map((c) => (
                    <button
                      key={c.key}
                      type="button"
                      className={`wdraw__crypto-btn${selectedCrypto === c.key ? " active" : ""}`}
                      onClick={() => setSelectedCrypto(c.key)}
                    >
                      <img src={`https://cdn.jsdelivr.net/npm/cryptocurrency-icons@0.18.1/svg/color/${c.key}.svg`} alt={c.ticker} width="28" height="28" />
                      <span>{c.name}</span>
                      <small>{c.ticker}</small>
                    </button>
                  ))}
                </div>
                <div className="wdraw__field">
                  <label className="wdraw__label">{cryptoName} Wallet Address</label>
                  <div className="wdraw__input-wrap">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="M2 10h20"/></svg>
                    <input type="text" className="wdraw__input" placeholder={`Enter your ${cryptoName} wallet address`} value={cryptoWallet} onChange={(e) => { setCryptoWallet(e.target.value); clearFieldError("cryptoWallet"); }} style={inputStyle("cryptoWallet")} />
                  </div>
                </div>
                <div className="wdraw__field">
                  <label className="wdraw__label">Email Address</label>
                  <div className="wdraw__input-wrap">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                    <input type="email" className="wdraw__input" placeholder="your@email.com" value={cryptoEmail} onChange={(e) => { setCryptoEmail(e.target.value); clearFieldError("cryptoEmail"); }} style={inputStyle("cryptoEmail")} />
                  </div>
                </div>
              </div>
            )}

            {/* BANK fields */}
            {selectedMethod === "bank" && (
              <div className="wdraw__fields">
                <div className="wdraw__row">
                  <div className="wdraw__field">
                    <label className="wdraw__label">First Name</label>
                    <div className="wdraw__input-wrap">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                      <input type="text" className="wdraw__input" placeholder="John" value={bankFirst} onChange={(e) => { setBankFirst(e.target.value); clearFieldError("bankFirst"); }} style={inputStyle("bankFirst")} />
                    </div>
                  </div>
                  <div className="wdraw__field">
                    <label className="wdraw__label">Last Name</label>
                    <div className="wdraw__input-wrap">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                      <input type="text" className="wdraw__input" placeholder="Doe" value={bankLast} onChange={(e) => { setBankLast(e.target.value); clearFieldError("bankLast"); }} style={inputStyle("bankLast")} />
                    </div>
                  </div>
                </div>
                <div className="wdraw__field">
                  <label className="wdraw__label">Email Address</label>
                  <div className="wdraw__input-wrap">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                    <input type="email" className="wdraw__input" placeholder="your@email.com" value={bankEmail} onChange={(e) => { setBankEmail(e.target.value); clearFieldError("bankEmail"); }} style={inputStyle("bankEmail")} />
                  </div>
                </div>
                <div className="wdraw__field">
                  <label className="wdraw__label">IBAN</label>
                  <div className="wdraw__input-wrap">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/></svg>
                    <input type="text" className="wdraw__input" placeholder="DE89 3704 0044 0532 0130 00" value={bankIban} onChange={(e) => { setBankIban(e.target.value); clearFieldError("bankIban"); }} style={inputStyle("bankIban")} />
                  </div>
                </div>
                <div className="wdraw__field">
                  <label className="wdraw__label">SWIFT / BIC Code</label>
                  <div className="wdraw__input-wrap">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></svg>
                    <input type="text" className="wdraw__input" placeholder="COBADEFFXXX" value={bankSwift} onChange={(e) => { setBankSwift(e.target.value); clearFieldError("bankSwift"); }} style={inputStyle("bankSwift")} />
                  </div>
                </div>
              </div>
            )}

          </div>

          <div className="wdraw__footer">
            <button type="button" className="wdraw__submit" onClick={handleSubmitWithdrawal} disabled={submitting}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
              <span>{t("confirmWithdrawal")}</span>
            </button>
            <span className="wdraw__disclaimer">{t("disclaimer")}</span>
          </div>
        </div>
      </div>

      {/* ── Toast ── */}
      {toast && (
        <div
          style={{
            position: "fixed",
            bottom: 24,
            right: 24,
            zIndex: 9999,
            background: "linear-gradient(135deg,#059669,#10b981)",
            color: "#fff",
            padding: "14px 24px",
            borderRadius: 12,
            fontSize: 14,
            fontWeight: 600,
            display: "flex",
            alignItems: "center",
            gap: 8,
            boxShadow: "0 8px 32px rgba(5,150,105,0.3)",
            animation: "toastIn .3s ease",
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
          {toast}
        </div>
      )}
    </>
  );
}
