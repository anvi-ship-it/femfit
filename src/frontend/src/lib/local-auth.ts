const PROFILE_COMPLETE_KEY = "femfit_profile_done";

export function isProfileComplete(): boolean {
  return localStorage.getItem(PROFILE_COMPLETE_KEY) === "true";
}

export function markProfileComplete(): void {
  localStorage.setItem(PROFILE_COMPLETE_KEY, "true");
}
