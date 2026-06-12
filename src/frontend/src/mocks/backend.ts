import type { backendInterface } from "../backend";
import {
  CyclePhase,
  DietaryPreference,
  FitnessGoal,
  FitnessLevel,
  SubscriptionStatus,
  SubscriptionTier,
  UserRole,
} from "../backend";

const now = BigInt(Date.now()) * BigInt(1_000_000);
const trialEnd = now + BigInt(7 * 24 * 60 * 60) * BigInt(1_000_000_000);

export const mockBackend: backendInterface = {
  _initializeAccessControl: async () => undefined,
  activateSubscription: async () => undefined,
  assignCallerUserRole: async () => undefined,
  cancelSubscription: async () => undefined,
  createCheckoutSession: async () => "mock_session_id",
  createSubscriptionCheckout: async () => "mock_subscription_session_id",
  getCallerUserRole: async () => UserRole.user,
  getCycleHistory: async () => [
    { startDate: now - BigInt(28 * 24 * 60 * 60) * BigInt(1_000_000_000), lengthDays: BigInt(28) },
    { startDate: now, lengthDays: BigInt(28) },
  ],
  getCycleInfo: async () => ({
    currentPhase: CyclePhase.follicular,
    phaseLengthDays: BigInt(9),
    dayOfCycle: BigInt(12),
    phaseStartDay: BigInt(5),
    cycleTip: "The follicular phase is a great time for strength training. Energy and motivation are rising — lean into high-intensity workouts!",
  }),
  getDailyLog: async () => ({
    date: new Date().toISOString().split("T")[0],
    workoutDone: false,
    waterMl: BigInt(1200),
    mealsLogged: [
      { mealName: "Protein Smoothie", timestamp: now },
    ],
  }),
  getOnboardingProfile: async () => ({
    age: BigInt(28),
    heightCm: BigInt(165),
    weightKg: 62.5,
    cycleLengthDays: BigInt(28),
    cycleStartDate: now - BigInt(12 * 24 * 60 * 60) * BigInt(1_000_000_000),
    fitnessLevel: FitnessLevel.intermediate,
    fitnessGoal: FitnessGoal.weightLoss,
    dietPrefs: [DietaryPreference.none],
    allergies: [],
    displayName: "",
  }),
  getStripeSessionStatus: async () => ({
    __kind__: "completed" as const,
    completed: { userPrincipal: "mock-principal", response: "ok" },
  }),
  getSubscription: async () => ({
    status: SubscriptionStatus.active,
    tier: SubscriptionTier.freeTrial,
    trialEndsAt: trialEnd,
    startDate: now,
  }),
  grantDummySubscription: async () => ({
    tier: SubscriptionTier.monthly,
    status: SubscriptionStatus.active,
    startDate: BigInt(Date.now()) * BigInt(1_000_000),
    trialEndsAt: BigInt(Date.now()) * BigInt(1_000_000),
    renewalDate: BigInt(Date.now() + 180 * 24 * 60 * 60 * 1000) * BigInt(1_000_000),
    stripeSessionId: "dummy-test-6month",
  }),
  getTodaysMealPlan: async () => ({
    id: "meal-follicular-1",
    title: "Balanced Nutrition",
    calories: BigInt(1800),
    phase: CyclePhase.follicular,
    dietPref: DietaryPreference.none,
    meals: [
      { name: "Protein Smoothie", portion: "1 large glass", notes: "Add chia seeds" },
      { name: "Mediterranean Bowl", portion: "1 bowl", notes: "Lunch" },
      { name: "Grilled Salmon & Veggies", portion: "200g salmon", notes: "Dinner" },
    ],
  }),
  getTodaysWorkout: async () => ({
    id: "workout-follicular-1",
    title: "Cycle-Synced Fitness",
    durationMin: BigInt(45),
    goal: FitnessGoal.weightLoss,
    phase: CyclePhase.follicular,
    exercises: [
      { name: "Morning Flow Yoga", sets: BigInt(1), reps: "15 min", notes: "Focus on breathwork" },
      { name: "Strength Training — Upper Body", sets: BigInt(3), reps: "12", notes: "Moderate weight" },
      { name: "Core Circuit", sets: BigInt(3), reps: "15", notes: "" },
    ],
  }),
  initFreeTrial: async () => undefined,
  isCallerAdmin: async () => false,
  isStripeConfigured: async () => false,
  logMeal: async () => undefined,
  logWater: async () => undefined,
  logWeight: async () => undefined,
  logWorkoutComplete: async () => undefined,
  saveOnboardingProfile: async () => undefined,
  setStripeConfiguration: async () => undefined,
  transform: async (input) => ({
    status: BigInt(200),
    body: input.response.body,
    headers: [],
  }),
  updateCycleStartDate: async () => undefined,
  updateOnboardingProfile: async () => undefined,
};
