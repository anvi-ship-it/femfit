import { ExerciseAnimationPanel } from "@/components/ExerciseAnimationPanel";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import {
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  Clock,
  Dumbbell,
  Flame,
  Leaf,
  Salad,
  Sparkles,
  Target,
  Zap,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import {
  useCycleInfo,
  useOnboardingProfile,
  useTodaysMealPlan,
  useTodaysWorkout,
  useUpdateOnboardingProfile,
} from "../hooks/use-backend";
import type { FitnessGoal } from "../types";
import {
  CYCLE_PHASE_COLORS,
  CYCLE_PHASE_LABELS,
  FITNESS_GOAL_LABELS,
} from "../types";
import type {
  MealTemplate,
  OnboardingProfile,
  WorkoutTemplate,
} from "../types";

// ─── Macro pill ────────────────────────────────────────────────────────────
function MacroPill({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color: string;
}) {
  return (
    <div className={cn("rounded-xl px-3 py-2 text-center flex-1", color)}>
      <p className="text-[10px] font-body uppercase tracking-wide opacity-70">
        {label}
      </p>
      <p className="text-sm font-display font-semibold">{value}</p>
    </div>
  );
}

// ─── Workout Card ───────────────────────────────────────────────────────────
function WorkoutCard({ workout }: { workout: WorkoutTemplate }) {
  const [panelOpen, setPanelOpen] = useState(false);
  const phaseColor =
    CYCLE_PHASE_COLORS[workout.phase] ?? "text-primary bg-primary/10";

  return (
    <>
      <button
        type="button"
        className="overflow-hidden border border-border shadow-warm-md cursor-pointer hover:shadow-warm transition-shadow duration-200 rounded-xl bg-card text-left w-full block"
        data-ocid="plans.workout_card"
        onClick={() => setPanelOpen(true)}
        aria-label={`Open ${workout.title} exercise details`}
      >
        {/* Header */}
        <div className="bg-primary/5 px-4 py-4 pb-3 space-y-0">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="bg-primary/15 rounded-xl p-2.5 shrink-0">
                <Dumbbell className="size-5 text-primary" />
              </div>
              <div className="min-w-0">
                <h3 className="font-display text-lg text-foreground leading-tight">
                  {workout.title}
                </h3>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <Badge
                    variant="outline"
                    className={cn(
                      "text-[10px] px-2 py-0.5 rounded-full font-body",
                      phaseColor,
                    )}
                  >
                    {CYCLE_PHASE_LABELS[workout.phase] ?? workout.phase}
                  </Badge>
                  <span className="text-xs text-muted-foreground font-body flex items-center gap-1">
                    <Clock className="size-3" />
                    {workout.durationMin.toString()} min
                  </span>
                </div>
              </div>
            </div>
            <div className="text-muted-foreground p-1 mt-0.5 shrink-0">
              <ChevronDown className="size-4" />
            </div>
          </div>

          {/* Stats row */}
          <div className="flex items-center gap-4 mt-3 pt-3 border-t border-border/40">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-body">
              <Zap className="size-3.5 text-accent" />
              <span className="capitalize">
                {workout.goal.replace(/([A-Z])/g, " $1")}
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-body">
              <Flame className="size-3.5 text-primary" />
              <span>{workout.exercises.length} exercises</span>
            </div>
          </div>
        </div>

        {/* Preview hint */}
        <div className="px-4 py-2.5">
          <p className="text-xs text-primary font-body font-medium flex items-center gap-1">
            <Sparkles className="size-3" />
            Tap to see animated exercise guide
          </p>
        </div>
      </button>

      <ExerciseAnimationPanel
        workout={workout}
        open={panelOpen}
        onClose={() => setPanelOpen(false)}
      />
    </>
  );
}

// ─── Meal Card ──────────────────────────────────────────────────────────────
function MealCard({ meal }: { meal: MealTemplate }) {
  // Estimate macros from calories (approximate proportions)
  const cal = Number(meal.calories);
  const protein = Math.round((cal * 0.3) / 4);
  const carbs = Math.round((cal * 0.45) / 4);
  const fat = Math.round((cal * 0.25) / 9);

  return (
    <Card
      className="overflow-hidden border-border shadow-warm-md"
      data-ocid="plans.meal_card"
    >
      {/* Header */}
      <CardHeader className="bg-secondary/5 px-4 py-4 pb-3 space-y-0">
        <div className="flex items-start gap-3">
          <div className="bg-secondary/15 rounded-xl p-2.5 shrink-0">
            <Salad className="size-5 text-secondary" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="font-display text-lg text-foreground leading-tight">
              {meal.title}
            </h3>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <span className="text-xs text-muted-foreground font-body flex items-center gap-1">
                <Flame className="size-3" />
                {meal.calories.toString()} kcal total
              </span>
              <Badge
                variant="outline"
                className={cn(
                  "text-[10px] px-2 py-0.5 rounded-full font-body",
                  CYCLE_PHASE_COLORS[meal.phase] ??
                    "text-secondary bg-secondary/10",
                )}
              >
                {CYCLE_PHASE_LABELS[meal.phase] ?? meal.phase}
              </Badge>
            </div>
          </div>
        </div>

        {/* Macro breakdown */}
        <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border/40">
          <MacroPill
            label="Carbs"
            value={`${carbs}g`}
            color="bg-accent/10 text-accent"
          />
          <MacroPill
            label="Protein"
            value={`${protein}g`}
            color="bg-primary/8 text-primary"
          />
          <MacroPill
            label="Fat"
            value={`${fat}g`}
            color="bg-secondary/10 text-secondary"
          />
        </div>
      </CardHeader>

      {/* Meal items grid */}
      <CardContent className="px-4 py-3 space-y-1">
        {meal.meals.map((item, i) => (
          <div
            key={`${item.name}-${i}`}
            className="flex items-start justify-between gap-3 py-2 border-b border-border/40 last:border-0"
            data-ocid={`plans.meal.item.${i + 1}`}
          >
            <div className="min-w-0 flex-1">
              <p className="text-sm font-body text-foreground">{item.name}</p>
              {item.notes && (
                <p className="text-xs text-muted-foreground mt-0.5">
                  {item.notes}
                </p>
              )}
            </div>
            <span className="text-xs text-muted-foreground whitespace-nowrap font-body shrink-0 mt-0.5">
              {item.portion}
            </span>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

// ─── Goal Change Section ────────────────────────────────────────────────────
function GoalChangeSection({ profile }: { profile: OnboardingProfile }) {
  const [selectedGoal, setSelectedGoal] = useState<string>(profile.fitnessGoal);
  const [saved, setSaved] = useState(false);
  const updateProfile = useUpdateOnboardingProfile();

  const goals: { value: string; label: string }[] = [
    { value: "weightLoss", label: "Weight Loss" },
    { value: "muscleGain", label: "Muscle Gain" },
    { value: "maintenance", label: "Maintenance" },
  ];

  const isDirty = selectedGoal !== profile.fitnessGoal;

  const handleSave = () => {
    updateProfile.mutate(
      { ...profile, fitnessGoal: selectedGoal as FitnessGoal },
      {
        onSuccess: () => {
          setSaved(true);
          toast.success("Goal updated! Your plans will refresh.");
          setTimeout(() => setSaved(false), 3000);
        },
        onError: () => {
          toast.error("Failed to update goal. Please try again.");
        },
      },
    );
  };

  return (
    <Card className="border-border shadow-warm" data-ocid="plans.goal_section">
      <CardHeader className="px-4 pt-4 pb-3">
        <div className="flex items-center gap-2">
          <div className="bg-accent/15 rounded-lg p-1.5">
            <Target className="size-4 text-accent" />
          </div>
          <h3 className="font-display text-base text-foreground">
            Your Fitness Goal
          </h3>
        </div>
      </CardHeader>
      <CardContent className="px-4 pb-4 space-y-3">
        {/* Current goal badge */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground font-body">
            Current:
          </span>
          <Badge
            variant="outline"
            className="text-xs px-2.5 py-0.5 rounded-full bg-accent/10 text-accent border-accent/20 font-body"
          >
            {FITNESS_GOAL_LABELS[profile.fitnessGoal] ?? profile.fitnessGoal}
          </Badge>
        </div>

        {/* Goal selector */}
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground font-body">
            Change goal
          </Label>
          <Select
            value={selectedGoal}
            onValueChange={(v) => {
              setSelectedGoal(v);
              setSaved(false);
            }}
          >
            <SelectTrigger
              className="w-full rounded-xl border-input"
              data-ocid="plans.goal_select"
            >
              <SelectValue placeholder="Select a goal" />
            </SelectTrigger>
            <SelectContent>
              {goals.map((g) => (
                <SelectItem
                  key={g.value}
                  value={g.value}
                  data-ocid={`plans.goal_option.${g.value}`}
                >
                  {g.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Save button */}
        <Button
          onClick={handleSave}
          disabled={!isDirty || updateProfile.isPending}
          className="w-full rounded-full font-body font-semibold"
          data-ocid="plans.goal_save_button"
        >
          {updateProfile.isPending
            ? "Saving…"
            : saved
              ? "Saved ✓"
              : "Save Goal"}
        </Button>

        {/* Info banner — shown after goal changes */}
        {isDirty && !saved && (
          <div
            className="flex items-start gap-2.5 bg-accent/8 border border-accent/20 rounded-xl px-3 py-3"
            data-ocid="plans.goal_update_banner"
          >
            <Sparkles className="size-4 text-accent mt-0.5 shrink-0" />
            <p className="text-xs text-accent font-body leading-relaxed">
              Switching to <strong>{FITNESS_GOAL_LABELS[selectedGoal]}</strong>{" "}
              will update your workout templates and meal plans to match your
              new focus.
            </p>
          </div>
        )}

        {saved && (
          <div
            className="flex items-start gap-2.5 bg-secondary/8 border border-secondary/20 rounded-xl px-3 py-3"
            data-ocid="plans.goal_saved_banner"
          >
            <CheckCircle2 className="size-4 text-secondary mt-0.5 shrink-0" />
            <p className="text-xs text-secondary font-body leading-relaxed">
              Your plans are now optimized for{" "}
              <strong>{FITNESS_GOAL_LABELS[selectedGoal]}</strong>. Workout and
              nutrition templates will reflect your new goal.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Loading skeletons ──────────────────────────────────────────────────────
function PlanSkeleton() {
  return (
    <div className="space-y-3" data-ocid="plans.loading_state">
      <Skeleton className="h-32 w-full rounded-2xl" />
      <Skeleton className="h-48 w-full rounded-2xl" />
      <Skeleton className="h-24 w-full rounded-2xl" />
    </div>
  );
}

// ─── Empty state ────────────────────────────────────────────────────────────
function EmptyPlansState() {
  return (
    <div
      className="rounded-2xl bg-muted/40 border border-dashed border-border p-10 text-center space-y-3"
      data-ocid="plans.empty_state"
    >
      <div className="size-14 bg-primary/8 rounded-full flex items-center justify-center mx-auto">
        <AlertCircle className="size-7 text-primary/60" />
      </div>
      <div>
        <p className="text-sm font-display text-foreground">No plans yet</p>
        <p className="text-xs text-muted-foreground font-body mt-1">
          Complete your onboarding to unlock cycle-synced workout and nutrition
          plans.
        </p>
      </div>
    </div>
  );
}

// ─── Main Page ──────────────────────────────────────────────────────────────
export default function PlansPage() {
  const { data: workout, isLoading: workoutLoading } = useTodaysWorkout();
  const { data: mealPlan, isLoading: mealLoading } = useTodaysMealPlan();
  const { data: cycleInfo, isLoading: cycleLoading } = useCycleInfo();
  const { data: profile, isLoading: profileLoading } = useOnboardingProfile();

  const isLoading =
    workoutLoading || mealLoading || cycleLoading || profileLoading;

  return (
    <div
      className="px-4 py-6 space-y-6 max-w-lg mx-auto"
      data-ocid="plans.page"
    >
      {/* Page header */}
      <div className="space-y-1">
        <h1 className="font-display text-2xl text-foreground">Your Plans</h1>
        {cycleInfo ? (
          <p className="text-sm text-muted-foreground font-body">
            Synced to your{" "}
            <span className="text-primary font-semibold">
              {CYCLE_PHASE_LABELS[cycleInfo.currentPhase] ??
                cycleInfo.currentPhase}{" "}
              phase
            </span>{" "}
            · Day {cycleInfo.dayOfCycle.toString()}
          </p>
        ) : (
          <p className="text-sm text-muted-foreground font-body">
            Cycle-synced fitness &amp; nutrition
          </p>
        )}
      </div>

      {/* Current goal banner */}
      {profile && (
        <div
          className="flex items-center gap-3 bg-card border border-border rounded-2xl px-4 py-3 shadow-warm"
          data-ocid="plans.current_goal_banner"
        >
          <div className="bg-accent/15 rounded-lg p-1.5 shrink-0">
            <Target className="size-4 text-accent" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] text-muted-foreground font-body uppercase tracking-wide">
              Active Goal
            </p>
            <p className="text-sm font-display text-foreground font-semibold">
              {FITNESS_GOAL_LABELS[profile.fitnessGoal] ?? profile.fitnessGoal}
            </p>
          </div>
          <Badge
            variant="outline"
            className={cn(
              "ml-auto text-[10px] px-2 py-0.5 rounded-full font-body shrink-0",
              cycleInfo
                ? (CYCLE_PHASE_COLORS[cycleInfo.currentPhase] ??
                    "text-primary bg-primary/10")
                : "text-primary bg-primary/10",
            )}
          >
            {cycleInfo
              ? (CYCLE_PHASE_LABELS[cycleInfo.currentPhase] ?? "Active")
              : "Active"}
          </Badge>
        </div>
      )}

      {/* Plans content */}
      {isLoading ? (
        <PlanSkeleton />
      ) : !profile ? (
        <EmptyPlansState />
      ) : (
        <div className="space-y-5">
          {/* Workout section */}
          <section className="space-y-3" data-ocid="plans.workout_section">
            <div className="flex items-center gap-2">
              <Dumbbell className="size-4 text-primary" />
              <h2 className="font-display text-base text-foreground">
                Workout Plan
              </h2>
            </div>
            {workout ? (
              <WorkoutCard workout={workout} />
            ) : (
              <div
                className="rounded-2xl bg-muted/40 border border-dashed border-border p-6 text-center"
                data-ocid="plans.workout.empty_state"
              >
                <Dumbbell className="size-7 text-muted-foreground mx-auto mb-2" />
                <p className="text-xs text-muted-foreground font-body">
                  No workout scheduled for today's cycle phase.
                </p>
              </div>
            )}
          </section>

          {/* Meal plan section */}
          <section className="space-y-3" data-ocid="plans.meal_section">
            <div className="flex items-center gap-2">
              <Leaf className="size-4 text-secondary" />
              <h2 className="font-display text-base text-foreground">
                Meal Plan
              </h2>
            </div>
            {mealPlan ? (
              <MealCard meal={mealPlan} />
            ) : (
              <div
                className="rounded-2xl bg-muted/40 border border-dashed border-border p-6 text-center"
                data-ocid="plans.meal.empty_state"
              >
                <Leaf className="size-7 text-muted-foreground mx-auto mb-2" />
                <p className="text-xs text-muted-foreground font-body">
                  No meal plan scheduled for today's cycle phase.
                </p>
              </div>
            )}
          </section>

          {/* Goal change section */}
          <GoalChangeSection profile={profile} />
        </div>
      )}
    </div>
  );
}
