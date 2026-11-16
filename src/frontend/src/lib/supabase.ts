import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";

const SESSION_KEY = "femfit_supabase_session";
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export interface SupabaseSession {
  access_token: string;
  refresh_token: string;
  expires_at?: number;
  user: { id: string; email?: string; phone?: string };
}

function config() {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new Error("Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.");
  }
  return { url: SUPABASE_URL.replace(/\/$/, ""), key: SUPABASE_ANON_KEY };
}

function readSession(): SupabaseSession | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? (JSON.parse(raw) as SupabaseSession) : null;
  } catch {
    return null;
  }
}

let session: SupabaseSession | null = typeof window === "undefined" ? null : readSession();
const listeners = new Set<(value: SupabaseSession | null) => void>();
function setSession(value: SupabaseSession | null) {
  session = value;
  if (typeof window !== "undefined") {
    if (value) localStorage.setItem(SESSION_KEY, JSON.stringify(value));
    else localStorage.removeItem(SESSION_KEY);
  }
  listeners.forEach((listener) => listener(value));
}

async function authRequest(path: string, body?: unknown) {
  const { url, key } = config();
  const response = await fetch(`${url}/auth/v1/${path}`, {
    method: "POST",
    headers: { apikey: key, "Content-Type": "application/json" },
    body: JSON.stringify(body ?? {}),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.msg || data.message || data.error_description || data.error || "Supabase authentication failed.");
  return data;
}

export async function sendOtp(method: "email" | "phone", value: string) {
  await authRequest("otp", method === "email" ? { email: value.trim().toLowerCase(), create_user: true } : { phone: value, create_user: true });
}

export async function verifyOtp(method: "email" | "phone", value: string, token: string) {
  const result = await authRequest("verify", method === "email"
    ? { email: value.trim().toLowerCase(), token, type: "email" }
    : { phone: value, token, type: "sms" });
  if (!result.access_token || !result.refresh_token || !result.user) throw new Error("OTP was accepted but no session was returned. Check your Supabase Auth settings.");
  setSession(result as SupabaseSession);
}

async function refreshSession() {
  if (!session?.refresh_token) return null;
  try {
    const refreshed = await authRequest("token?grant_type=refresh_token", { refresh_token: session.refresh_token });
    setSession(refreshed as SupabaseSession);
    return session;
  } catch {
    setSession(null);
    return null;
  }
}

export async function getAccessToken() {
  if (!session) session = readSession();
  if (!session) throw new Error("Please sign in again.");
  if (session.expires_at && session.expires_at * 1000 < Date.now() + 30_000) {
    const fresh = await refreshSession();
    if (!fresh) throw new Error("Your session expired. Please sign in again.");
  }
  return session.access_token;
}

export async function apiRequest<T>(table: string, options: { method?: string; query?: string; body?: unknown; prefer?: string } = {}): Promise<T> {
  const { url, key } = config();
  const token = await getAccessToken();
  const response = await fetch(`${url}/rest/v1/${table}${options.query ? `?${options.query}` : ""}`, {
    method: options.method ?? "GET",
    headers: {
      apikey: key,
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...(options.prefer ? { Prefer: options.prefer } : {}),
    },
    ...(options.body === undefined ? {} : { body: JSON.stringify(options.body, (_key, value) => typeof value === "bigint" ? value.toString() : value) }),
  });
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.message || data.details || data.hint || "Could not access FemFit data. Check the Supabase schema and RLS policies.");
  }
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

export async function signOut() {
  const current = session ?? readSession();
  if (current) {
    try {
      const { url, key } = config();
      await fetch(`${url}/auth/v1/logout`, { method: "POST", headers: { apikey: key, Authorization: `Bearer ${current.access_token}` } });
    } finally { setSession(null); }
  } else setSession(null);
}

interface AuthContextValue { session: SupabaseSession | null; isInitializing: boolean; signOut: () => Promise<void> }
const AuthContext = createContext<AuthContextValue>({ session: null, isInitializing: true, signOut });
export function AuthProvider({ children }: { children: ReactNode }) {
  const [current, setCurrent] = useState<SupabaseSession | null>(() => session ?? readSession());
  const [isInitializing, setInitializing] = useState(true);
  useEffect(() => {
    let mounted = true;
    if (current?.expires_at && current.expires_at * 1000 < Date.now() + 30_000) void refreshSession();
    const listener = (next: SupabaseSession | null) => { if (mounted) setCurrent(next); };
    listeners.add(listener);
    const onStorage = (event: StorageEvent) => { if (event.key === SESSION_KEY) { const next = readSession(); session = next; setCurrent(next); } };
    window.addEventListener("storage", onStorage);
    setInitializing(false);
    return () => { mounted = false; listeners.delete(listener); window.removeEventListener("storage", onStorage); };
  }, []);
  const value = useMemo(() => ({ session: current, isInitializing, signOut }), [current, isInitializing]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
export function useAuth() { return useContext(AuthContext); }
