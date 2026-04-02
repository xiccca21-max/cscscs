import { getSession, sessionOptions } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";

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

export async function GET(request: NextRequest) {
  const response = NextResponse.redirect(new URL("/", request.url));
  response.cookies.set(sessionOptions.cookieName, "", {
    ...sessionOptions.cookieOptions,
    path: "/",
    maxAge: 0,
  });
  return response;
}
