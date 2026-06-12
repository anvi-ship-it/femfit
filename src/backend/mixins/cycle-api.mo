import Map "mo:core/Map";
import Principal "mo:core/Principal";
import Time "mo:core/Time";
import AccessControl "mo:caffeineai-authorization/access-control";
import ProfileLib "../lib/profile";
import CycleLib "../lib/cycle";
import ProfileTypes "../types/profile";
import CycleTypes "../types/cycle";

mixin (
  accessControlState : AccessControl.AccessControlState,
  profiles           : Map.Map<Principal, ProfileTypes.OnboardingProfile>,
) {
  /// Get full cycle info for the caller (current phase, day, tip).
  public query ({ caller }) func getCycleInfo() : async ?CycleTypes.CycleInfo {
    switch (ProfileLib.getProfile(profiles, caller)) {
      case null { null };
      case (?profile) {
        ?CycleLib.buildCycleInfo(profile, Time.now());
      };
    };
  };

  /// Return last 3 months of cycle history for the caller.
  public query ({ caller }) func getCycleHistory() : async [CycleTypes.CycleEntry] {
    switch (ProfileLib.getProfile(profiles, caller)) {
      case null { [] };
      case (?profile) {
        CycleLib.getCycleHistory(profile, Time.now());
      };
    };
  };

  /// Manually adjust the cycle start date (from profile settings).
  public shared ({ caller }) func updateCycleStartDate(
    newStartDateNs : Int
  ) : async () {
    switch (ProfileLib.getProfile(profiles, caller)) {
      case null { /* no-op: not yet onboarded */ };
      case (?profile) {
        let updated : ProfileTypes.OnboardingProfile = {
          profile with cycleStartDate = newStartDateNs
        };
        ProfileLib.updateProfile(profiles, caller, updated);
      };
    };
  };
};
