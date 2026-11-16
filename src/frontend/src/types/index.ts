export type Timestamp = bigint;
export interface Exercise { name: string; reps: string; sets: bigint; notes: string }
export interface LoggedMeal { timestamp: Timestamp; mealName: string }
export interface CycleEntry { lengthDays: bigint; startDate: Timestamp }
export interface MealItem { name: string; portion: string; notes: string }
export interface MealTemplate { id: string; meals: MealItem[]; title: string; calories: bigint; phase: CyclePhase; dietPref: DietaryPreference }
export interface DailyLog { mealsLogged: LoggedMeal[]; waterMl: bigint; date: string; weightKg?: number; workoutTimestamp?: Timestamp; workoutDone: boolean }
export interface CycleInfo { currentPhase: CyclePhase; phaseLengthDays: bigint; dayOfCycle: bigint; phaseStartDay: bigint; cycleTip: string }
export interface OnboardingProfile { age: bigint; dietPrefs: DietaryPreference[]; fitnessLevel: FitnessLevel; fitnessGoal: FitnessGoal; displayName: string; heightCm: bigint; cycleLengthDays: bigint; cycleStartDate: Timestamp; weightKg: number; healthConditions?: HealthCondition[]; allergies: string[]; periodDurationDays?: bigint }
export interface WorkoutTemplate { id: string; title: string; goal: FitnessGoal; exercises: Exercise[]; phase: CyclePhase; durationMin: bigint }
export interface Subscription { status: SubscriptionStatus; tier: SubscriptionTier; stripeSessionId?: string; renewalDate?: Timestamp; trialEndsAt: Timestamp; startDate: Timestamp }
export enum CyclePhase { follicular="follicular", ovulatory="ovulatory", menstrual="menstrual", luteal="luteal" }
export enum DietaryPreference { vegan="vegan", glutenFree="glutenFree", none="none", dairyFree="dairyFree", vegetarian="vegetarian" }
export enum FitnessGoal { weightLoss="weightLoss", muscleGain="muscleGain", maintenance="maintenance" }
export enum FitnessLevel { intermediate="intermediate", beginner="beginner", advanced="advanced" }
export enum SubscriptionStatus { active="active", cancelled="cancelled", expired="expired" }
export enum SubscriptionTier { premium="premium", monthly="monthly", freeTrial="freeTrial", weekly="weekly" }
export enum HealthCondition { none="none", pcos="pcos", pcod="pcod", diabetes="diabetes", thyroidDisorder="thyroidDisorder", hormoneImbalance="hormoneImbalance", anemia="anemia", hypertension="hypertension", heartCondition="heartCondition" }
export type CyclePhaseLabel = "Menstrual" | "Follicular" | "Ovulatory" | "Luteal";
export const CYCLE_PHASE_LABELS: Record<string,CyclePhaseLabel> = { menstrual:"Menstrual", follicular:"Follicular", ovulatory:"Ovulatory", luteal:"Luteal" };
export const CYCLE_PHASE_COLORS: Record<string,string> = { menstrual:"text-destructive bg-destructive/10", follicular:"text-primary bg-primary/10", ovulatory:"text-accent bg-accent/10", luteal:"text-secondary bg-secondary/10" };
export const DIET_PREF_LABELS: Record<string,string> = { none:"No Restrictions", vegetarian:"Vegetarian", vegan:"Vegan", glutenFree:"Gluten-Free", dairyFree:"Dairy-Free" };
export const FITNESS_GOAL_LABELS: Record<string,string> = { weightLoss:"Weight Loss", muscleGain:"Muscle Gain", maintenance:"Maintenance" };
export const FITNESS_LEVEL_LABELS: Record<string,string> = { beginner:"Beginner", intermediate:"Intermediate", advanced:"Advanced" };
export const HEALTH_CONDITION_LABELS: Record<string,string> = { pcos:"PCOS (Polycystic Ovary Syndrome)", pcod:"PCOD (Polycystic Ovarian Disease)", diabetes:"Diabetes", thyroidDisorder:"Thyroid Disorder", hormoneImbalance:"Hormone Imbalance", anemia:"Anemia", hypertension:"Hypertension", heartCondition:"Heart Condition", none:"None" };
