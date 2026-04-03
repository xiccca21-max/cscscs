"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
  cashoutRequestId: string | null;
  cashoutStatus: string | null;
  createdAt: string;
};

type BalanceData = {
  balance: string;
  transactions: Transaction[];
};

type FilterType = "all" | "credit" | "withdraw";

type PaymentMethodDB = {
  id: string;
  name: string;
  type: string;
  commission: string;
  minAmount: string;
  currencies: string[];
};

const PAYPAL_EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const ALIPAY_ACCOUNT_RE = /^([^\s@]+@[^\s@]+\.[^\s@]+|\+?\d{8,20})$/;

const CASHOUT_ICONS: Record<string, string> = {
  card:         "/icons/pay-card.png",
  paypal:       "/icons/pay-paypal.svg",
  alipay:       "/icons/pay-alipay.svg",
  crypto:       "/icons/pay-crypto.png",
  btc:          "/icons/crypto-btc.svg",
  "usdt-trc20": "/icons/crypto-usdt.svg",
  "usdt-erc20": "/icons/crypto-usdt.svg",
  eth:          "/icons/crypto-eth.svg",
  ltc:          "/icons/crypto-ltc.svg",
  bank:         "/icons/pay-bank.png",
  sbp:          "/icons/pay-bank.png",
  other:        "/icons/pay-balance.png",
};

const CRYPTO_TYPES = new Set(["crypto", "btc", "usdt-trc20", "usdt-erc20", "eth", "ltc"]);

/** Показываем в сетке, если в ответе API ещё нет строки type=paypal (как на /sell). */
const PAYPAL_UI_FALLBACK: PaymentMethodDB = {
  id: "__paypal_ui",
  name: "PayPal",
  type: "paypal",
  commission: "2.5",
  minAmount: "1",
  currencies: ["USD", "EUR", "RUB"],
};

const ALIPAY_UI_FALLBACK: PaymentMethodDB = {
  id: "__alipay_ui",
  name: "Alipay",
  type: "alipay",
  commission: "2.5",
  minAmount: "1",
  currencies: ["USD", "EUR", "CNY", "HKD"],
};

const CRYPTO_NETWORKS = [
  { val: "BTC", label: "Bitcoin", tag: "BTC", color: "#f7931a" },
  { val: "ETH", label: "Ethereum", tag: "ERC-20", color: "#627eea" },
  { val: "USDT-TRC20", label: "USDT", tag: "TRC-20", color: "#26a17b" },
  { val: "USDT-ERC20", label: "USDT", tag: "ERC-20", color: "#26a17b" },
  { val: "LTC", label: "Litecoin", tag: "LTC", color: "#bfbbbb" },
];

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
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethodDB[]>([]);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [payDetails, setPayDetails] = useState<Record<string, string>>({});
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [cryptoDropOpen, setCryptoDropOpen] = useState(false);
  const cryptoDropRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    fetch("/api/payment-methods")
      .then((r) => r.json())
      .then((json) => {
        if (json.success) setPaymentMethods(json.data);
      })
      .catch(() => {});
  }, []);

  const cashoutMethods = paymentMethods.filter((m) => m.type !== "balance");
  const mainCashoutMethods = cashoutMethods.filter((m) => !CRYPTO_TYPES.has(m.type));
  /** PayPal / Alipay в сетке, если в ответе API ещё нет строки с этим type (как на /sell). */
  const mainCashoutMethodsDisplay = useMemo(() => {
    let next = [...mainCashoutMethods];
    if (!next.some((m) => m.type === "paypal")) {
      const afterCard = next.findIndex((m) => m.type === "card");
      if (afterCard >= 0) next.splice(afterCard + 1, 0, PAYPAL_UI_FALLBACK);
      else next.unshift(PAYPAL_UI_FALLBACK);
    }
    if (!next.some((m) => m.type === "alipay")) {
      const paypalIdx = next.findIndex((m) => m.type === "paypal");
      if (paypalIdx >= 0) next.splice(paypalIdx + 1, 0, ALIPAY_UI_FALLBACK);
      else {
        const afterCard = next.findIndex((m) => m.type === "card");
        if (afterCard >= 0) next.splice(afterCard + 1, 0, ALIPAY_UI_FALLBACK);
        else next.unshift(ALIPAY_UI_FALLBACK);
      }
    }
    return next;
  }, [mainCashoutMethods]);
  const cryptoMethods = cashoutMethods.filter((m) => CRYPTO_TYPES.has(m.type));
  const hasCrypto = cryptoMethods.length > 0;

  useEffect(() => {
    if (cashoutMethod == null) return;
    const isCryptoFamily =
      cashoutMethod === "crypto" || CRYPTO_TYPES.has(cashoutMethod);
    if (isCryptoFamily && !hasCrypto) {
      const next =
        mainCashoutMethodsDisplay[0]?.type ??
        mainCashoutMethods[0]?.type ??
        "card";
      setCashoutMethod(next);
      setCryptoDropOpen(false);
      return;
    }
    if (isCryptoFamily && hasCrypto && cashoutMethod !== "crypto") {
      const still = cryptoMethods.some((m) => m.type === cashoutMethod);
      if (!still) {
        setCashoutMethod("crypto");
        setPayDetails((prev) => ({ ...prev, network: "" }));
      }
    }
  }, [
    hasCrypto,
    cashoutMethod,
    cryptoMethods,
    mainCashoutMethodsDisplay,
    mainCashoutMethods,
  ]);

  useEffect(() => {
    if (!cryptoDropOpen) return;
    const handler = (e: Event) => {
      if (cryptoDropRef.current && !cryptoDropRef.current.contains(e.target as Node)) setCryptoDropOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [cryptoDropOpen]);

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
  const selectedPM = paymentMethods.find((m) => m.type === cashoutMethod || m.id === cashoutMethod);
  const commissionRate = useMemo(() => {
    if (selectedPM) return parseFloat(selectedPM.commission) / 100;
    if (cashoutMethod === "card") return 0.025;
    if (cashoutMethod === "paypal") return 0.025;
    if (cashoutMethod === "alipay") return 0.025;
    if (cashoutMethod === "bank") return 0.03;
    if (cashoutMethod === "crypto") return 0.01;
    return 0;
  }, [selectedPM, cashoutMethod]);
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

  const validateDetails = useCallback((): boolean => {
    const errs: Record<string, string> = {};
    const req = (key: string, label: string) => {
      if (!payDetails[key]?.trim()) errs[key] = `${label} required`;
    };
    if (cashoutMethod === "card") {
      req("cardNumber", "Card number");
      req("cardName", "Cardholder name");
    } else if (cashoutMethod === "crypto") {
      if (!payDetails.network) errs.network = "Select a network";
      req("walletAddress", "Wallet address");
    } else if (cashoutMethod === "bank") {
      req("iban", "IBAN");
      req("swift", "SWIFT / BIC");
      req("recipientName", "Recipient name");
    } else if (cashoutMethod === "paypal") {
      const em = payDetails.paypalEmail?.trim() ?? "";
      if (!em) errs.paypalEmail = t("paypalEmailRequired");
      else if (!PAYPAL_EMAIL_RE.test(em)) errs.paypalEmail = t("paypalEmailInvalid");
    } else if (cashoutMethod === "alipay") {
      const ac = payDetails.alipayAccount?.trim() ?? "";
      if (!ac) errs.alipayAccount = t("alipayAccountRequired");
      else if (!ALIPAY_ACCOUNT_RE.test(ac)) errs.alipayAccount = t("alipayAccountInvalid");
    }
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  }, [cashoutMethod, payDetails, t]);

  const openDetailsModal = () => {
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
    if (selectedPM) {
      const minAmt = parseFloat(selectedPM.minAmount);
      if (minAmt > 0 && amount < minAmt) {
        setCashoutError(`${t("methodMin")}: ${minAmt}$`);
        return;
      }
    } else if (cashoutMethod === "paypal") {
      const minAmt = parseFloat(PAYPAL_UI_FALLBACK.minAmount);
      if (minAmt > 0 && amount < minAmt) {
        setCashoutError(`${t("methodMin")}: ${minAmt}$`);
        return;
      }
    } else if (cashoutMethod === "alipay") {
      const minAmt = parseFloat(ALIPAY_UI_FALLBACK.minAmount);
      if (minAmt > 0 && amount < minAmt) {
        setCashoutError(`${t("methodMin")}: ${minAmt}$`);
        return;
      }
    }
    setCashoutError(null);
    setPayDetails({});
    setFieldErrors({});
    setDetailsModalOpen(true);
  };

  const handleCashout = async () => {
    if (!validateDetails()) return;

    setSubmitting(true);
    setCashoutError(null);

    const amount = parseFloat(cashoutAmount);
    try {
      const res = await fetch("/api/cashout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount,
          paymentMethod: cashoutMethod,
          currency: "USD",
          paymentDetails: payDetails,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setDetailsModalOpen(false);
        setCashoutOpen(false);
        setCashoutAmount("");
        setCashoutMethod(null);
        setPayDetails({});
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
        if (filter === "withdraw") return tx.type === "FREEZE" || tx.type === "DEBIT";
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
                  <div className="bal-pay-grid">
                    {mainCashoutMethodsDisplay.map((pm) => {
                      const icon = CASHOUT_ICONS[pm.type] ?? CASHOUT_ICONS.other;
                      return (
                        <button
                          key={pm.id}
                          type="button"
                          data-method={pm.type}
                          className={`bal-pay-btn${cashoutMethod === pm.type ? " active" : ""}`}
                          onClick={() => setCashoutMethod(pm.type)}
                        >
                          <span className="bal-pay-btn__icon">
                            <img src={icon} alt="" width="24" height="24" />
                          </span>
                          <span className="bal-pay-btn__name">{pm.name}</span>
                        </button>
                      );
                    })}
                    {hasCrypto && (
                      <button
                        type="button"
                        data-method="crypto"
                        className={`bal-pay-btn${cashoutMethod === "crypto" ? " active" : ""}`}
                        onClick={() => setCashoutMethod("crypto")}
                      >
                        <span className="bal-pay-btn__icon">
                          <img src="/icons/pay-crypto.png" alt="Crypto" width="24" height="24" />
                        </span>
                        <span className="bal-pay-btn__name">Crypto</span>
                      </button>
                    )}
                    {mainCashoutMethods.length === 0 && !hasCrypto && (
                      <>
                        <button type="button" data-method="card" className={`bal-pay-btn${cashoutMethod === "card" ? " active" : ""}`} onClick={() => setCashoutMethod("card")}>
                          <span className="bal-pay-btn__icon"><img src="/icons/pay-card.png" alt="" width="24" height="24" /></span>
                          <span className="bal-pay-btn__name">{t("debitCard")}</span>
                        </button>
                        <button type="button" data-method="paypal" className={`bal-pay-btn${cashoutMethod === "paypal" ? " active" : ""}`} onClick={() => setCashoutMethod("paypal")}>
                          <span className="bal-pay-btn__icon"><img src="/icons/pay-paypal.svg" alt="" width="24" height="24" /></span>
                          <span className="bal-pay-btn__name">{t("payPal")}</span>
                        </button>
                        <button type="button" data-method="alipay" className={`bal-pay-btn${cashoutMethod === "alipay" ? " active" : ""}`} onClick={() => setCashoutMethod("alipay")}>
                          <span className="bal-pay-btn__icon"><img src="/icons/pay-alipay.svg" alt="" width="24" height="24" /></span>
                          <span className="bal-pay-btn__name">{t("payAlipay")}</span>
                        </button>
                        <button type="button" data-method="bank" className={`bal-pay-btn${cashoutMethod === "bank" ? " active" : ""}`} onClick={() => setCashoutMethod("bank")}>
                          <span className="bal-pay-btn__icon"><img src="/icons/pay-bank.png" alt="" width="24" height="24" /></span>
                          <span className="bal-pay-btn__name">{t("bankTransfer")}</span>
                        </button>
                      </>
                    )}
                  </div>
                  {selectedPM && (
                    <div className="bal-pay-info">
                      <span>{t("methodMin")}: <strong>{parseFloat(selectedPM.minAmount) > 0 ? `${parseFloat(selectedPM.minAmount)}$` : "0$"}</strong></span>
                      <span>{t("methodFee")}: <strong>{parseFloat(selectedPM.commission) > 0 ? `${parseFloat(selectedPM.commission)}%` : "0%"}</strong></span>
                    </div>
                  )}
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
                  onClick={openDetailsModal}
                >
                  <span>{t("submit")}</span>
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
                                {tx.cashoutRequestId
                                  ? <>{t("withdrawal")} - <strong>#{tx.cashoutRequestId.slice(0, 8).toUpperCase()}</strong></>
                                  : tx.type === "CREDIT"
                                    ? <>{t("credit")} - <strong>#{tx.id.slice(0, 8).toUpperCase()}</strong></>
                                    : <>{t("withdrawal")} - <strong>{t("payout")}</strong></>
                                }
                              </span>
                            </span>
                          </td>
                          <td>
                            <span className={`bal-row__amt ${tx.type === "CREDIT" || tx.type === "UNFREEZE" ? "bal-row__amt--plus" : "bal-row__amt--minus"}`}>
                              {tx.type === "CREDIT" || tx.type === "UNFREEZE" ? "+" : "-"}{Math.abs(parseFloat(tx.amount)).toFixed(2)}$
                            </span>
                          </td>
                          <td>
                            {tx.cashoutStatus ? (
                              <span className={`bal-badge bal-badge--${tx.cashoutStatus === "PAID" ? "paid" : tx.cashoutStatus === "REJECTED" ? "cancelled" : "credit"}`}>
                                {tx.cashoutStatus === "CREATED" ? t("statusCreated") :
                                 tx.cashoutStatus === "PAID" ? t("paid") :
                                 tx.cashoutStatus === "REJECTED" ? t("statusCancelled") :
                                 tx.cashoutStatus}
                              </span>
                            ) : (
                              <span className={`bal-badge ${tx.type === "CREDIT" || tx.type === "UNFREEZE" ? "bal-badge--credit" : "bal-badge--paid"}`}>
                                {tx.type === "CREDIT" ? t("credit") :
                                 tx.type === "UNFREEZE" ? t("statusCancelled") :
                                 tx.type === "FREEZE" ? t("statusCreated") :
                                 t("paid")}
                              </span>
                            )}
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

      {/* Payment Details Modal */}
      {detailsModalOpen && (
        <div className="bal-modal-overlay" onClick={() => setDetailsModalOpen(false)}>
          <div className="bal-modal" onClick={(e) => e.stopPropagation()}>
            <button className="bal-modal__close" onClick={() => setDetailsModalOpen(false)}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
            <h3 className="bal-modal__title">{t("paymentDetails")}</h3>
            <p className="bal-modal__subtitle">
              {cashoutMethod === "card"
                ? t("debitCard")
                : cashoutMethod === "paypal"
                  ? t("payPal")
                  : cashoutMethod === "alipay"
                    ? t("payAlipay")
                    : cashoutMethod === "crypto"
                      ? "Crypto"
                      : t("bankTransfer")}
              {" · "}
              {cashoutAmountNum.toFixed(2)}$
            </p>

            <div className="bal-modal__fields">
              {cashoutMethod === "card" && (
                <>
                  <label className={`bal-modal__field${fieldErrors.cardNumber ? " has-error" : ""}`}>
                    <span>{t("cardNumber")}</span>
                    <input type="text" placeholder="0000 0000 0000 0000" value={payDetails.cardNumber ?? ""} onChange={(e) => setPayDetails((p) => ({ ...p, cardNumber: e.target.value }))} />
                    {fieldErrors.cardNumber && <span className="bal-modal__err">{fieldErrors.cardNumber}</span>}
                  </label>
                  <label className={`bal-modal__field${fieldErrors.cardName ? " has-error" : ""}`}>
                    <span>{t("cardholderName")}</span>
                    <input type="text" placeholder="John Doe" value={payDetails.cardName ?? ""} onChange={(e) => setPayDetails((p) => ({ ...p, cardName: e.target.value }))} />
                    {fieldErrors.cardName && <span className="bal-modal__err">{fieldErrors.cardName}</span>}
                  </label>
                </>
              )}

              {cashoutMethod === "paypal" && (
                <>
                  <label className={`bal-modal__field${fieldErrors.paypalEmail ? " has-error" : ""}`}>
                    <span>{t("paypalEmail")}</span>
                    <input
                      type="email"
                      autoComplete="email"
                      placeholder="you@example.com"
                      value={payDetails.paypalEmail ?? ""}
                      onChange={(e) => {
                        setPayDetails((p) => ({ ...p, paypalEmail: e.target.value }));
                        setFieldErrors((fe) => {
                          const n = { ...fe };
                          delete n.paypalEmail;
                          return n;
                        });
                      }}
                    />
                    {fieldErrors.paypalEmail && <span className="bal-modal__err">{fieldErrors.paypalEmail}</span>}
                  </label>
                  <p className="bal-modal__hint">{t("paypalHint")}</p>
                </>
              )}

              {cashoutMethod === "alipay" && (
                <>
                  <label className={`bal-modal__field${fieldErrors.alipayAccount ? " has-error" : ""}`}>
                    <span>{t("alipayAccount")}</span>
                    <input
                      type="text"
                      autoComplete="email"
                      placeholder="email or phone"
                      value={payDetails.alipayAccount ?? ""}
                      onChange={(e) => {
                        setPayDetails((p) => ({ ...p, alipayAccount: e.target.value }));
                        setFieldErrors((fe) => {
                          const n = { ...fe };
                          delete n.alipayAccount;
                          return n;
                        });
                      }}
                    />
                    {fieldErrors.alipayAccount && <span className="bal-modal__err">{fieldErrors.alipayAccount}</span>}
                  </label>
                  <p className="bal-modal__hint">{t("alipayHint")}</p>
                </>
              )}

              {cashoutMethod === "crypto" && (
                <>
                  <label className={`bal-modal__field${fieldErrors.network ? " has-error" : ""}`}>
                    <span>{t("selectNetwork")}</span>
                    <div className="bal-crypto-drop" ref={cryptoDropRef}>
                      <button type="button" className="bal-crypto-drop__btn" onClick={() => setCryptoDropOpen(!cryptoDropOpen)}>
                        {payDetails.network ? (
                          <span>{CRYPTO_NETWORKS.find((n) => n.val === payDetails.network)?.label} ({CRYPTO_NETWORKS.find((n) => n.val === payDetails.network)?.tag})</span>
                        ) : (
                          <span style={{ opacity: 0.5 }}>Select network...</span>
                        )}
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ transform: cryptoDropOpen ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}><polyline points="6 9 12 15 18 9"/></svg>
                      </button>
                      {cryptoDropOpen && (
                        <div className="bal-crypto-drop__list">
                          {CRYPTO_NETWORKS.map((n) => (
                            <button key={n.val} type="button" className={`bal-crypto-drop__opt${payDetails.network === n.val ? " active" : ""}`} onClick={() => { setPayDetails((p) => ({ ...p, network: n.val })); setCryptoDropOpen(false); setFieldErrors((e) => { const ne = { ...e }; delete ne.network; return ne; }); }}>
                              <span className="bal-crypto-drop__dot" style={{ background: n.color }} />
                              <span>{n.label}</span>
                              <span className="bal-crypto-drop__tag">{n.tag}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    {fieldErrors.network && <span className="bal-modal__err">{fieldErrors.network}</span>}
                  </label>
                  <label className={`bal-modal__field${fieldErrors.walletAddress ? " has-error" : ""}`}>
                    <span>{t("walletAddress")}</span>
                    <input type="text" placeholder="Wallet address" value={payDetails.walletAddress ?? ""} onChange={(e) => setPayDetails((p) => ({ ...p, walletAddress: e.target.value }))} />
                    {fieldErrors.walletAddress && <span className="bal-modal__err">{fieldErrors.walletAddress}</span>}
                  </label>
                </>
              )}

              {cashoutMethod === "bank" && (
                <>
                  <label className={`bal-modal__field${fieldErrors.iban ? " has-error" : ""}`}>
                    <span>IBAN</span>
                    <input type="text" placeholder="IBAN" value={payDetails.iban ?? ""} onChange={(e) => setPayDetails((p) => ({ ...p, iban: e.target.value }))} />
                    {fieldErrors.iban && <span className="bal-modal__err">{fieldErrors.iban}</span>}
                  </label>
                  <label className={`bal-modal__field${fieldErrors.swift ? " has-error" : ""}`}>
                    <span>SWIFT / BIC</span>
                    <input type="text" placeholder="SWIFT / BIC" value={payDetails.swift ?? ""} onChange={(e) => setPayDetails((p) => ({ ...p, swift: e.target.value }))} />
                    {fieldErrors.swift && <span className="bal-modal__err">{fieldErrors.swift}</span>}
                  </label>
                  <label className={`bal-modal__field${fieldErrors.recipientName ? " has-error" : ""}`}>
                    <span>{t("recipientName")}</span>
                    <input type="text" placeholder="Recipient name" value={payDetails.recipientName ?? ""} onChange={(e) => setPayDetails((p) => ({ ...p, recipientName: e.target.value }))} />
                    {fieldErrors.recipientName && <span className="bal-modal__err">{fieldErrors.recipientName}</span>}
                  </label>
                </>
              )}
            </div>

            {cashoutError && (
              <p style={{ color: "#ef4444", fontSize: 13, fontWeight: 600, marginTop: 8 }}>{cashoutError}</p>
            )}

            <button className="bal-modal__submit" disabled={submitting} onClick={handleCashout}>
              {submitting ? "Processing..." : t("confirmWithdraw")}
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
