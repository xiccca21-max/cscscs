import { getSession } from "@/lib/auth";
import { getAppOrigin } from "@/lib/app-url";
import { NextResponse } from "next/server";

export async function POST() {
  try {
    const session = await getSession();
    session.destroy();
    await session.save();
    return NextResponse.json({ success: true });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 },
    );
  }
}

export async function GET() {
  let origin: string;
  try {
    origin = getAppOrigin();
  } catch {
    return NextResponse.json(
      { error: "NEXT_PUBLIC_APP_URL is not configured" },
      { status: 500 },
    );
  }
  const session = await getSession();
  session.destroy();
  await session.save();
  return NextResponse.redirect(new URL("/", origin));
}
