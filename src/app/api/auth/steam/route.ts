import { getSteamLoginUrl } from "@/lib/steam";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL;
    if (!baseUrl) {
      return NextResponse.json(
        { success: false, error: "NEXT_PUBLIC_APP_URL is not configured" },
        { status: 500 },
      );
    }
    const callbackUrl = `${baseUrl.replace(/\/$/, "")}/api/auth/callback`;
    const loginUrl = getSteamLoginUrl(callbackUrl);
    return NextResponse.redirect(loginUrl);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
