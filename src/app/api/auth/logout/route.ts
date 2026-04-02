import { getSession, sessionOptions } from "@/lib/auth";
import { serialize } from "cookie";
import { NextRequest, NextResponse } from "next/server";

function buildDeleteCookie(): string {
  return serialize(sessionOptions.cookieName, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}

export async function POST() {
  try {
    const session = await getSession();
    session.destroy();
    await session.save();
    const res = NextResponse.json({ success: true });
    res.headers.append("Set-Cookie", buildDeleteCookie());
    return res;
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
  response.headers.append("Set-Cookie", buildDeleteCookie());
  return response;
}
