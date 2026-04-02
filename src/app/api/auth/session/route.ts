import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const NO_CACHE_HEADERS = {
  "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
  "Pragma": "no-cache",
  "Expires": "0",
} as const;

export async function GET() {
  try {
    const session = await getSession();
    if (!session.userId) {
      return NextResponse.json(
        { success: true, data: null },
        { headers: NO_CACHE_HEADERS },
      );
    }

    let balance = "0";
    let status = "ACTIVE";
    try {
      const user = await db.user.findUnique({
        where: { id: session.userId },
        select: { balance: true, status: true },
      });
      if (user) {
        balance = user.balance?.toString() ?? "0";
        status = user.status ?? "ACTIVE";
      }
    } catch {
      // DB unavailable - use defaults
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          userId: session.userId,
          steamId: session.steamId,
          steamLogin: session.steamLogin,
          steamAvatar: session.steamAvatar,
          isAdmin: session.isAdmin ?? false,
          balance,
          status,
        },
      },
      { headers: NO_CACHE_HEADERS },
    );
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500, headers: NO_CACHE_HEADERS },
    );
  }
}
