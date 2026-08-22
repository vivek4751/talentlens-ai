import * as SecureStore from "expo-secure-store";
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { Platform } from "react-native";
import { mobileApi, type MobileUser } from "@/lib/api";

type AuthState = { user: MobileUser | null; token: string | null; loading: boolean; signIn: (email: string, password: string) => Promise<void>; register: (name: string, email: string, password: string, role: MobileUser["role"]) => Promise<void>; signOut: () => Promise<void> };
const AuthContext = createContext<AuthState | null>(null);
const TOKEN_KEY = "talentlens.mobile.token";
const USER_KEY = "talentlens.mobile.user";
const sessionStore = {
  get: async (key: string) => Platform.OS === "web" ? (typeof window === "undefined" ? null : window.localStorage.getItem(key)) : SecureStore.getItemAsync(key),
  set: async (key: string, value: string) => { if (Platform.OS === "web") { if (typeof window !== "undefined") window.localStorage.setItem(key, value); return; } await SecureStore.setItemAsync(key, value); },
  remove: async (key: string) => { if (Platform.OS === "web") { if (typeof window !== "undefined") window.localStorage.removeItem(key); return; } await SecureStore.deleteItemAsync(key); },
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<MobileUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => { Promise.all([sessionStore.get(TOKEN_KEY), sessionStore.get(USER_KEY)]).then(([savedToken, savedUser]) => { setToken(savedToken); setUser(savedUser ? JSON.parse(savedUser) as MobileUser : null); }).finally(() => setLoading(false)); }, []);
  const saveSession = async (nextUser: MobileUser, nextToken: string) => { setUser(nextUser); setToken(nextToken); await Promise.all([sessionStore.set(TOKEN_KEY, nextToken), sessionStore.set(USER_KEY, JSON.stringify(nextUser))]); };
  const value = useMemo<AuthState>(() => ({ user, token, loading, signIn: async (email, password) => { const result = await mobileApi.signIn(email, password); await saveSession(result.user, result.token); }, register: async (name, email, password, role) => { const result = await mobileApi.register(name, email, password, role); await saveSession(result.user, result.token); }, signOut: async () => { setUser(null); setToken(null); await Promise.all([sessionStore.remove(TOKEN_KEY), sessionStore.remove(USER_KEY)]); } }), [user, token, loading]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() { const context = useContext(AuthContext); if (!context) throw new Error("useAuth must be used inside AuthProvider"); return context; }
