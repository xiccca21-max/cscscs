"use client";

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";

export type CurrencyCode = "USD" | "EUR" | "RUB";

const RATES: Record<string, { symbol: string; rate: number }> = {
  USD: { symbol: "$", rate: 1 },
  EUR: { symbol: "€", rate: 0.92 },
  RUB: { symbol: "₽", rate: 92 },
};

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

  useEffect(() => {
    const saved = localStorage.getItem("sw_currency");
    if (saved && RATES[saved]) setCurrencyState(saved);
  }, []);

  const setCurrency = useCallback((c: string) => {
    if (!RATES[c]) return;
    setCurrencyState(c);
    localStorage.setItem("sw_currency", c);
  }, []);

  const { symbol, rate } = RATES[currency] ?? RATES.USD;

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
