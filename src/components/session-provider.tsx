"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

export interface UserSession {
  userId: string;
  steamId: string;
  steamLogin: string;
  steamAvatar?: string;
  isAdmin: boolean;
  balance: string;
  status: string;
}

interface SessionCtx {
  user: UserSession | null;
  loading: boolean;
  refresh: () => Promise<void>;
}

const Ctx = createContext<SessionCtx>({
  user: null,
  loading: true,
  refresh: async () => {},
});

export function SessionProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserSession | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/session", { cache: "no-store" });
      const json = await res.json();
      setUser(json.success && json.data ? json.data : null);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return (
    <Ctx.Provider value={{ user, loading, refresh }}>{children}</Ctx.Provider>
  );
}

export function useSession() {
  return useContext(Ctx);
}
