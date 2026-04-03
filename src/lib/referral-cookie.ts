import type { NextResponse } from "next/server";
import { cookieSecure } from "./cookie-secure";

/** Имя cookie — то же, что читает `/api/auth/callback`. */
export const REFERRAL_COOKIE_NAME = "referral_code";

/** 30 дней — типичный срок атрибуции реферала. */
export const REFERRAL_COOKIE_MAX_AGE = 60 * 60 * 24 * 30;

const CODE_RE = /^[a-zA-Z0-9_-]{1,64}$/;

/** Безопасное значение из query `?ref=` (как в БД `Referral.code`). */
export function parseReferralCodeFromUrl(url: URL): string | null {
  const raw = url.searchParams.get("ref")?.trim();
  if (!raw || !CODE_RE.test(raw)) return null;
  return raw;
}

export function setReferralCookieOnResponse(res: NextResponse, code: string) {
  res.cookies.set(REFERRAL_COOKIE_NAME, code, {
    path: "/",
    maxAge: REFERRAL_COOKIE_MAX_AGE,
    sameSite: "lax",
    secure: cookieSecure(),
    httpOnly: true,
  });
}

export function clearReferralCookieOnResponse(res: NextResponse) {
  res.cookies.set(REFERRAL_COOKIE_NAME, "", {
    path: "/",
    maxAge: 0,
    sameSite: "lax",
    secure: cookieSecure(),
    httpOnly: true,
  });
}

/** Значение из cookie / query перед поиском в БД. */
export function normalizeReferralCodeInput(
  raw: string | undefined | null,
): string | undefined {
  if (raw == null || raw === "") return undefined;
  let s = raw.trim();
  try {
    s = decodeURIComponent(s);
  } catch {
    return undefined;
  }
  s = s.trim();
  if (!CODE_RE.test(s)) return undefined;
  return s;
}
