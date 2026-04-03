"use client";

import * as React from "react";
import { Suspense } from "react";
import { SessionProvider } from "./session-provider";
import { CurrencyProvider } from "./currency-provider";
import { ReferralQuerySync } from "./referral-query-sync";

export interface ProvidersProps {
  children: React.ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <SessionProvider>
      <CurrencyProvider>
        <Suspense fallback={null}>
          <ReferralQuerySync />
        </Suspense>
        {children}
      </CurrencyProvider>
    </SessionProvider>
  );
}
