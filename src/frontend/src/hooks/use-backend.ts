import { apiRequest } from "../lib/supabase";
import { useAuth } from "../lib/supabase";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { CycleEntry, CycleInfo, DailyLog, Exercise, MealTemplate, OnboardingProfile, Subscription, SubscriptionTier, WorkoutTemplate } from "../types";
import { CyclePhase, DietaryPreference, FitnessGoal, SubscriptionStatus, SubscriptionTier as Tier } from "../types";

const ownRow = (id: string) => `user_id=eq.${encodeURIComponent(id)}`;
function asProfile(value: unknown): OnboardingProfile | null {
  if (!value || typeof value !== "object") return null;
  const p = value as Record<string, unknown>;
  return { ...p, age: BigInt(String(p.age ?? 0)), heightCm: BigInt(String(p.heightCm ?? 0)), cycleLengthDays: BigInt(String(p.cycleLengthDays ?? 28)), cycleStartDate: BigInt(String(p.cycleStartDate ?? 0)), periodDurationDays: p.periodDurationDays == null ? undefined : BigInt(String(p.periodDurationDays)) } as OnboardingProfile;
}
function serialize(value: unknown) { return JSON.parse(JSON.stringify(value, (_k, v) => typeof v === "bigint" ? v.toString() : v)); }
async function getProfile(id: string) {
  const rows = await apiRequest<{ profile: unknown }[]>("profiles", { query: `${ownRow(id)}&select=profile&limit=1` });
  return asProfile(rows[0]?.profile);
}
async function saveProfile(id: string, profile: OnboardingProfile) {
  await apiRequest("profiles", { method: "POST", query: "on_conflict=user_id", prefer: "resolution=merge-duplicates,return=minimal", body: { user_id: id, profile: serialize(profile) } });
}
const emptyLog = (date: string): DailyLog => ({ date, workoutDone: false, waterMl: 0n, mealsLogged: [] });
async function getLog(id: string, date: string) {
  const rows = await apiRequest<{ data: Record<string, unknown> }[]>("daily_logs", { query: `${ownRow(id)}&log_date=eq.${encodeURIComponent(date)}&select=data&limit=1` });
  const d = rows[0]?.data; if (!d) return emptyLog(date);
  return { date, workoutDone: Boolean(d.workoutDone), waterMl: BigInt(String(d.waterMl ?? 0)), weightKg: d.weightKg == null ? undefined : Number(d.weightKg), workoutTimestamp: d.workoutTimestamp == null ? undefined : BigInt(String(d.workoutTimestamp)), mealsLogged: Array.isArray(d.mealsLogged) ? (d.mealsLogged as { mealName: string; timestamp: string | bigint }[]).map((m) => ({ mealName: m.mealName, timestamp: BigInt(String(m.timestamp)) })) : [] } as DailyLog;
}
async function saveLog(id: string, log: DailyLog) {
  await apiRequest("daily_logs", { method: "POST", query: "on_conflict=user_id,log_date", prefer: "resolution=merge-duplicates,return=minimal", body: { user_id: id, log_date: log.date, data: serialize(log) } });
}
function getCycleInfo(profile: OnboardingProfile | null): CycleInfo | null {
  if (!profile) return null;
  const length = Math.max(21, Number(profile.cycleLengthDays));
  const startMs = Number(profile.cycleStartDate) / 1_000_000;
  const day = ((Math.floor((Date.now() - startMs) / 86_400_000) % length) + length) % length + 1;
  const period = Number(profile.periodDurationDays ?? 5n);
  const phase = day <= period ? CyclePhase.menstrual : day <= 13 ? CyclePhase.follicular : day <= 16 ? CyclePhase.ovulatory : CyclePhase.luteal;
  const phaseStart = phase === CyclePhase.menstrual ? 1 : phase === CyclePhase.follicular ? period + 1 : phase === CyclePhase.ovulatory ? 14 : 17;
  const phaseEnd = phase === CyclePhase.menstrual ? period : phase === CyclePhase.follicular ? 13 : phase === CyclePhase.ovulatory ? 16 : length;
  return { currentPhase: phase, phaseLengthDays: BigInt(Math.max(1, phaseEnd - phaseStart + 1)), dayOfCycle: BigInt(day), phaseStartDay: BigInt(phaseStart), cycleTip: "Listen to your body and adjust your movement and nutrition to how you feel." };
}
function makeWorkout(profile: OnboardingProfile | null): WorkoutTemplate | null {
  if (!profile) return null;
  const phase = getCycleInfo(profile)!.currentPhase;
  const exercises: Exercise[] = [{ name: "Gentle warm-up", sets: 1n, reps: "5 min", notes: "Move comfortably" }, { name: profile.fitnessGoal === FitnessGoal.muscleGain ? "Strength circuit" : "Full-body movement", sets: 3n, reps: "10–12", notes: "Choose a comfortable intensity" }, { name: "Cool-down stretches", sets: 1n, reps: "5 min", notes: "Breathe and stretch gently" }];
  return { id: `workout-${phase}`, title: `${phase[0].toUpperCase()}${phase.slice(1)} phase movement`, goal: profile.fitnessGoal, exercises, phase, durationMin: 30n };
}
function makeMeal(profile: OnboardingProfile | null): MealTemplate | null {
  if (!profile) return null;
  const phase = getCycleInfo(profile)!.currentPhase;
  return { id: `meal-${phase}`, title: "Balanced daily nourishment", calories: 1800n, phase, dietPref: profile.dietPrefs?.[0] ?? DietaryPreference.none, meals: [{ name: "Breakfast", portion: "Balanced serving", notes: "Include protein and fibre" }, { name: "Lunch", portion: "Balanced serving", notes: "Include vegetables and whole grains" }, { name: "Dinner", portion: "Balanced serving", notes: "Choose foods that suit your preferences" }] };
}
export function useBackendActor() {
  const { session } = useAuth();
  const id = session?.user.id;
  const actor = id ? {
    getDailyLog: (date: string) => getLog(id, date),
    getCycleHistory: async (): Promise<CycleEntry[]> => { const p = await getProfile(id); if (!p) return []; const cycle = p.cycleLengthDays * 86_400_000_000_000n; return [-2n, -1n, 0n].map((n) => ({ startDate: p.cycleStartDate + n * cycle, lengthDays: p.cycleLengthDays })); },
  } : null;
  return { actor, isFetching: false };
}
export function useOnboardingProfile() { const { session } = useAuth(); const id = session?.user.id; return useQuery<OnboardingProfile | null>({ queryKey: ["onboardingProfile", id], queryFn: () => getProfile(id!), enabled: !!id }); }
function useSaveProfile() { const { session } = useAuth(); const id = session?.user.id; const qc = useQueryClient(); return useMutation({ mutationFn: (p: OnboardingProfile) => { if (!id) throw new Error("Please sign in again."); return saveProfile(id, p); }, onSuccess: () => { void qc.invalidateQueries(); } }); }
export function useSaveOnboardingProfile(_ignored?: unknown) { return { ...useSaveProfile(), isActorReady: true }; }
export function useUpdateOnboardingProfile() { return useSaveProfile(); }
export function useCycleInfo() { const { data: profile, isLoading } = useOnboardingProfile(); return useQuery<CycleInfo | null>({ queryKey: ["cycleInfo", profile?.cycleStartDate?.toString()], queryFn: async () => getCycleInfo(profile ?? null), enabled: !isLoading }); }
export function useUpdateCycleStartDate() { const { data: profile } = useOnboardingProfile(); const mutation = useSaveProfile(); return { ...mutation, mutate: (ns: bigint, callbacks?: { onSuccess?: () => void; onError?: () => void }) => { if (!profile) return; mutation.mutate({ ...profile, cycleStartDate: ns }, { onSuccess: callbacks?.onSuccess, onError: callbacks?.onError }); }, mutateAsync: async (ns: bigint) => { if (!profile) throw new Error("Profile not found"); return mutation.mutateAsync({ ...profile, cycleStartDate: ns }); } }; }
export function useTodaysWorkout() { const { data: profile, isLoading } = useOnboardingProfile(); return useQuery<WorkoutTemplate | null>({ queryKey: ["todaysWorkout", profile?.fitnessGoal, profile?.cycleStartDate?.toString()], queryFn: async () => makeWorkout(profile ?? null), enabled: !isLoading }); }
export function useTodaysMealPlan() { const { data: profile, isLoading } = useOnboardingProfile(); return useQuery<MealTemplate | null>({ queryKey: ["todaysMealPlan", profile?.cycleStartDate?.toString()], queryFn: async () => makeMeal(profile ?? null), enabled: !isLoading }); }
export function useDailyLog(date: string) { const { session } = useAuth(); const id = session?.user.id; return useQuery<DailyLog | null>({ queryKey: ["dailyLog", id, date], queryFn: () => getLog(id!, date), enabled: !!id && !!date }); }
function useLogMutation() { const { session } = useAuth(); const id = session?.user.id; const qc = useQueryClient(); const mutation = useMutation({ mutationFn: async ({ date, update }: { date: string; update: (log: DailyLog) => DailyLog }) => { if (!id) throw new Error("Please sign in again."); await saveLog(id, update(await getLog(id, date))); }, onSuccess: () => { void qc.invalidateQueries({ queryKey: ["dailyLog", id] }); } }); return { ...mutation, run: (date: string, update: (log: DailyLog) => DailyLog, cb?: { onSuccess?: () => void; onError?: () => void }) => mutation.mutate({ date, update }, { onSuccess: cb?.onSuccess, onError: cb?.onError }), runAsync: (date: string, update: (log: DailyLog) => DailyLog) => mutation.mutateAsync({ date, update }) }; }
export function useLogWorkoutComplete() { const m = useLogMutation(); return { ...m, mutate: (date: string, cb?: { onSuccess?: () => void; onError?: () => void }) => m.run(date, (l) => ({ ...l, workoutDone: true, workoutTimestamp: BigInt(Date.now()) * 1_000_000n }), cb), mutateAsync: (date: string) => m.runAsync(date, (l) => ({ ...l, workoutDone: true, workoutTimestamp: BigInt(Date.now()) * 1_000_000n })) }; }
export function useLogMeal() { const m = useLogMutation(); return { ...m, mutate: (v: { date: string; mealName: string }, cb?: { onSuccess?: () => void; onError?: () => void }) => m.run(v.date, (l) => ({ ...l, mealsLogged: [...l.mealsLogged.filter((x) => x.mealName !== v.mealName), { mealName: v.mealName, timestamp: BigInt(Date.now()) * 1_000_000n }] }), cb), mutateAsync: (v: { date: string; mealName: string }) => m.runAsync(v.date, (l) => ({ ...l, mealsLogged: [...l.mealsLogged.filter((x) => x.mealName !== v.mealName), { mealName: v.mealName, timestamp: BigInt(Date.now()) * 1_000_000n }] })) }; }
export function useLogWater() { const m = useLogMutation(); return { ...m, mutate: (v: { date: string; ml: bigint }, cb?: { onSuccess?: () => void; onError?: () => void }) => m.run(v.date, (l) => ({ ...l, waterMl: v.ml }), cb), mutateAsync: (v: { date: string; ml: bigint }) => m.runAsync(v.date, (l) => ({ ...l, waterMl: v.ml })) }; }
export function useLogWeight() { const m = useLogMutation(); return { ...m, mutate: (v: { date: string; weightKg: number }, cb?: { onSuccess?: () => void; onError?: () => void }) => m.run(v.date, (l) => ({ ...l, weightKg: v.weightKg }), cb), mutateAsync: (v: { date: string; weightKg: number }) => m.runAsync(v.date, (l) => ({ ...l, weightKg: v.weightKg })) }; }
export function useSubscription() { const { session } = useAuth(); const id = session?.user.id; return useQuery<Subscription | null>({ queryKey: ["subscription", id], queryFn: async () => { const rows = await apiRequest<{ data: Record<string, unknown> }[]>("subscriptions", { query: `${ownRow(id!)}&select=data&limit=1` }); const d = rows[0]?.data; if (!d) return null; return { tier: d.tier as Tier, status: d.status as SubscriptionStatus, startDate: BigInt(String(d.startDate ?? 0)), trialEndsAt: BigInt(String(d.trialEndsAt ?? 0)), renewalDate: d.renewalDate ? BigInt(String(d.renewalDate)) : undefined, stripeSessionId: d.stripeSessionId as string | undefined }; }, enabled: !!id }); }
export function useInitFreeTrial() { const { session } = useAuth(); const id = session?.user.id; const qc = useQueryClient(); const mutation = useMutation({ mutationFn: async () => { if (!id) throw new Error("Please sign in again."); const start = BigInt(Date.now()) * 1_000_000n; const end = start + 7n * 24n * 60n * 60n * 1_000_000_000n; await apiRequest("subscriptions", { method: "POST", query: "on_conflict=user_id", prefer: "resolution=ignore-duplicates,return=minimal", body: { user_id: id, data: { tier: "freeTrial", status: "active", startDate: start.toString(), trialEndsAt: end.toString() } } }); }, onSuccess: () => { void qc.invalidateQueries({ queryKey: ["subscription", id] }); } }); return { ...mutation, isActorReady: true }; }
function unavailable() { throw new Error("Paid subscription changes require a trusted server/Edge Function and verified Stripe webhook. They are intentionally disabled in the browser."); }
export function useCancelSubscription() { return useMutation({ mutationFn: unavailable }); }
export function useGrantDummySubscription() { return useMutation({ mutationFn: unavailable }); }
export function useCreateSubscriptionCheckout() { return useMutation({ mutationFn: unavailable }); }
export function useActivateSubscription() { return useMutation({ mutationFn: unavailable }); }
export function useCycleHistory() { const { actor, isFetching } = useBackendActor(); return useQuery<CycleEntry[]>({ queryKey: ["cycleHistory"], queryFn: async () => actor ? actor.getCycleHistory() : [], enabled: !!actor && !isFetching }); }
