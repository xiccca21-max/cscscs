"use client";

import * as React from "react";
import { SessionProvider } from "./session-provider";
import { CurrencyProvider } from "./currency-provider";

export interface ProvidersProps {
  children: React.ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <SessionProvider>
      <CurrencyProvider>{children}</CurrencyProvider>
    </SessionProvider>
  );
}
