import { useAuth, signOut } from "./supabase";
/** Temporary adapter for legacy UI components; identity is the authenticated Supabase user, not an Internet Computer principal. */
export function useInternetIdentity() {
  const { session } = useAuth();
  const identity = session ? { getPrincipal: () => ({ toString: () => session.user.id }) } : null;
  return { identity, clear: signOut, isAuthenticated: !!session, isInitializing: false, login: async () => undefined };
}
