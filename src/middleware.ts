import createIntlMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";
import {
  parseReferralCodeFromUrl,
  setReferralCookieOnResponse,
} from "./lib/referral-cookie";
import { NextRequest, NextResponse } from "next/server";

const intlMiddleware = createIntlMiddleware(routing);

const MOBILE_UA_RE =
  /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile|mobile/i;

const LOCALE_COOKIE = "NEXT_LOCALE";

/**
 * Первый визит без cookie: не подбираем язык по Accept-Language (всегда default en).
 * После смены языка в UI next-intl ставит NEXT_LOCALE — тогда cookie и дальше задаёт локаль.
 */
function requestForLocaleDetection(request: NextRequest) {
  const raw = request.cookies.get(LOCALE_COOKIE)?.value;
  if (raw && routing.locales.includes(raw as (typeof routing.locales)[number])) {
    return request;
  }
  const headers = new Headers(request.headers);
  headers.delete("accept-language");
  return new NextRequest(request, { headers });
}

function applyReferralCookie(request: NextRequest, response: NextResponse) {
  const code = parseReferralCodeFromUrl(request.nextUrl);
  if (code) {
    setReferralCookieOnResponse(response, code);
  }
  return response;
}

export default function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasLocale = /^\/(en|ru)(\/|$)/.test(pathname);

  if (!hasLocale) {
    const ua = request.headers.get("user-agent") || "";
    if (MOBILE_UA_RE.test(ua)) {
      const url = request.nextUrl.clone();
      url.pathname = `/en${pathname === "/" ? "" : pathname}`;
      const res = NextResponse.redirect(url);
      return applyReferralCookie(request, res);
    }
  }

  const res = intlMiddleware(requestForLocaleDetection(request));
  return applyReferralCookie(request, res);
}

export const config = {
  matcher: ["/((?!api|_next|admin|referral|.*\\..*).*)"],
};
