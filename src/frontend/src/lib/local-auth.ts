/**
 * Local auth simulation for mock/dev mode.
 * Uses localStorage so state persists across refreshes.
 */

const KEYS = {
  user: "femfit_auth_user",
  profileDone: "femfit_profile_done",
} as const;

export interface LocalUser {
  method: "phone" | "email";
  value: string; // phone number or email
  signedUpAt: number;
}

export function getLocalUser(): LocalUser | null {
  try {
    const raw = localStorage.getItem(KEYS.user);
    return raw ? (JSON.parse(raw) as LocalUser) : null;
  } catch {
    return null;
  }
}

export function isLocallyAuthenticated(): boolean {
  return getLocalUser() !== null;
}

export function localSignUp(method: "phone" | "email", value: string): void {
  const user: LocalUser = { method, value, signedUpAt: Date.now() };
  localStorage.setItem(KEYS.user, JSON.stringify(user));
}

export function localSignIn(method: "phone" | "email", value: string): void {
  // Reuse signUp storage shape — just updating the record
  localSignUp(method, value);
}

export function localSignOut(): void {
  localStorage.removeItem(KEYS.user);
  localStorage.removeItem(KEYS.profileDone);
}

export function isProfileComplete(): boolean {
  return localStorage.getItem(KEYS.profileDone) === "true";
}

export function markProfileComplete(): void {
  localStorage.setItem(KEYS.profileDone, "true");
}
