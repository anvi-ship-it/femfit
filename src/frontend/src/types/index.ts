// Re-export backend types for use across the app
export type {
  OnboardingProfile,
  CycleInfo,
  CycleEntry,
  WorkoutTemplate,
  MealTemplate,
  MealItem,
  Exercise,
  DailyLog,
  LoggedMeal,
  Subscription,
} from "../backend.d.ts";

export {
  CyclePhase,
  DietaryPreference,
  FitnessGoal,
  FitnessLevel,
  SubscriptionStatus,
  SubscriptionTier,
} from "../backend";

// Health conditions — mirrors Motoko HealthCondition variant
export enum HealthCondition {
  pcos = "pcos",
  pcod = "pcod",
  diabetes = "diabetes",
  thyroidDisorder = "thyroidDisorder",
  hormoneImbalance = "hormoneImbalance",
  anemia = "anemia",
  hypertension = "hypertension",
  heartCondition = "heartCondition",
}

// UI-specific helpers
export type CyclePhaseLabel =
  | "Menstrual"
  | "Follicular"
  | "Ovulatory"
  | "Luteal";

export const CYCLE_PHASE_LABELS: Record<string, CyclePhaseLabel> = {
  menstrual: "Menstrual",
  follicular: "Follicular",
  ovulatory: "Ovulatory",
  luteal: "Luteal",
};

export const CYCLE_PHASE_COLORS: Record<string, string> = {
  menstrual: "text-destructive bg-destructive/10",
  follicular: "text-primary bg-primary/10",
  ovulatory: "text-accent bg-accent/10",
  luteal: "text-secondary bg-secondary/10",
};

export const DIET_PREF_LABELS: Record<string, string> = {
  none: "No Restrictions",
  vegetarian: "Vegetarian",
  vegan: "Vegan",
  glutenFree: "Gluten-Free",
  dairyFree: "Dairy-Free",
};

export const FITNESS_GOAL_LABELS: Record<string, string> = {
  weightLoss: "Weight Loss",
  muscleGain: "Muscle Gain",
  maintenance: "Maintenance",
};

export const FITNESS_LEVEL_LABELS: Record<string, string> = {
  beginner: "Beginner",
  intermediate: "Intermediate",
  advanced: "Advanced",
};

export const HEALTH_CONDITION_LABELS: Record<string, string> = {
  pcos: "PCOS (Polycystic Ovary Syndrome)",
  pcod: "PCOD (Polycystic Ovarian Disease)",
  diabetes: "Diabetes",
  thyroidDisorder: "Thyroid Disorder",
  hormoneImbalance: "Hormone Imbalance",
  anemia: "Anemia",
  hypertension: "Hypertension",
  heartCondition: "Heart Condition",
};
