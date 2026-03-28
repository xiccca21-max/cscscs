"use client";

import { createContext, useContext, useState, useEffect, useCallback, useMemo, type ReactNode } from "react";

export type CurrencyCode = "USD" | "EUR" | "RUB";

const DEFAULT_RUB_RATE = 92;
const DEFAULT_EUR_RATE = 0.92;

interface CurrencyCtx {
  currency: string;
  symbol: string;
  setCurrency: (c: string) => void;
  convert: (usd: number) => number;
  format: (usd: number) => string;
  formatParts: (usd: number) => { whole: string; cents: string; symbol: string };
}

const CurrencyContext = createContext<CurrencyCtx>({
  currency: "USD",
  symbol: "$",
  setCurrency: () => {},
  convert: (v) => v,
  format: (v) => `${v.toFixed(2)}$`,
  formatParts: (v) => ({ whole: Math.floor(v).toString(), cents: "00", symbol: "$" }),
});

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [currency, setCurrencyState] = useState("USD");
  const [rubRate, setRubRate] = useState(DEFAULT_RUB_RATE);
  const [eurRate, setEurRate] = useState(DEFAULT_EUR_RATE);

  useEffect(() => {
    const saved = localStorage.getItem("sw_currency");
    if (saved && ["USD", "EUR", "RUB"].includes(saved)) setCurrencyState(saved);

    fetch("/api/settings/exchange-rate")
      .then((r) => r.json())
      .then((d) => {
        if (d?.data?.rub && d.data.rub > 0) setRubRate(d.data.rub);
        if (d?.data?.eur && d.data.eur > 0) setEurRate(d.data.eur);
      })
      .catch(() => {});
  }, []);

  const rates = useMemo<Record<string, { symbol: string; rate: number }>>(() => ({
    USD: { symbol: "$", rate: 1 },
    EUR: { symbol: "€", rate: eurRate },
    RUB: { symbol: "₽", rate: rubRate },
  }), [rubRate, eurRate]);

  const setCurrency = useCallback((c: string) => {
    if (!rates[c]) return;
    setCurrencyState(c);
    localStorage.setItem("sw_currency", c);
  }, [rates]);

  const { symbol, rate } = rates[currency] ?? rates.USD;

  const convert = useCallback((usd: number) => +(usd * rate).toFixed(2), [rate]);

  const format = useCallback(
    (usd: number) => {
      const val = (usd * rate).toFixed(2);
      return `${val}${symbol}`;
    },
    [rate, symbol],
  );

  const formatParts = useCallback(
    (usd: number) => {
      const val = (usd * rate).toFixed(2);
      const [whole, cents] = val.split(".");
      return { whole, cents, symbol };
    },
    [rate, symbol],
  );

  return (
    <CurrencyContext.Provider value={{ currency, symbol, setCurrency, convert, format, formatParts }}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  return useContext(CurrencyContext);
}
