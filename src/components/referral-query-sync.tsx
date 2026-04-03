"use client";

import { normalizeReferralCodeInput } from "@/lib/referral-cookie";
import { useSearchParams } from "next/navigation";
import { useEffect, useRef } from "react";

/**
 * Резервно фиксирует ?ref= в httpOnly cookie (основная установка — middleware).
 */
export function ReferralQuerySync() {
  const searchParams = useSearchParams();
  const lastSent = useRef<string | null>(null);

  useEffect(() => {
    const raw = searchParams.get("ref")?.trim();
    const code = normalizeReferralCodeInput(raw ?? undefined);
    if (!code || code === lastSent.current) return;
    lastSent.current = code;
    fetch("/api/referral/cookie", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code }),
      credentials: "same-origin",
    }).catch(() => {
      lastSent.current = null;
    });
  }, [searchParams]);

  return null;
}
