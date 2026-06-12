import Map "mo:core/Map";
import Principal "mo:core/Principal";
import Time "mo:core/Time";
import AccessControl "mo:caffeineai-authorization/access-control";
import ProfileLib "../lib/profile";
import CycleLib "../lib/cycle";
import PlansLib "../lib/plans";
import ProfileTypes "../types/profile";
import PlanTypes "../types/plans";

mixin (
  accessControlState : AccessControl.AccessControlState,
  profiles           : Map.Map<Principal, ProfileTypes.OnboardingProfile>,
  dailyLogs          : Map.Map<Text, PlanTypes.DailyLog>,
) {
  /// Get today's workout template for the caller based on their phase and goal.
  public query ({ caller }) func getTodaysWorkout() : async ?PlanTypes.WorkoutTemplate {
    switch (ProfileLib.getProfile(profiles, caller)) {
      case null { null };
      case (?profile) {
        let phase = CycleLib.getCurrentPhase(profile, Time.now());
        PlansLib.getWorkoutTemplate(phase, profile.fitnessGoal);
      };
    };
  };

  /// Get today's meal plan template for the caller based on their phase and dietary preference.
  public query ({ caller }) func getTodaysMealPlan() : async ?PlanTypes.MealTemplate {
    switch (ProfileLib.getProfile(profiles, caller)) {
      case null { null };
      case (?profile) {
        let phase = CycleLib.getCurrentPhase(profile, Time.now());
        let pref  = if (profile.dietPrefs.size() > 0) { profile.dietPrefs[0] } else { #none };
        PlansLib.getMealTemplate(phase, pref);
      };
    };
  };

  /// Get the caller's daily log for a specific date ("YYYY-MM-DD").
  public query ({ caller }) func getDailyLog(date : Text) : async PlanTypes.DailyLog {
    PlansLib.getDailyLog(dailyLogs, caller, date);
  };

  /// Mark workout as completed for a specific date.
  public shared ({ caller }) func logWorkoutComplete(date : Text) : async () {
    PlansLib.logWorkoutComplete(dailyLogs, caller, date, Time.now());
  };

  /// Log a meal for a specific date.
  public shared ({ caller }) func logMeal(date : Text, mealName : Text) : async () {
    PlansLib.logMeal(dailyLogs, caller, date, mealName, Time.now());
  };

  /// Log water intake in ml for a specific date.
  public shared ({ caller }) func logWater(date : Text, ml : Nat) : async () {
    PlansLib.logWater(dailyLogs, caller, date, ml);
  };

  /// Log optional weight in kg for a specific date.
  public shared ({ caller }) func logWeight(date : Text, weightKg : Float) : async () {
    PlansLib.logWeight(dailyLogs, caller, date, weightKg);
  };
};
