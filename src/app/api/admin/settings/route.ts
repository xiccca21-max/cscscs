import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";

function adminErrorResponse(e: unknown) {
  const message = e instanceof Error ? e.message : "Unknown error";
  if (message === "Unauthorized") {
    return NextResponse.json({ success: false, error: message }, { status: 401 });
  }
  if (message === "Forbidden") {
    return NextResponse.json({ success: false, error: message }, { status: 403 });
  }
  return NextResponse.json({ success: false, error: message }, { status: 500 });
}

export async function GET() {
  try {
    await requireAdmin();
    const settings = await db.siteSettings.findMany();
    const result: Record<string, string> = {};
    for (const s of settings) result[s.key] = s.value;
    return NextResponse.json({ success: true, data: result });
  } catch (e) {
    return adminErrorResponse(e);
  }
}

export async function PATCH(req: NextRequest) {
  try {
    await requireAdmin();
    let body: { key?: string; value?: string };
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ success: false, error: "Invalid JSON body" }, { status: 400 });
    }
    const { key, value } = body;
    if (!key) {
      return NextResponse.json({ success: false, error: "key required" }, { status: 400 });
    }
    await db.siteSettings.upsert({
      where: { key },
      update: { value: value ?? "" },
      create: { key, value: value ?? "" },
    });
    return NextResponse.json({ success: true });
  } catch (e) {
    return adminErrorResponse(e);
  }
}
