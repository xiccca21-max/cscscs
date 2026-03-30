import createIntlMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";
import { NextRequest } from "next/server";

const intlMiddleware = createIntlMiddleware(routing);

const MOBILE_UA_RE =
  /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile|mobile/i;

export default function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasLocale = /^\/(en|ru)(\/|$)/.test(pathname);

  if (!hasLocale) {
    const ua = request.headers.get("user-agent") || "";
    if (MOBILE_UA_RE.test(ua)) {
      const url = request.nextUrl.clone();
      url.pathname = `/en${pathname === "/" ? "" : pathname}`;
      return intlMiddleware(
        new NextRequest(url, {
          headers: request.headers,
          method: request.method,
        }),
      );
    }
  }

  return intlMiddleware(request);
}

export const config = {
  matcher: ["/((?!api|_next|admin|referral|.*\\..*).*)"],
};
