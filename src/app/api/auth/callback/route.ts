import { db } from "@/lib/db";
import { sessionOptions, type SessionData } from "@/lib/auth";
import { getSteamProfile, verifySteamLogin } from "@/lib/steam";
import { sealData } from "iron-session";
import { serialize } from "cookie";
import { NextRequest, NextResponse } from "next/server";

const SESSION_TTL = 14 * 24 * 3600;

function buildSessionCookie(sealed: string): string {
  return serialize(sessionOptions.cookieName, sealed, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_TTL,
  });
}

function htmlRedirect(url: string, setCookie: string): NextResponse {
  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><meta http-equiv="refresh" content="0;url=${url}"><title>Redirecting…</title></head><body><script>window.location.replace(${JSON.stringify(url)})</script></body></html>`;
  return new NextResponse(html, {
    status: 200,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Set-Cookie": setCookie,
      "Cache-Control": "no-store",
    },
  });
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const steamId = await verifySteamLogin(searchParams);
    if (!steamId) {
      return NextResponse.redirect(
        new URL("/?error=auth_failed", request.url),
      );
    }

    const profile = await getSteamProfile(steamId);
    if (!profile) {
      return NextResponse.redirect(
        new URL("/?error=auth_failed", request.url),
      );
    }

    const existing = await db.user.findUnique({ where: { steamId } });
    const user = await db.user.upsert({
      where: { steamId },
      create: {
        steamId,
        steamLogin: profile.personaName,
        steamAvatar: profile.avatar,
      },
      update: {
        steamLogin: profile.personaName,
        steamAvatar: profile.avatar,
      },
    });

    if (user.status === "BLOCKED") {
      return NextResponse.redirect(
        new URL("/?error=account_blocked", request.url),
      );
    }

    const referralCode =
      request.cookies.get("referral_code")?.value ||
      searchParams.get("ref") ||
      undefined;

    if (referralCode && !existing?.referralId) {
      const referral = await db.referral.findFirst({
        where: { code: referralCode, isActive: true },
      });
      if (referral) {
        await db.user.update({
          where: { id: user.id },
          data: { referralId: referral.id },
        });
      }
    }

    const adminSteamIds = (process.env.ADMIN_STEAM_IDS ?? "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    const sessionPayload: SessionData = {
      userId: user.id,
      steamId: user.steamId,
      steamLogin: user.steamLogin,
      steamAvatar: user.steamAvatar ?? undefined,
      isAdmin: adminSteamIds.includes(user.steamId),
    };

    const sealed = await sealData(sessionPayload, {
      password: sessionOptions.password as string,
      ttl: SESSION_TTL,
    });

    const savedLocale = user.locale || "en";
    const validLocales = ["en", "ru"];
    const locale = validLocales.includes(savedLocale) ? savedLocale : "en";
    const target = new URL(`/${locale}`, request.url).toString();

    return htmlRedirect(target, buildSessionCookie(sealed));
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.redirect(
      new URL(
        `/?error=${encodeURIComponent(message)}`,
        request.url,
      ),
    );
  }
}
