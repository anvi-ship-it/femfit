import { ExerciseAnimationPanel } from "@/components/ExerciseAnimationPanel";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "@tanstack/react-router";
import {
  CheckCircle2,
  ChevronRight,
  Droplets,
  Dumbbell,
  Flame,
  Leaf,
  Moon,
  Sparkles,
  Sun,
  Wind,
} from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import {
  useCycleInfo,
  useDailyLog,
  useLogMeal,
  useLogWater,
  useLogWeight,
  useLogWorkoutComplete,
  useOnboardingProfile,
  useTodaysMealPlan,
  useTodaysWorkout,
} from "../hooks/use-backend";
import { CYCLE_PHASE_COLORS, CYCLE_PHASE_LABELS } from "../types";

const WATER_GOAL_ML = 2000;
const WATER_STEP_ML = 250n;

const PHASE_ICONS: Record<string, React.ReactNode> = {
  menstrual: <Moon className="size-4" />,
  follicular: <Sun className="size-4" />,
  ovulatory: <Sparkles className="size-4" />,
  luteal: <Wind className="size-4" />,
};

const PHASE_TIPS: Record<string, string> = {
  menstrual: "Rest and restore — honour your body's natural reset.",
  follicular: "Energy rises — great time for strength and new beginnings.",
  ovulatory: "Peak vitality — lean into social, high-intensity activities.",
  luteal: "Wind down and nourish — prep for your next cycle.",
};

function todayDateStr() {
  return new Date().toISOString().split("T")[0];
}

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good Morning";
  if (h < 17) return "Good Afternoon";
  return "Good Evening";
}

function formatDate() {
  return new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

function SkeletonCard({ lines = 3 }: { lines?: number }) {
  return (
    <div className="rounded-2xl bg-card border border-border shadow-warm p-4 space-y-3">
      <Skeleton className="h-5 w-2/3 rounded-lg" />
      <Skeleton className="h-3 w-1/3 rounded-lg" />
      {Array.from({ length: lines }).map((_, i) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: static count
        <Skeleton key={i} className="h-3 w-full rounded-lg" />
      ))}
    </div>
  );
}

export default function HomePage() {
  const today = todayDateStr();

  const { data: cycleInfo, isLoading: cycleLoading } = useCycleInfo();
  const { data: workout, isLoading: workoutLoading } = useTodaysWorkout();
  const { data: mealPlan, isLoading: mealLoading } = useTodaysMealPlan();
  const { data: dailyLog, isLoading: logLoading } = useDailyLog(today);

  const logWorkout = useLogWorkoutComplete();
  const logMeal = useLogMeal();
  const logWater = useLogWater();
  const logWeight = useLogWeight();

  const [weightInput, setWeightInput] = useState("");
  const [workoutPanelOpen, setWorkoutPanelOpen] = useState(false);

  const { data: profile } = useOnboardingProfile();

  const displayName = profile?.displayName?.trim();
  const greetingName = displayName || "there";

  const waterMl = Number(dailyLog?.waterMl ?? 0n);
  const waterPct = Math.min((waterMl / WATER_GOAL_ML) * 100, 100);
  const glassesLogged = Math.floor(waterMl / Number(WATER_STEP_ML));
  const glassesRemaining = Math.max(8 - glassesLogged, 0);

  const mealsLoggedSet = new Set(
    (dailyLog?.mealsLogged ?? []).map((m) => m.mealName),
  );

  function handleMarkWorkoutDone() {
    logWorkout.mutate(today, {
      onSuccess: () => toast.success("Workout logged! Great work 💪"),
      onError: () => toast.error("Could not log workout. Try again."),
    });
  }

  function handleLogMeal(mealName: string) {
    logMeal.mutate(
      { date: today, mealName },
      {
        onSuccess: () => toast.success(`${mealName} logged!`),
        onError: () => toast.error("Could not log meal. Try again."),
      },
    );
  }

  function handleAddWater() {
    const currentMl = BigInt(Math.round(waterMl));
    logWater.mutate(
      { date: today, ml: currentMl + WATER_STEP_ML },
      {
        onSuccess: () => toast.success("+250ml logged 💧"),
        onError: () => toast.error("Could not log water."),
      },
    );
  }

  function handleLogWeight() {
    const val = Number.parseFloat(weightInput);
    if (Number.isNaN(val) || val < 20 || val > 300) {
      toast.error("Enter a valid weight between 20–300 kg");
      return;
    }
    logWeight.mutate(
      { date: today, weightKg: val },
      {
        onSuccess: () => {
          toast.success(`Weight ${val} kg logged`);
          setWeightInput("");
        },
        onError: () => toast.error("Could not log weight."),
      },
    );
  }

  return (
    <div
      className="px-4 py-6 space-y-6 max-w-2xl mx-auto"
      data-ocid="home.page"
    >
      {/* Welcome header */}
      <motion.section
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="space-y-1"
        data-ocid="home.welcome_section"
      >
        <p className="text-muted-foreground text-sm font-body">
          {formatDate()}
        </p>
        <h1 className="font-display text-2xl text-foreground">
          {greeting()}, {greetingName}
        </h1>
      </motion.section>

      {/* ── Cycle Phase Card ─────────────────────────────── */}
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.05 }}
        data-ocid="home.cycle_section"
      >
        {cycleLoading ? (
          <SkeletonCard lines={2} />
        ) : cycleInfo ? (
          <div
            className="rounded-2xl bg-card border border-border shadow-warm-md overflow-hidden"
            data-ocid="home.cycle_card"
          >
            {/* Coloured top strip */}
            <div
              className={`h-1.5 w-full ${
                cycleInfo.currentPhase === "menstrual"
                  ? "bg-destructive/40"
                  : cycleInfo.currentPhase === "follicular"
                    ? "bg-primary/40"
                    : cycleInfo.currentPhase === "ovulatory"
                      ? "bg-accent/40"
                      : "bg-secondary/40"
              }`}
            />
            <div className="p-4 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Badge
                      variant="outline"
                      className={`text-xs font-body rounded-full px-2.5 py-0.5 gap-1.5 flex items-center ${CYCLE_PHASE_COLORS[cycleInfo.currentPhase]}`}
                      data-ocid="home.cycle.phase_badge"
                    >
                      {PHASE_ICONS[cycleInfo.currentPhase]}
                      {CYCLE_PHASE_LABELS[cycleInfo.currentPhase]} Phase
                    </Badge>
                  </div>
                  <p className="font-display text-xl text-foreground">
                    Day {cycleInfo.dayOfCycle.toString()} of your cycle
                  </p>
                  <p className="text-xs text-muted-foreground font-body">
                    Phase day{" "}
                    {(
                      BigInt(cycleInfo.dayOfCycle) -
                      cycleInfo.phaseStartDay +
                      1n
                    ).toString()}{" "}
                    of {cycleInfo.phaseLengthDays.toString()}
                  </p>
                </div>
                <div
                  className={`rounded-2xl p-2.5 ${CYCLE_PHASE_COLORS[cycleInfo.currentPhase]}`}
                >
                  {PHASE_ICONS[cycleInfo.currentPhase]}
                </div>
              </div>

              {/* Cycle-day progress dots */}
              <div className="flex gap-1 flex-wrap" aria-label="Cycle days">
                {Array.from({ length: 28 }).map((_, i) => {
                  const day = i + 1;
                  const isCurrent = day === Number(cycleInfo.dayOfCycle);
                  const isPast = day < Number(cycleInfo.dayOfCycle);
                  return (
                    <div
                      key={`cycle-day-${day}`}
                      className={`size-2 rounded-full transition-smooth ${
                        isCurrent
                          ? "bg-primary scale-125"
                          : isPast
                            ? "bg-primary/30"
                            : "bg-muted"
                      }`}
                    />
                  );
                })}
              </div>

              {/* Tip */}
              {cycleInfo.cycleTip ? (
                <div className="rounded-xl bg-muted/50 px-3 py-2.5 flex gap-2 items-start">
                  <span className="text-base mt-0.5">🌸</span>
                  <p className="text-xs text-foreground/75 font-body leading-relaxed">
                    {cycleInfo.cycleTip}
                  </p>
                </div>
              ) : (
                <div className="rounded-xl bg-muted/50 px-3 py-2.5 flex gap-2 items-start">
                  <span className="text-base mt-0.5">✨</span>
                  <p className="text-xs text-foreground/75 font-body leading-relaxed">
                    {PHASE_TIPS[cycleInfo.currentPhase]}
                  </p>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div
            className="rounded-2xl bg-primary/5 border border-primary/20 border-dashed p-5 text-center space-y-3"
            data-ocid="home.cycle.empty_state"
          >
            <Moon className="size-7 text-primary mx-auto" />
            <div>
              <p className="font-display text-base text-foreground">
                Track your cycle
              </p>
              <p className="text-xs text-muted-foreground font-body mt-1">
                Add your cycle start date to unlock phase-synced plans.
              </p>
            </div>
            <Link to="/onboarding" data-ocid="home.cycle.setup_link">
              <Button
                size="sm"
                className="rounded-full mt-1"
                data-ocid="home.cycle.setup_button"
              >
                Set up profile
              </Button>
            </Link>
          </div>
        )}
      </motion.section>

      {/* ── Today's Workout Card ──────────────────────────── */}
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        data-ocid="home.workout_section"
      >
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-display text-lg text-foreground">
            Today's Workout
          </h2>
          <Link
            to="/plans"
            data-ocid="home.plans_link"
            className="text-xs text-primary font-body flex items-center gap-0.5 hover:opacity-70 transition-colors duration-200"
          >
            View plans <ChevronRight className="size-3" />
          </Link>
        </div>

        {workoutLoading || logLoading ? (
          <div data-ocid="home.workout.loading_state">
            <SkeletonCard lines={4} />
          </div>
        ) : workout ? (
          <>
            <button
              type="button"
              className="rounded-2xl bg-card border border-border shadow-warm overflow-hidden cursor-pointer hover:shadow-warm-md transition-shadow duration-200 text-left w-full block"
              data-ocid="home.workout_card"
              onClick={() => setWorkoutPanelOpen(true)}
              aria-label={`Open ${workout.title} exercise details`}
            >
              <div className="p-4 space-y-4">
                {/* Header */}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-display text-base text-foreground">
                      {workout.title}
                    </h3>
                    <p className="text-xs text-muted-foreground font-body mt-0.5">
                      {workout.durationMin.toString()} min ·{" "}
                      {workout.exercises.length} exercises
                    </p>
                  </div>
                  <div className="bg-primary/10 rounded-xl p-2.5 shrink-0">
                    <Dumbbell className="size-4 text-primary" />
                  </div>
                </div>

                {/* Exercise preview — first 3 */}
                <div className="space-y-1 divide-y divide-border/50">
                  {workout.exercises.slice(0, 3).map((ex, idx) => (
                    <div
                      key={`${ex.name}-${idx}`}
                      className="flex items-center justify-between py-2 first:pt-0 last:pb-0"
                      data-ocid={`home.workout.exercise.${idx + 1}`}
                    >
                      <p className="text-sm text-foreground font-body font-medium truncate min-w-0">
                        {ex.name}
                      </p>
                      <span className="text-xs text-muted-foreground font-body shrink-0 ml-2 bg-muted/60 rounded-lg px-2 py-0.5">
                        {ex.sets.toString()} × {ex.reps}
                      </span>
                    </div>
                  ))}
                  {workout.exercises.length > 3 && (
                    <p className="text-xs text-primary font-body pt-2 flex items-center gap-1">
                      <Sparkles className="size-3" />+
                      {workout.exercises.length - 3} more — tap to see animated
                      guide
                    </p>
                  )}
                </div>

                {/* Intensity note */}
                {workout.phase && (
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-body">
                    <Flame className="size-3 text-accent" />
                    <span>
                      Optimised for your{" "}
                      <span className="text-foreground/80 font-medium">
                        {CYCLE_PHASE_LABELS[workout.phase]}
                      </span>{" "}
                      phase
                    </span>
                  </div>
                )}

                {/* Complete button */}
                {dailyLog?.workoutDone ? (
                  <div
                    className="flex items-center gap-2 text-sm text-secondary font-body font-medium bg-secondary/10 rounded-xl px-3 py-2"
                    data-ocid="home.workout.success_state"
                  >
                    <CheckCircle2 className="size-4" />
                    Workout completed — well done!
                  </div>
                ) : (
                  <Button
                    className="w-full rounded-full"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleMarkWorkoutDone();
                    }}
                    disabled={logWorkout.isPending}
                    data-ocid="home.workout.complete_button"
                  >
                    {logWorkout.isPending ? "Saving…" : "Mark as Done ✓"}
                  </Button>
                )}
              </div>
            </button>

            <ExerciseAnimationPanel
              workout={workout}
              open={workoutPanelOpen}
              onClose={() => setWorkoutPanelOpen(false)}
            />
          </>
        ) : (
          <div
            className="rounded-2xl bg-muted/40 border border-dashed border-border p-6 text-center space-y-3"
            data-ocid="home.workout.empty_state"
          >
            <Dumbbell className="size-7 text-muted-foreground mx-auto" />
            <div>
              <p className="text-sm font-body text-foreground/80 font-medium">
                No workout today
              </p>
              <p className="text-xs text-muted-foreground font-body mt-0.5">
                Set up your profile to get a personalised plan.
              </p>
            </div>
            <Link to="/onboarding">
              <Button
                variant="outline"
                size="sm"
                className="rounded-full"
                data-ocid="home.setup_workout_button"
              >
                Set up profile
              </Button>
            </Link>
          </div>
        )}
      </motion.section>

      {/* ── Today's Meal Plan Card ────────────────────────── */}
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.15 }}
        data-ocid="home.meal_section"
      >
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-display text-lg text-foreground">Meal Plan</h2>
          <Link
            to="/plans"
            data-ocid="home.meal_plans_link"
            className="text-xs text-primary font-body flex items-center gap-0.5 hover:opacity-70 transition-colors duration-200"
          >
            See all <ChevronRight className="size-3" />
          </Link>
        </div>

        {mealLoading ? (
          <div data-ocid="home.meal.loading_state">
            <SkeletonCard lines={4} />
          </div>
        ) : mealPlan ? (
          <div
            className="rounded-2xl bg-card border border-border shadow-warm overflow-hidden"
            data-ocid="home.meal_card"
          >
            <div className="p-4 space-y-4">
              {/* Header */}
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="font-display text-base text-foreground">
                    {mealPlan.title}
                  </h3>
                  <p className="text-xs text-muted-foreground font-body mt-0.5">
                    {mealPlan.calories.toString()} kcal ·{" "}
                    {mealPlan.meals.length} meals
                  </p>
                </div>
                <div className="bg-secondary/10 rounded-xl p-2.5 shrink-0">
                  <Leaf className="size-4 text-secondary" />
                </div>
              </div>

              {/* Meal rows */}
              <div className="space-y-2">
                {mealPlan.meals.map((meal, idx) => {
                  const isLogged = mealsLoggedSet.has(meal.name);
                  return (
                    <div
                      key={`${meal.name}-${idx}`}
                      className={`rounded-xl px-3 py-2.5 flex items-center justify-between gap-2 transition-smooth ${
                        isLogged ? "bg-secondary/10" : "bg-muted/40"
                      }`}
                      data-ocid={`home.meal.item.${idx + 1}`}
                    >
                      <div className="min-w-0 flex-1">
                        <p
                          className={`text-sm font-body font-medium truncate ${isLogged ? "text-secondary" : "text-foreground"}`}
                        >
                          {meal.name}
                        </p>
                        <p className="text-xs text-muted-foreground font-body">
                          {meal.portion}
                          {meal.notes ? ` · ${meal.notes}` : ""}
                        </p>
                      </div>
                      {isLogged ? (
                        <div className="flex items-center gap-1 text-xs text-secondary font-medium shrink-0">
                          <CheckCircle2 className="size-3.5" />
                          Logged
                        </div>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          className="rounded-full text-xs h-7 px-2.5 shrink-0"
                          onClick={() => handleLogMeal(meal.name)}
                          disabled={logMeal.isPending}
                          data-ocid={`home.meal.log_button.${idx + 1}`}
                        >
                          Log
                        </Button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ) : (
          <div
            className="rounded-2xl bg-muted/40 border border-dashed border-border p-6 text-center"
            data-ocid="home.meal.empty_state"
          >
            <Leaf className="size-7 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground font-body">
              No meal plan available yet.
            </p>
          </div>
        )}
      </motion.section>

      {/* ── Water Intake Tracker ──────────────────────────── */}
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
        data-ocid="home.water_section"
      >
        <h2 className="font-display text-lg text-foreground mb-3">
          Water Intake
        </h2>
        <div
          className="rounded-2xl bg-card border border-border shadow-warm p-4 space-y-4"
          data-ocid="home.water_card"
        >
          {/* Progress numbers */}
          <div className="flex items-end justify-between">
            <div>
              <span className="font-display text-2xl text-foreground">
                {logLoading ? "—" : waterMl}
              </span>
              <span className="text-xs text-muted-foreground font-body ml-1">
                / {WATER_GOAL_ML} ml
              </span>
            </div>
            <div className="text-right">
              <p className="text-xs text-muted-foreground font-body">
                {logLoading
                  ? "—"
                  : `${glassesRemaining} glass${glassesRemaining !== 1 ? "es" : ""} to go`}
              </p>
            </div>
          </div>

          {/* Progress bar */}
          <div
            className="w-full h-3 rounded-full bg-muted overflow-hidden"
            aria-label={`Water intake: ${waterMl} of ${WATER_GOAL_ML} ml`}
          >
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-accent/60 to-accent"
              initial={{ width: 0 }}
              animate={{ width: `${waterPct}%` }}
              transition={{ duration: 0.6, ease: "easeOut" }}
            />
          </div>

          {/* Glass dots — 8 fixed slots named by ordinal */}
          <div className="flex gap-1.5 flex-wrap" aria-label="Water glasses">
            {(
              [
                "one",
                "two",
                "three",
                "four",
                "five",
                "six",
                "seven",
                "eight",
              ] as const
            ).map((name, i) => (
              <div
                key={`glass-${name}`}
                className={`size-5 rounded-full border-2 transition-smooth flex items-center justify-center ${
                  i < glassesLogged
                    ? "bg-accent/40 border-accent/60"
                    : "bg-muted border-border"
                }`}
              >
                {i < glassesLogged && (
                  <Droplets className="size-2.5 text-accent" />
                )}
              </div>
            ))}
          </div>

          {/* Add water button */}
          <Button
            variant="outline"
            className="w-full rounded-full gap-2 border-border"
            onClick={handleAddWater}
            disabled={logWater.isPending || waterMl >= WATER_GOAL_ML}
            data-ocid="home.water.add_button"
          >
            <Droplets className="size-4 text-accent" />
            {waterMl >= WATER_GOAL_ML ? "Goal reached! 🎉" : "+ 250 ml"}
          </Button>
        </div>
      </motion.section>

      {/* ── Daily Progress Summary ────────────────────────── */}
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.25 }}
        data-ocid="home.progress_section"
      >
        <h2 className="font-display text-lg text-foreground mb-3">
          Daily Summary
        </h2>
        <div
          className="rounded-2xl bg-card border border-border shadow-warm p-4 space-y-4"
          data-ocid="home.progress_card"
        >
          {/* Stats grid */}
          <div className="grid grid-cols-3 gap-3">
            {[
              {
                icon: <Dumbbell className="size-4 text-primary" />,
                label: "Workout",
                value: logLoading
                  ? "—"
                  : dailyLog?.workoutDone
                    ? "Done ✓"
                    : "Pending",
                highlight: dailyLog?.workoutDone,
                ocid: "home.stats.workout_card",
              },
              {
                icon: <Flame className="size-4 text-accent" />,
                label: "Meals",
                value: logLoading
                  ? "—"
                  : `${dailyLog?.mealsLogged?.length ?? 0} / ${mealPlan?.meals?.length ?? "—"}`,
                highlight: false,
                ocid: "home.stats.meals_card",
              },
              {
                icon: <Droplets className="size-4 text-accent" />,
                label: "Water",
                value: logLoading
                  ? "—"
                  : `${Math.round((waterMl / 1000) * 10) / 10}L`,
                highlight: waterMl >= WATER_GOAL_ML,
                ocid: "home.stats.water_card",
              },
            ].map(({ icon, label, value, highlight, ocid }) => (
              <div
                key={label}
                className={`rounded-xl border p-3 text-center space-y-1.5 transition-smooth ${
                  highlight
                    ? "bg-secondary/10 border-secondary/30"
                    : "bg-muted/40 border-border"
                }`}
                data-ocid={ocid}
              >
                <div className="flex justify-center">{icon}</div>
                <p className="font-display text-sm text-foreground leading-tight">
                  {value}
                </p>
                <p className="text-[10px] text-muted-foreground font-body uppercase tracking-wide">
                  {label}
                </p>
              </div>
            ))}
          </div>

          {/* Weight log */}
          <div className="space-y-2" data-ocid="home.weight_section">
            <div className="flex items-center justify-between">
              <p className="text-sm font-body font-medium text-foreground">
                Weight today
              </p>
              {dailyLog?.weightKg != null && (
                <span className="text-xs text-muted-foreground font-body">
                  Last: {dailyLog.weightKg} kg
                </span>
              )}
            </div>
            <div className="flex gap-2">
              <Input
                type="number"
                min={20}
                max={300}
                step={0.1}
                placeholder="e.g. 63.5 kg"
                value={weightInput}
                onChange={(e) => setWeightInput(e.target.value)}
                className="rounded-xl h-9 text-sm font-body"
                data-ocid="home.weight.input"
                onKeyDown={(e) => e.key === "Enter" && handleLogWeight()}
              />
              <Button
                size="sm"
                className="rounded-xl h-9 px-4 shrink-0"
                onClick={handleLogWeight}
                disabled={logWeight.isPending || !weightInput}
                data-ocid="home.weight.save_button"
              >
                {logWeight.isPending ? "…" : "Save"}
              </Button>
            </div>
          </div>
        </div>
      </motion.section>

      {/* Branding footer for mobile */}
      <footer className="pt-2 pb-1 text-center md:hidden">
        <p className="text-[10px] text-muted-foreground/50">
          © {new Date().getFullYear()}. Built with love using{" "}
          <a
            href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(typeof window !== "undefined" ? window.location.hostname : "")}`}
            className="underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            caffeine.ai
          </a>
        </p>
      </footer>
    </div>
  );
}
