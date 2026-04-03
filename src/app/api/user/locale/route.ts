import { requireAuth } from "@/lib/auth";
import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

const VALID = new Set(["en", "ru"]);

export async function PATCH(request: NextRequest) {
  try {
    const session = await requireAuth();
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ success: false, error: "Invalid JSON" }, { status: 400 });
    }
    const locale =
      typeof body === "object" &&
      body !== null &&
      "locale" in body &&
      typeof (body as { locale: unknown }).locale === "string"
        ? (body as { locale: string }).locale
        : null;
    if (!locale || !VALID.has(locale)) {
      return NextResponse.json({ success: false, error: "locale must be en or ru" }, { status: 400 });
    }

    await db.user.update({
      where: { id: session.userId },
      data: { locale },
    });

    return NextResponse.json({ success: true });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    if (message === "Unauthorized") {
      return NextResponse.json({ success: false, error: message }, { status: 401 });
    }
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
