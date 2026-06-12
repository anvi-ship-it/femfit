import Common "common";

module {
  public type Exercise = {
    name        : Text;
    sets        : Nat;
    reps        : Text;  // e.g. "10-12" or "30 sec"
    notes       : Text;
  };

  public type WorkoutTemplate = {
    id          : Text;
    title       : Text;
    phase       : Common.CyclePhase;
    goal        : Common.FitnessGoal;
    durationMin : Nat;
    exercises   : [Exercise];
  };

  public type MealTemplate = {
    id          : Text;
    title       : Text;
    phase       : Common.CyclePhase;
    dietPref    : Common.DietaryPreference;
    calories    : Nat;
    meals       : [MealItem];
  };

  public type MealItem = {
    name        : Text;
    portion     : Text;
    notes       : Text;
  };

  // Daily progress entry keyed by (user, date-string "YYYY-MM-DD")
  public type DailyLog = {
    date            : Text;          // "YYYY-MM-DD"
    workoutDone     : Bool;
    workoutTimestamp : ?Common.Timestamp;
    mealsLogged     : [LoggedMeal];
    waterMl         : Nat;
    weightKg        : ?Float;        // optional manual entry
  };

  public type LoggedMeal = {
    mealName    : Text;
    timestamp   : Common.Timestamp;
  };
};
