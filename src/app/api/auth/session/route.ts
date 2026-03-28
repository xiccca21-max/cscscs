import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const session = await getSession();
    if (!session.userId) {
      return NextResponse.json({ success: true, data: null });
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
      // DB unavailable — use defaults
    }

    return NextResponse.json({
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
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 },
    );
  }
}
