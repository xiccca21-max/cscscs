import {
  normalizeReferralCodeInput,
  setReferralCookieOnResponse,
} from "@/lib/referral-cookie";
import { NextRequest, NextResponse } from "next/server";

/**
 * Дублирует установку cookie из middleware для client-side навигации и гидрации.
 * POST { "code": "..." } — то же ограничение формата, что у ?ref=.
 */
export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, error: "Invalid JSON" }, { status: 400 });
  }
  const raw =
    typeof body === "object" &&
    body !== null &&
    "code" in body &&
    typeof (body as { code: unknown }).code === "string"
      ? (body as { code: string }).code
      : null;
  const code = normalizeReferralCodeInput(raw ?? undefined);
  if (!code) {
    return NextResponse.json({ success: false, error: "Invalid code" }, { status: 400 });
  }
  const res = NextResponse.json({ success: true });
  setReferralCookieOnResponse(res, code);
  return res;
}
