import { SessionOptions, getIronSession } from "iron-session";
import { cookies } from "next/headers";
import { db } from "./db";

function getSessionOptions(): SessionOptions {
  const password = process.env.SESSION_SECRET;
  if (!password) {
    throw new Error(
      "SESSION_SECRET environment variable is not set. The application cannot start without it.",
    );
  }
  return {
    password,
    cookieName: "cs_ne_go_session",
    cookieOptions: {
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      sameSite: "lax" as const,
    },
  };
}

export interface SessionData {
  userId?: string;
  steamId?: string;
  steamLogin?: string;
  steamAvatar?: string;
  isAdmin?: boolean;
  isReferral?: boolean;
  referralId?: string;
}

export async function getSession() {
  const cookieStore = await cookies();
  return getIronSession<SessionData>(cookieStore, getSessionOptions());
}

export async function requireAuth(): Promise<SessionData & { userId: string }> {
  const session = await getSession();
  if (!session.userId) {
    throw new Error("Unauthorized");
  }

  const user = await db.user.findUnique({
    where: { id: session.userId },
    select: { status: true },
  });

  if (!user) {
    throw new Error("Unauthorized");
  }

  if (user.status === "BLOCKED") {
    throw new Error("Blocked");
  }

  return session as SessionData & { userId: string };
}

export async function requireAdmin(): Promise<
  SessionData & { userId: string; isAdmin: true }
> {
  const session = await requireAuth();
  if (!session.isAdmin) {
    throw new Error("Forbidden");
  }
  return session as SessionData & { userId: string; isAdmin: true };
}
