import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface Exercise {
    name: string;
    reps: string;
    sets: bigint;
    notes: string;
}
export type Timestamp = bigint;
export interface TransformationOutput {
    status: bigint;
    body: Uint8Array;
    headers: Array<http_header>;
}
export interface LoggedMeal {
    timestamp: Timestamp;
    mealName: string;
}
export interface CycleEntry {
    lengthDays: bigint;
    startDate: Timestamp;
}
export interface http_header {
    value: string;
    name: string;
}
export interface Subscription {
    status: SubscriptionStatus;
    tier: SubscriptionTier;
    stripeSessionId?: string;
    renewalDate?: Timestamp;
    trialEndsAt: Timestamp;
    startDate: Timestamp;
}
export interface http_request_result {
    status: bigint;
    body: Uint8Array;
    headers: Array<http_header>;
}
export interface ShoppingItem {
    productName: string;
    currency: string;
    quantity: bigint;
    priceInCents: bigint;
    productDescription: string;
}
export interface MealItem {
    name: string;
    portion: string;
    notes: string;
}
export interface TransformationInput {
    context: Uint8Array;
    response: http_request_result;
}
export interface MealTemplate {
    id: string;
    meals: Array<MealItem>;
    title: string;
    calories: bigint;
    phase: CyclePhase;
    dietPref: DietaryPreference;
}
export interface DailyLog {
    mealsLogged: Array<LoggedMeal>;
    waterMl: bigint;
    date: string;
    weightKg?: number;
    workoutTimestamp?: Timestamp;
    workoutDone: boolean;
}
export type StripeSessionStatus = {
    __kind__: "completed";
    completed: {
        userPrincipal?: string;
        response: string;
    };
} | {
    __kind__: "failed";
    failed: {
        error: string;
    };
};
export interface StripeConfiguration {
    allowedCountries: Array<string>;
    secretKey: string;
}
export interface CycleInfo {
    currentPhase: CyclePhase;
    phaseLengthDays: bigint;
    dayOfCycle: bigint;
    phaseStartDay: bigint;
    cycleTip: string;
}
export interface OnboardingProfile {
    age: bigint;
    dietPrefs: Array<DietaryPreference>;
    fitnessLevel: FitnessLevel;
    fitnessGoal: FitnessGoal;
    displayName: string;
    heightCm: bigint;
    cycleLengthDays: bigint;
    cycleStartDate: Timestamp;
    weightKg: number;
    healthConditions?: Array<HealthCondition>;
    allergies: Array<string>;
    periodDurationDays?: bigint;
}
export interface WorkoutTemplate {
    id: string;
    title: string;
    goal: FitnessGoal;
    exercises: Array<Exercise>;
    phase: CyclePhase;
    durationMin: bigint;
}
export enum CyclePhase {
    follicular = "follicular",
    ovulatory = "ovulatory",
    menstrual = "menstrual",
    luteal = "luteal"
}
export enum DietaryPreference {
    vegan = "vegan",
    glutenFree = "glutenFree",
    none = "none",
    dairyFree = "dairyFree",
    vegetarian = "vegetarian"
}
export enum FitnessGoal {
    weightLoss = "weightLoss",
    muscleGain = "muscleGain",
    maintenance = "maintenance"
}
export enum FitnessLevel {
    intermediate = "intermediate",
    beginner = "beginner",
    advanced = "advanced"
}
export enum HealthCondition {
    none = "none",
    pcod = "pcod",
    pcos = "pcos",
    hormoneImbalance = "hormoneImbalance",
    hypertension = "hypertension",
    anemia = "anemia",
    thyroidDisorder = "thyroidDisorder",
    heartCondition = "heartCondition",
    diabetes = "diabetes"
}
export enum SubscriptionStatus {
    active = "active",
    cancelled = "cancelled",
    expired = "expired"
}
export enum SubscriptionTier {
    premium = "premium",
    monthly = "monthly",
    freeTrial = "freeTrial",
    weekly = "weekly"
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    activateSubscription(sessionId: string, tier: SubscriptionTier): Promise<void>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    cancelSubscription(): Promise<void>;
    createCheckoutSession(items: Array<ShoppingItem>, successUrl: string, cancelUrl: string): Promise<string>;
    /**
     * / Create a Stripe checkout session for a specific subscription tier.
     */
    createSubscriptionCheckout(tier: SubscriptionTier, successUrl: string, cancelUrl: string): Promise<string>;
    getCallerUserRole(): Promise<UserRole>;
    getCycleHistory(): Promise<Array<CycleEntry>>;
    getCycleInfo(): Promise<CycleInfo | null>;
    getDailyLog(date: string): Promise<DailyLog>;
    getOnboardingProfile(): Promise<OnboardingProfile | null>;
    getStripeSessionStatus(sessionId: string): Promise<StripeSessionStatus>;
    getSubscription(): Promise<Subscription | null>;
    getTodaysMealPlan(): Promise<MealTemplate | null>;
    getTodaysWorkout(): Promise<WorkoutTemplate | null>;
    grantDummySubscription(): Promise<Subscription>;
    initFreeTrial(): Promise<void>;
    isCallerAdmin(): Promise<boolean>;
    isStripeConfigured(): Promise<boolean>;
    logMeal(date: string, mealName: string): Promise<void>;
    logWater(date: string, ml: bigint): Promise<void>;
    logWeight(date: string, weightKg: number): Promise<void>;
    logWorkoutComplete(date: string): Promise<void>;
    saveOnboardingProfile(profile: OnboardingProfile): Promise<void>;
    setStripeConfiguration(config: StripeConfiguration): Promise<void>;
    transform(input: TransformationInput): Promise<TransformationOutput>;
    updateCycleStartDate(newStartDateNs: bigint): Promise<void>;
    updateOnboardingProfile(profile: OnboardingProfile): Promise<void>;
}
