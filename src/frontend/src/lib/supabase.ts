import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";

const SESSION_KEY = "femfit_supabase_session";
const env = import.meta.env as Record<string, string | undefined>;
const SUPABASE_URL = env.VITE_SUPABASE_URL ?? env.SUPABASE_URL;
const SUPABASE_KEY = env.VITE_SUPABASE_ANON_KEY ?? env.VITE_SUPABASE_PUBLISHABLE_KEY ?? env.SUPABASE_PUBLISHABLE_KEY;

export interface SupabaseSession {
  access_token: string;
  refresh_token: string;
  expires_at?: number;
  user: { id: string; email?: string; phone?: string };
}

function config() {
  if (!SUPABASE_URL || !SUPABASE_KEY) throw new Error("Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY (or VITE_SUPABASE_PUBLISHABLE_KEY) in the frontend build environment.");
  return { url: SUPABASE_URL.replace(/\/$/, ""), key: SUPABASE_KEY };
}
function readSession(): SupabaseSession | null {
  try { const raw = localStorage.getItem(SESSION_KEY); return raw ? JSON.parse(raw) as SupabaseSession : null; } catch { return null; }
}
let session: SupabaseSession | null = typeof window === "undefined" ? null : readSession();
const listeners = new Set<(value: SupabaseSession | null) => void>();
function setSession(value: SupabaseSession | null) {
  session = value;
  if (typeof window !== "undefined") { if (value) localStorage.setItem(SESSION_KEY, JSON.stringify(value)); else localStorage.removeItem(SESSION_KEY); }
  listeners.forEach((listener) => listener(value));
}
async function authRequest(path: string, body?: unknown) {
  const { url, key } = config();
  let response: Response;
  try { response = await fetch(`${url}/auth/v1/${path}`, { method: "POST", headers: { apikey: key, "Content-Type": "application/json" }, body: JSON.stringify(body ?? {}) }); }
  catch { throw new Error("Could not reach Supabase. Check your connection and project URL."); }
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = data.msg || data.message || data.error_description || data.error || "Supabase authentication failed.";
    if (/expired|expiry/i.test(message)) throw new Error("That verification code has expired. Request a new code and try again.");
    if (/invalid|token|otp|code/i.test(message)) throw new Error("That verification code is invalid or expired. Check it or request a new one.");
    if (response.status === 429) throw new Error("Too many code requests. Wait a few minutes before trying again.");
    throw new Error(message);
  }
  return data;
}
export async function sendOtp(method: "email" | "phone", value: string) {
  await authRequest("otp", method === "email" ? { email: value.trim().toLowerCase(), create_user: true } : { phone: value, create_user: true });
}
export async function verifyOtp(method: "email" | "phone", value: string, token: string) {
  const result = await authRequest("verify", method === "email" ? { email: value.trim().toLowerCase(), token: token.trim(), type: "email" } : { phone: value, token: token.trim(), type: "sms" });
  if (!result.access_token || !result.refresh_token || !result.user?.id) throw new Error("No session was returned. Check the email/SMS OTP provider and template in Supabase Auth.");
  setSession(result as SupabaseSession);
}
async function refreshSession() {
  if (!session?.refresh_token) return null;
  try { const renewed = await authRequest("token?grant_type=refresh_token", { refresh_token: session.refresh_token }); setSession(renewed as SupabaseSession); return session; }
  catch { setSession(null); return null; }
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
  const { url, key } = config(); const token = await getAccessToken();
  let response: Response;
  try { response = await fetch(`${url}/rest/v1/${table}${options.query ? `?${options.query}` : ""}`, { method: options.method ?? "GET", headers: { apikey: key, Authorization: `Bearer ${token}`, "Content-Type": "application/json", ...(options.prefer ? { Prefer: options.prefer } : {}) }, ...(options.body === undefined ? {} : { body: JSON.stringify(options.body, (_k, v) => typeof v === "bigint" ? v.toString() : v) }) }); }
  catch { throw new Error("Could not reach Supabase. Check your connection and try again."); }
  if (!response.ok) { const data = await response.json().catch(() => ({})); throw new Error(data.message || data.details || data.hint || "Could not access FemFit data. Check the Supabase schema and row-level security policies."); }
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}
export async function signOut() {
  const current = session ?? readSession();
  try { if (current) { const { url, key } = config(); await fetch(`${url}/auth/v1/logout`, { method: "POST", headers: { apikey: key, Authorization: `Bearer ${current.access_token}` } }); } }
  finally { setSession(null); }
}
interface AuthContextValue { session: SupabaseSession | null; isInitializing: boolean; signOut: () => Promise<void> }
const AuthContext = createContext<AuthContextValue>({ session: null, isInitializing: true, signOut });
export function AuthProvider({ children }: { children: ReactNode }) {
  const [current, setCurrent] = useState<SupabaseSession | null>(() => session ?? readSession());
  const [isInitializing, setInitializing] = useState(true);
  useEffect(() => {
    let mounted = true;
    const listener = (next: SupabaseSession | null) => { if (mounted) setCurrent(next); };
    listeners.add(listener);
    const onStorage = (event: StorageEvent) => { if (event.key === SESSION_KEY) { const next = readSession(); session = next; setCurrent(next); } };
    window.addEventListener("storage", onStorage);
    const initialize = async () => { const saved = readSession(); session = saved; if (saved?.expires_at && saved.expires_at * 1000 < Date.now() + 30_000) await refreshSession(); if (mounted) { setCurrent(session); setInitializing(false); } };
    void initialize();
    return () => { mounted = false; listeners.delete(listener); window.removeEventListener("storage", onStorage); };
  }, []);
  const value = useMemo(() => ({ session: current, isInitializing, signOut }), [current, isInitializing]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
export function useAuth() { return useContext(AuthContext); }
