import { useActor } from "@caffeineai/core-infrastructure";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createActor } from "../backend";
import type {
  CycleInfo,
  DailyLog,
  MealTemplate,
  OnboardingProfile,
  Subscription,
  SubscriptionTier,
  WorkoutTemplate,
} from "../types";

export function useBackendActor() {
  return useActor(createActor);
}

export function useOnboardingProfile() {
  const { actor, isFetching } = useBackendActor();
  return useQuery<OnboardingProfile | null>({
    queryKey: ["onboardingProfile"],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getOnboardingProfile();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useSaveOnboardingProfile(
  sharedActor?: ReturnType<typeof useBackendActor>["actor"],
) {
  const { actor: ownActor, isFetching } = useBackendActor();
  const actor = sharedActor !== undefined ? sharedActor : ownActor;
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: async (profile: OnboardingProfile) => {
      if (!actor) throw new Error("Actor not available");
      return actor.saveOnboardingProfile(profile);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["onboardingProfile"] });
      queryClient.invalidateQueries({ queryKey: ["cycleInfo"] });
      queryClient.invalidateQueries({ queryKey: ["subscription"] });
    },
  });
  return { ...mutation, isActorReady: !!actor && !isFetching };
}

export function useUpdateOnboardingProfile() {
  const { actor } = useBackendActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (profile: OnboardingProfile) => {
      if (!actor) throw new Error("Actor not available");
      return actor.updateOnboardingProfile(profile);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["onboardingProfile"] });
      queryClient.invalidateQueries({ queryKey: ["cycleInfo"] });
      queryClient.invalidateQueries({ queryKey: ["cycleHistory"] });
    },
  });
}

export function useCycleInfo() {
  const { actor, isFetching } = useBackendActor();
  return useQuery<CycleInfo | null>({
    queryKey: ["cycleInfo"],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getCycleInfo();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useUpdateCycleStartDate() {
  const { actor } = useBackendActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (newStartDateNs: bigint) => {
      if (!actor) throw new Error("Actor not available");
      return actor.updateCycleStartDate(newStartDateNs);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cycleInfo"] });
      queryClient.invalidateQueries({ queryKey: ["todaysWorkout"] });
      queryClient.invalidateQueries({ queryKey: ["todaysMealPlan"] });
    },
  });
}

export function useTodaysWorkout() {
  const { actor, isFetching } = useBackendActor();
  return useQuery<WorkoutTemplate | null>({
    queryKey: ["todaysWorkout"],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getTodaysWorkout();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useTodaysMealPlan() {
  const { actor, isFetching } = useBackendActor();
  return useQuery<MealTemplate | null>({
    queryKey: ["todaysMealPlan"],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getTodaysMealPlan();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useDailyLog(date: string) {
  const { actor, isFetching } = useBackendActor();
  return useQuery<DailyLog | null>({
    queryKey: ["dailyLog", date],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getDailyLog(date);
    },
    enabled: !!actor && !isFetching && !!date,
  });
}

export function useLogWorkoutComplete() {
  const { actor } = useBackendActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (date: string) => {
      if (!actor) throw new Error("Actor not available");
      return actor.logWorkoutComplete(date);
    },
    onSuccess: (_, date) => {
      queryClient.invalidateQueries({ queryKey: ["dailyLog", date] });
    },
  });
}

export function useLogMeal() {
  const { actor } = useBackendActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      date,
      mealName,
    }: { date: string; mealName: string }) => {
      if (!actor) throw new Error("Actor not available");
      return actor.logMeal(date, mealName);
    },
    onSuccess: (_, { date }) => {
      queryClient.invalidateQueries({ queryKey: ["dailyLog", date] });
    },
  });
}

export function useLogWater() {
  const { actor } = useBackendActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ date, ml }: { date: string; ml: bigint }) => {
      if (!actor) throw new Error("Actor not available");
      return actor.logWater(date, ml);
    },
    onSuccess: (_, { date }) => {
      queryClient.invalidateQueries({ queryKey: ["dailyLog", date] });
    },
  });
}

export function useLogWeight() {
  const { actor } = useBackendActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      date,
      weightKg,
    }: { date: string; weightKg: number }) => {
      if (!actor) throw new Error("Actor not available");
      return actor.logWeight(date, weightKg);
    },
    onSuccess: (_, { date }) => {
      queryClient.invalidateQueries({ queryKey: ["dailyLog", date] });
    },
  });
}

export function useGrantDummySubscription() {
  const { actor } = useBackendActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error("Actor not available");
      return actor.grantDummySubscription();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subscription"] });
    },
  });
}

export function useSubscription() {
  const { actor, isFetching } = useBackendActor();
  return useQuery<Subscription | null>({
    queryKey: ["subscription"],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getSubscription();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useInitFreeTrial(
  sharedActor?: ReturnType<typeof useBackendActor>["actor"],
) {
  const { actor: ownActor, isFetching } = useBackendActor();
  const actor = sharedActor !== undefined ? sharedActor : ownActor;
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error("Actor not available");
      return actor.initFreeTrial();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subscription"] });
    },
  });
  return { ...mutation, isActorReady: !!actor && !isFetching };
}

export function useCancelSubscription() {
  const { actor } = useBackendActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error("Actor not available");
      return actor.cancelSubscription();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subscription"] });
    },
  });
}

export function useCreateSubscriptionCheckout() {
  const { actor } = useBackendActor();
  return useMutation({
    mutationFn: async ({
      tier,
      successUrl,
      cancelUrl,
    }: {
      tier: SubscriptionTier;
      successUrl: string;
      cancelUrl: string;
    }) => {
      if (!actor) throw new Error("Actor not available");
      return actor.createSubscriptionCheckout(tier, successUrl, cancelUrl);
    },
  });
}

export function useActivateSubscription() {
  const { actor } = useBackendActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      sessionId,
      tier,
    }: { sessionId: string; tier: SubscriptionTier }) => {
      if (!actor) throw new Error("Actor not available");
      return actor.activateSubscription(sessionId, tier);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subscription"] });
    },
  });
}
