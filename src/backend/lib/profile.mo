import Map "mo:core/Map";
import Principal "mo:core/Principal";
import ProfileTypes "../types/profile";

module {
  public type OnboardingProfile = ProfileTypes.OnboardingProfile;

  // Save or overwrite a user's onboarding profile.
  public func saveProfile(
    profiles : Map.Map<Principal, OnboardingProfile>,
    caller   : Principal,
    profile  : OnboardingProfile,
  ) : () {
    profiles.add(caller, profile);
  };

  // Retrieve a user's profile; returns null if not yet onboarded.
  public func getProfile(
    profiles : Map.Map<Principal, OnboardingProfile>,
    caller   : Principal,
  ) : ?OnboardingProfile {
    profiles.get(caller);
  };

  // Update mutable fields (goal, weight, fitness level, dietary prefs, cycle info).
  public func updateProfile(
    profiles : Map.Map<Principal, OnboardingProfile>,
    caller   : Principal,
    profile  : OnboardingProfile,
  ) : () {
    profiles.add(caller, profile);
  };
};
