import { db } from "@/lib/db";
import { sessionOptions, type SessionData } from "@/lib/auth";
import { getSteamProfile, verifySteamLogin } from "@/lib/steam";
import { getIronSession } from "iron-session";
import { NextRequest, NextResponse } from "next/server";

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

    const savedLocale = user.locale || "en";
    const validLocales = ["en", "ru"];
    const locale = validLocales.includes(savedLocale) ? savedLocale : "en";
    const response = NextResponse.redirect(new URL(`/${locale}`, request.url));

    const session = await getIronSession<SessionData>(response.cookies, sessionOptions);
    session.userId = user.id;
    session.steamId = user.steamId;
    session.steamLogin = user.steamLogin;
    session.steamAvatar = user.steamAvatar ?? undefined;
    const adminSteamIds = (process.env.ADMIN_STEAM_IDS ?? "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    session.isAdmin = adminSteamIds.includes(user.steamId);
    await session.save();

    return response;
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
