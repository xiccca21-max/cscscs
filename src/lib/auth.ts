import { SessionOptions, getIronSession } from "iron-session";
import { cookies } from "next/headers";

export interface SessionData {
  userId?: string;
  steamId?: string;
  steamLogin?: string;
  steamAvatar?: string;
  isAdmin?: boolean;
  isReferral?: boolean;
  referralId?: string;
}

export const sessionOptions: SessionOptions = {
  password: process.env.SESSION_SECRET!,
  cookieName: "cs_ne_go_session",
  cookieOptions: {
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
    sameSite: "lax" as const,
  },
};

export async function getSession() {
  const cookieStore = await cookies();
  return getIronSession<SessionData>(cookieStore, sessionOptions);
}

export async function requireAuth(): Promise<SessionData & { userId: string }> {
  const session = await getSession();
  if (!session.userId) {
    throw new Error("Unauthorized");
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
