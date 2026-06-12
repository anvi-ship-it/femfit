import Common "common";

module {
  public type OnboardingProfile = {
    age           : Nat;
    heightCm      : Nat;
    weightKg      : Float;
    fitnessLevel  : Common.FitnessLevel;
    fitnessGoal   : Common.FitnessGoal;
    dietPrefs     : [Common.DietaryPreference];
    allergies     : [Text];
    cycleStartDate : Common.Timestamp; // epoch ns for the last cycle start
    cycleLengthDays : Nat;
    periodDurationDays : ?Nat; // how many days bleeding lasts (2-7); null = default 5
    healthConditions : ?[Common.HealthCondition]; // optional for backward compat
    displayName : Text; // user-facing display name, default ""
  };
};
