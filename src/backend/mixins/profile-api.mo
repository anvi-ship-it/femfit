import Map "mo:core/Map";
import Principal "mo:core/Principal";
import AccessControl "mo:caffeineai-authorization/access-control";
import ProfileLib "../lib/profile";
import ProfileTypes "../types/profile";

mixin (
  accessControlState : AccessControl.AccessControlState,
  profiles           : Map.Map<Principal, ProfileTypes.OnboardingProfile>,
) {
  /// Save the caller's onboarding profile (first-time setup or re-onboarding).
  public shared ({ caller }) func saveOnboardingProfile(
    profile : ProfileTypes.OnboardingProfile
  ) : async () {
    ProfileLib.saveProfile(profiles, caller, profile);
  };

  /// Retrieve the caller's profile. Returns null when not yet onboarded.
  public query ({ caller }) func getOnboardingProfile() : async ?ProfileTypes.OnboardingProfile {
    ProfileLib.getProfile(profiles, caller);
  };

  /// Update editable profile fields (goal, weight, dietary prefs, cycle info).
  public shared ({ caller }) func updateOnboardingProfile(
    profile : ProfileTypes.OnboardingProfile
  ) : async () {
    ProfileLib.updateProfile(profiles, caller, profile);
  };
};
