import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { storage } from "@/src/utils/storage";

type User = {
  id: string;
  phone: string;
  name: string | null;
  age: number | null;
  location: string | null;
  avatar_url: string | null;
  bio: string | null;
  sports: { sport: string; skill: string }[];
  reputation: number;
  attendance_rate: number;
  matches_played: number;
  wins: number;
  losses: number;
  onboarded: boolean;
};

type AuthCtx = {
  user: User | null;
  setUser: (u: User | null) => void;
  loading: boolean;
  signOut: () => Promise<void>;
};

const Ctx = createContext<AuthCtx>({
  user: null,
  setUser: () => {},
  loading: true,
  signOut: async () => {},
});

const STORAGE_KEY = "playpal_user";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUserState] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const saved = await storage.getItem<string>(STORAGE_KEY, "");
      if (saved) {
        try {
          setUserState(JSON.parse(saved));
        } catch (e) {
          console.warn("auth restore failed", e);
        }
      }
      setLoading(false);
    })();
  }, []);

  const setUser = useCallback((u: User | null) => {
    setUserState(u);
    if (u) storage.setItem(STORAGE_KEY, JSON.stringify(u));
    else storage.removeItem(STORAGE_KEY);
  }, []);

  const signOut = useCallback(async () => {
    setUserState(null);
    await storage.removeItem(STORAGE_KEY);
  }, []);

  return <Ctx.Provider value={{ user, setUser, loading, signOut }}>{children}</Ctx.Provider>;
}

export const useAuth = () => useContext(Ctx);
