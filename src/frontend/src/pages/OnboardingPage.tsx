import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { useNavigate } from "@tanstack/react-router";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import {
  useBackendActor,
  useInitFreeTrial,
  useSaveOnboardingProfile,
} from "../hooks/use-backend";
import {
  DIET_PREF_LABELS,
  DietaryPreference,
  FITNESS_GOAL_LABELS,
  FITNESS_LEVEL_LABELS,
  FitnessGoal,
  FitnessLevel,
  type OnboardingProfile,
} from "../types";

// Static step keys — no index-based keys per linting rules
const STEP_KEYS = [
  "welcome",
  "name",
  "about",
  "goals",
  "diet",
  "cycle",
] as const;
type StepKey = (typeof STEP_KEYS)[number];
const TOTAL_STEPS = STEP_KEYS.length;

const GOAL_META: Record<FitnessGoal, { icon: string; desc: string }> = {
  [FitnessGoal.weightLoss]: {
    icon: "🔥",
    desc: "Burn fat & boost metabolism",
  },
  [FitnessGoal.muscleGain]: {
    icon: "💪",
    desc: "Build strength & lean muscle",
  },
  [FitnessGoal.maintenance]: {
    icon: "⚖️",
    desc: "Stay balanced & energised",
  },
};

const ORDERED_GOALS: FitnessGoal[] = [
  FitnessGoal.weightLoss,
  FitnessGoal.muscleGain,
  FitnessGoal.maintenance,
];

const ORDERED_LEVELS: FitnessLevel[] = [
  FitnessLevel.beginner,
  FitnessLevel.intermediate,
  FitnessLevel.advanced,
];

const ORDERED_DIETS: DietaryPreference[] = [
  DietaryPreference.none,
  DietaryPreference.vegetarian,
  DietaryPreference.vegan,
  DietaryPreference.glutenFree,
  DietaryPreference.dairyFree,
];

interface FormState {
  displayName: string;
  age: string;
  heightCm: string;
  weightKg: string;
  fitnessLevel: FitnessLevel | "";
  fitnessGoal: FitnessGoal | "";
  dietPrefs: DietaryPreference[];
  allergies: string;
  cycleStartDate: string;
  periodDurationDays: string;
  cycleLengthDays: string;
}

interface FieldErrors {
  displayName?: string;
  age?: string;
  heightCm?: string;
  weightKg?: string;
  fitnessLevel?: string;
  fitnessGoal?: string;
  cycleStartDate?: string;
  periodDurationDays?: string;
  cycleLengthDays?: string;
}

const INITIAL_FORM: FormState = {
  displayName: "",
  age: "",
  heightCm: "",
  weightKg: "",
  fitnessLevel: "",
  fitnessGoal: "",
  dietPrefs: [],
  allergies: "",
  cycleStartDate: "",
  periodDurationDays: "5",
  cycleLengthDays: "28",
};

// --- Sub-components ---

function ProgressBar({ step }: { step: number }) {
  // step 1 = welcome (no bar), step 2+ shows progress excluding welcome
  const progressStep = step - 1; // steps after welcome
  const progressTotal = TOTAL_STEPS - 1; // total steps excluding welcome
  const pct = ((progressStep - 1) / (progressTotal - 1)) * 100;
  return (
    <div className="w-full px-6 pt-6 pb-3">
      <div className="flex justify-between mb-2 text-xs text-muted-foreground font-body">
        <span>
          Step {step - 1} of {TOTAL_STEPS - 1}
        </span>
        <span>{Math.round(pct)}%</span>
      </div>
      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-primary rounded-full"
          initial={false}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.4, ease: "easeInOut" }}
        />
      </div>
    </div>
  );
}

function NavButtons({
  stepKey,
  onBack,
  onNext,
  nextLabel = "Continue",
  nextOcid,
  backOcid,
  disabled = false,
}: {
  stepKey: StepKey;
  onBack?: () => void;
  onNext: () => void;
  nextLabel?: string;
  nextOcid?: string;
  backOcid?: string;
  disabled?: boolean;
}) {
  return (
    <div className="pt-8 flex gap-3">
      {onBack && (
        <Button
          variant="outline"
          onClick={onBack}
          disabled={disabled}
          data-ocid={backOcid ?? `onboarding.${stepKey}.back_button`}
          className="flex-1 rounded-full h-12"
        >
          Back
        </Button>
      )}
      <Button
        onClick={onNext}
        disabled={disabled}
        data-ocid={nextOcid ?? `onboarding.${stepKey}.next_button`}
        className={cn(
          "rounded-full h-12 font-semibold shadow-warm-md",
          onBack ? "flex-1" : "w-full",
        )}
      >
        {nextLabel}
      </Button>
    </div>
  );
}

function FieldError({
  ocid,
  message,
}: {
  ocid: string;
  message?: string;
}) {
  if (!message) return null;
  return (
    <p data-ocid={ocid} className="text-xs text-destructive mt-1">
      {message}
    </p>
  );
}

// --- Validation ---

function validateName(f: FormState): FieldErrors {
  const e: FieldErrors = {};
  if (!f.displayName.trim()) e.displayName = "Please enter your name.";
  return e;
}

function validateAbout(f: FormState): FieldErrors {
  const e: FieldErrors = {};
  const age = Number.parseInt(f.age, 10);
  if (!f.age || Number.isNaN(age) || age < 16 || age > 80)
    e.age = "Please enter your age (16–80).";
  const h = Number.parseInt(f.heightCm, 10);
  if (!f.heightCm || Number.isNaN(h) || h < 120 || h > 220)
    e.heightCm = "Please enter a valid height (120–220 cm).";
  const w = Number.parseFloat(f.weightKg);
  if (!f.weightKg || Number.isNaN(w) || w < 30 || w > 250)
    e.weightKg = "Please enter a valid weight (30–250 kg).";
  if (!f.fitnessLevel) e.fitnessLevel = "Please select your fitness level.";
  return e;
}

function validateGoals(f: FormState): FieldErrors {
  const e: FieldErrors = {};
  if (!f.fitnessGoal) e.fitnessGoal = "Please select a goal.";
  return e;
}

function validateCycle(f: FormState): FieldErrors {
  const e: FieldErrors = {};
  if (!f.cycleStartDate) {
    e.cycleStartDate = "Please enter your last period start date.";
  } else {
    const [vYear, vMonth, vDay] = f.cycleStartDate.split("-");
    const d = new Date(
      Date.UTC(
        Number.parseInt(vYear, 10),
        Number.parseInt(vMonth, 10) - 1,
        Number.parseInt(vDay, 10),
      ),
    );
    if (Number.isNaN(d.getTime()) || d > new Date())
      e.cycleStartDate = "Please enter a valid date in the past.";
  }
  const pd = Number.parseInt(f.periodDurationDays, 10);
  if (!f.periodDurationDays || Number.isNaN(pd) || pd < 1 || pd > 10)
    e.periodDurationDays = "Period duration must be between 1 and 10 days.";
  const len = Number.parseInt(f.cycleLengthDays, 10);
  if (!f.cycleLengthDays || Number.isNaN(len) || len < 21 || len > 35)
    e.cycleLengthDays = "Cycle length must be between 21 and 35 days.";
  return e;
}

// --- Main Page ---

export default function OnboardingPage() {
  const navigate = useNavigate();
  const { actor, isFetching: isActorFetching } = useBackendActor();
  const isActorReady = !!actor && !isActorFetching;
  const saveProfile = useSaveOnboardingProfile(actor);
  const initTrial = useInitFreeTrial(actor);

  const [step, setStep] = useState(1);
  const [dir, setDir] = useState<1 | -1>(1);
  const [form, setForm] = useState<FormState>(INITIAL_FORM);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const currentKey = STEP_KEYS[step - 1];

  const setField = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((p) => ({ ...p, [key]: value }));
    setErrors((p) => ({ ...p, [key]: undefined }));
  };

  const toggleDiet = (pref: DietaryPreference) => {
    // If 'none' is already selected, block all other options entirely
    if (
      pref !== DietaryPreference.none &&
      form.dietPrefs.includes(DietaryPreference.none)
    ) {
      return;
    }
    setForm((p) => {
      const has = p.dietPrefs.includes(pref);
      if (pref === DietaryPreference.none) {
        return { ...p, dietPrefs: has ? [] : [DietaryPreference.none] };
      }
      const next = has
        ? p.dietPrefs.filter((d) => d !== pref)
        : p.dietPrefs.filter((d) => d !== DietaryPreference.none).concat(pref);
      return { ...p, dietPrefs: next };
    });
  };

  const blurField = (field: keyof FormState) => {
    const partial = validateAbout(form);
    const cyclePartial = validateCycle(form);
    const msg =
      partial[field as keyof FieldErrors] ??
      cyclePartial[field as keyof FieldErrors];
    setErrors((p) => ({ ...p, [field]: msg }));
  };

  const advance = (validate?: () => FieldErrors) => {
    if (validate) {
      const errs = validate();
      if (Object.keys(errs).length > 0) {
        setErrors(errs);
        return;
      }
    }
    setErrors({});
    setDir(1);
    setStep((s) => s + 1);
  };

  const retreat = () => {
    setErrors({});
    setDir(-1);
    setStep((s) => s - 1);
  };

  const handleFinish = async () => {
    const errs = validateCycle(form);
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    setIsSubmitting(true);
    try {
      // Parse YYYY-MM-DD date string as UTC midnight to avoid timezone offset issues
      const [cyYear, cyMonth, cyDay] = form.cycleStartDate.split("-");
      const utcCycleDate = new Date(
        Date.UTC(
          Number.parseInt(cyYear, 10),
          Number.parseInt(cyMonth, 10) - 1,
          Number.parseInt(cyDay, 10),
        ),
      );
      const startNs = BigInt(utcCycleDate.getTime()) * 1_000_000_000n;
      const profile: OnboardingProfile = {
        age: BigInt(Number.parseInt(form.age, 10)),
        heightCm: BigInt(Number.parseInt(form.heightCm, 10)),
        weightKg: Number.parseFloat(form.weightKg),
        fitnessLevel: form.fitnessLevel as FitnessLevel,
        fitnessGoal: form.fitnessGoal as FitnessGoal,
        dietPrefs:
          form.dietPrefs.length === 0
            ? [DietaryPreference.none]
            : form.dietPrefs,
        allergies: form.allergies
          .split(",")
          .map((a) => a.trim())
          .filter(Boolean),
        cycleStartDate: startNs,
        periodDurationDays: BigInt(
          Number.parseInt(form.periodDurationDays, 10),
        ),
        cycleLengthDays: BigInt(Number.parseInt(form.cycleLengthDays, 10)),
        displayName: form.displayName.trim(),
      };
      await saveProfile.mutateAsync(profile);
      await initTrial.mutateAsync();
      toast.success("Welcome to FemFit! Your free trial has started 🌸");
      navigate({ to: "/home" });
    } catch (err) {
      console.error(err);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const variants = {
    enter: (d: number) => ({ opacity: 0, x: d * 40 }),
    center: { opacity: 1, x: 0 },
    exit: (d: number) => ({ opacity: 0, x: d * -40 }),
  };

  return (
    <div
      className="min-h-screen bg-background flex flex-col"
      data-ocid="onboarding.page"
    >
      {/* Progress bar — hidden on welcome */}
      {step > 1 && <ProgressBar step={step} />}

      <div className="flex flex-col flex-1 overflow-y-auto">
        <AnimatePresence custom={dir} mode="wait" initial={false}>
          <motion.div
            key={currentKey}
            custom={dir}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.28, ease: "easeInOut" }}
            className="flex flex-col flex-1 px-6 py-8 max-w-md mx-auto w-full"
          >
            {/* STEP 1: Welcome */}
            {currentKey === "welcome" && (
              <div
                className="flex flex-col items-center justify-center flex-1 text-center"
                data-ocid="onboarding.welcome_step"
              >
                <div className="text-6xl mb-6">🌸</div>
                <h1 className="font-display text-5xl text-primary mb-3 leading-tight">
                  FemFit
                </h1>
                <p className="text-base text-muted-foreground font-body max-w-xs mb-2 leading-relaxed">
                  Cycle-synced fitness & nutrition, beautifully personalised for
                  you.
                </p>
                <p className="text-sm text-muted-foreground font-body mb-10">
                  Free 7-day trial — no card required.
                </p>
                <NavButtons
                  stepKey="welcome"
                  onNext={() => advance()}
                  nextLabel="Begin Your Journey 🌸"
                  nextOcid="onboarding.start_button"
                />
              </div>
            )}

            {/* STEP 2: What's your name? */}
            {currentKey === "name" && (
              <div
                className="flex flex-col flex-1"
                data-ocid="onboarding.name_step"
              >
                <div className="mb-10 text-center">
                  <div className="text-5xl mb-4">👋</div>
                  <h2 className="font-display text-3xl text-foreground mb-2">
                    What should we call you?
                  </h2>
                  <p className="text-sm text-muted-foreground font-body">
                    This is how you'll be greeted inside the app.
                  </p>
                </div>

                <div className="flex-1 space-y-2">
                  <Label
                    htmlFor="displayName"
                    className="text-sm font-body font-medium"
                  >
                    Your Name
                  </Label>
                  <Input
                    id="displayName"
                    type="text"
                    autoFocus
                    placeholder="e.g. Tanvi"
                    value={form.displayName}
                    onChange={(e) => setField("displayName", e.target.value)}
                    onBlur={() => {
                      if (!form.displayName.trim())
                        setErrors((p) => ({
                          ...p,
                          displayName: "Please enter your name.",
                        }));
                    }}
                    className={cn(
                      "rounded-xl h-12 text-base",
                      errors.displayName && "border-destructive",
                    )}
                    data-ocid="onboarding.display_name_input"
                  />
                  <FieldError
                    ocid="onboarding.display_name_input.field_error"
                    message={errors.displayName}
                  />
                  <p className="text-xs text-muted-foreground pt-1">
                    You can always change this later in your profile.
                  </p>
                </div>

                <NavButtons
                  stepKey="name"
                  onBack={retreat}
                  onNext={() => advance(() => validateName(form))}
                  nextLabel="Continue"
                />
              </div>
            )}

            {/* STEP 3: About You */}
            {currentKey === "about" && (
              <div
                className="flex flex-col flex-1"
                data-ocid="onboarding.about_step"
              >
                <h2 className="font-display text-3xl text-foreground mb-1">
                  About You
                </h2>
                <p className="text-sm text-muted-foreground font-body mb-8">
                  Help us understand your body and baseline.
                </p>

                <div className="space-y-5 flex-1">
                  {/* Age */}
                  <div className="space-y-1.5">
                    <Label
                      htmlFor="age"
                      className="text-sm font-body font-medium"
                    >
                      Age
                    </Label>
                    <Input
                      id="age"
                      type="number"
                      min={16}
                      max={80}
                      placeholder="e.g. 28"
                      value={form.age}
                      onChange={(e) => setField("age", e.target.value)}
                      onBlur={() => blurField("age")}
                      className={cn(
                        "rounded-xl",
                        errors.age && "border-destructive",
                      )}
                      data-ocid="onboarding.age_input"
                    />
                    <FieldError
                      ocid="onboarding.age_input.field_error"
                      message={errors.age}
                    />
                  </div>

                  {/* Height */}
                  <div className="space-y-1.5">
                    <Label
                      htmlFor="height"
                      className="text-sm font-body font-medium"
                    >
                      Height (cm)
                    </Label>
                    <Input
                      id="height"
                      type="number"
                      min={120}
                      max={220}
                      placeholder="e.g. 165"
                      value={form.heightCm}
                      onChange={(e) => setField("heightCm", e.target.value)}
                      onBlur={() => blurField("heightCm")}
                      className={cn(
                        "rounded-xl",
                        errors.heightCm && "border-destructive",
                      )}
                      data-ocid="onboarding.height_input"
                    />
                    <FieldError
                      ocid="onboarding.height_input.field_error"
                      message={errors.heightCm}
                    />
                  </div>

                  {/* Weight */}
                  <div className="space-y-1.5">
                    <Label
                      htmlFor="weight"
                      className="text-sm font-body font-medium"
                    >
                      Weight (kg)
                    </Label>
                    <Input
                      id="weight"
                      type="number"
                      min={30}
                      max={250}
                      step={0.1}
                      placeholder="e.g. 62.5"
                      value={form.weightKg}
                      onChange={(e) => setField("weightKg", e.target.value)}
                      onBlur={() => blurField("weightKg")}
                      className={cn(
                        "rounded-xl",
                        errors.weightKg && "border-destructive",
                      )}
                      data-ocid="onboarding.weight_input"
                    />
                    <FieldError
                      ocid="onboarding.weight_input.field_error"
                      message={errors.weightKg}
                    />
                  </div>

                  {/* Fitness Level */}
                  <div className="space-y-2">
                    <p className="text-sm font-body font-medium text-foreground">
                      Fitness Level
                    </p>
                    <div className="flex gap-2">
                      {ORDERED_LEVELS.map((level) => (
                        <button
                          key={level}
                          type="button"
                          onClick={() => setField("fitnessLevel", level)}
                          data-ocid={`onboarding.fitness_level.${level}`}
                          className={cn(
                            "flex-1 rounded-xl py-3 px-2 text-sm font-body font-medium border transition-smooth",
                            form.fitnessLevel === level
                              ? "bg-primary text-primary-foreground border-primary shadow-warm"
                              : "bg-card text-foreground border-border hover:border-primary/50",
                          )}
                        >
                          {FITNESS_LEVEL_LABELS[level]}
                        </button>
                      ))}
                    </div>
                    <FieldError
                      ocid="onboarding.fitness_level.field_error"
                      message={errors.fitnessLevel}
                    />
                  </div>
                </div>

                <NavButtons
                  stepKey="about"
                  onBack={retreat}
                  onNext={() => advance(() => validateAbout(form))}
                />
              </div>
            )}

            {/* STEP 3: Your Goals */}
            {currentKey === "goals" && (
              <div
                className="flex flex-col flex-1"
                data-ocid="onboarding.goals_step"
              >
                <h2 className="font-display text-3xl text-foreground mb-1">
                  Your Goal
                </h2>
                <p className="text-sm text-muted-foreground font-body mb-8">
                  Choose the focus that best describes what you want.
                </p>

                <div className="space-y-3 flex-1">
                  {ORDERED_GOALS.map((goal) => {
                    const selected = form.fitnessGoal === goal;
                    const meta = GOAL_META[goal];
                    return (
                      <button
                        key={goal}
                        type="button"
                        onClick={() => setField("fitnessGoal", goal)}
                        data-ocid={`onboarding.goal.${goal}`}
                        className={cn(
                          "w-full flex items-center gap-4 rounded-2xl p-4 border text-left transition-smooth",
                          selected
                            ? "bg-primary/8 border-primary shadow-warm"
                            : "bg-card border-border hover:border-primary/40 hover:bg-primary/4",
                        )}
                      >
                        <span className="text-3xl shrink-0">{meta.icon}</span>
                        <div className="min-w-0 flex-1">
                          <p
                            className={cn(
                              "font-body font-semibold text-sm",
                              selected ? "text-primary" : "text-foreground",
                            )}
                          >
                            {FITNESS_GOAL_LABELS[goal]}
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {meta.desc}
                          </p>
                        </div>
                        {selected && (
                          <div className="ml-auto w-5 h-5 rounded-full bg-primary flex items-center justify-center shrink-0">
                            <svg
                              className="w-3 h-3 text-primary-foreground"
                              fill="none"
                              viewBox="0 0 12 12"
                              aria-hidden="true"
                            >
                              <path
                                d="M2 6l3 3 5-5"
                                stroke="currentColor"
                                strokeWidth="1.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </svg>
                          </div>
                        )}
                      </button>
                    );
                  })}
                  <FieldError
                    ocid="onboarding.goal.field_error"
                    message={errors.fitnessGoal}
                  />
                </div>

                <NavButtons
                  stepKey="goals"
                  onBack={retreat}
                  onNext={() => advance(() => validateGoals(form))}
                />
              </div>
            )}

            {/* STEP 4: Dietary Preferences */}
            {currentKey === "diet" && (
              <div
                className="flex flex-col flex-1"
                data-ocid="onboarding.diet_step"
              >
                <h2 className="font-display text-3xl text-foreground mb-1">
                  Dietary Preferences
                </h2>
                <p className="text-sm text-muted-foreground font-body mb-8">
                  Select all that apply — we'll tailor your meal plans.
                </p>

                <div className="flex-1 space-y-5">
                  <div className="grid grid-cols-2 gap-3">
                    {ORDERED_DIETS.map((pref) => {
                      const selected = form.dietPrefs.includes(pref);
                      const noneSelected = form.dietPrefs.includes(
                        DietaryPreference.none,
                      );
                      const isDisabled =
                        pref !== DietaryPreference.none && noneSelected;
                      return (
                        <button
                          key={pref}
                          type="button"
                          onClick={() => toggleDiet(pref)}
                          data-ocid={`onboarding.diet.${pref}`}
                          disabled={isDisabled}
                          className={cn(
                            "rounded-2xl px-4 py-3 text-sm font-body font-medium border text-center transition-smooth",
                            selected
                              ? "bg-primary/8 border-primary text-primary shadow-warm"
                              : "bg-card border-border text-foreground hover:border-primary/40",
                            isDisabled &&
                              "opacity-40 cursor-not-allowed pointer-events-none",
                          )}
                        >
                          {DIET_PREF_LABELS[pref]}
                        </button>
                      );
                    })}
                  </div>

                  <div className="space-y-1.5">
                    <Label
                      htmlFor="allergies"
                      className="text-sm font-body font-medium"
                    >
                      Allergies{" "}
                      <span className="text-muted-foreground font-normal">
                        (optional)
                      </span>
                    </Label>
                    <Input
                      id="allergies"
                      type="text"
                      placeholder="e.g. nuts, shellfish"
                      value={form.allergies}
                      onChange={(e) => setField("allergies", e.target.value)}
                      className="rounded-xl"
                      data-ocid="onboarding.allergies_input"
                    />
                    <p className="text-xs text-muted-foreground">
                      Separate with commas if multiple.
                    </p>
                  </div>
                </div>

                <NavButtons
                  stepKey="diet"
                  onBack={retreat}
                  onNext={() => advance()}
                />
              </div>
            )}

            {/* STEP 5: Cycle Info */}
            {currentKey === "cycle" && (
              <div
                className="flex flex-col flex-1"
                data-ocid="onboarding.cycle_step"
              >
                <h2 className="font-display text-3xl text-foreground mb-1">
                  Cycle Info
                </h2>
                <p className="text-sm text-muted-foreground font-body mb-8">
                  We use this to sync your plans to your cycle phase.
                </p>

                <div className="space-y-5 flex-1">
                  {/* Cycle start date */}
                  <div className="space-y-1.5">
                    <Label
                      htmlFor="cycleStart"
                      className="text-sm font-body font-medium"
                    >
                      When did your last period start?
                    </Label>
                    <Input
                      id="cycleStart"
                      type="date"
                      max={new Date().toISOString().split("T")[0]}
                      value={form.cycleStartDate}
                      onChange={(e) =>
                        setField("cycleStartDate", e.target.value)
                      }
                      onBlur={() => blurField("cycleStartDate")}
                      className={cn(
                        "rounded-xl",
                        errors.cycleStartDate && "border-destructive",
                      )}
                      data-ocid="onboarding.cycle_start_input"
                    />
                    <FieldError
                      ocid="onboarding.cycle_start_input.field_error"
                      message={errors.cycleStartDate}
                    />
                  </div>

                  {/* Period duration */}
                  <div className="space-y-1.5">
                    <Label
                      htmlFor="periodDuration"
                      className="text-sm font-body font-medium"
                    >
                      Period Duration
                    </Label>
                    <Input
                      id="periodDuration"
                      type="number"
                      min={1}
                      max={10}
                      placeholder="5"
                      value={form.periodDurationDays}
                      onChange={(e) =>
                        setField("periodDurationDays", e.target.value)
                      }
                      onBlur={() => blurField("periodDurationDays")}
                      className={cn(
                        "rounded-xl",
                        errors.periodDurationDays && "border-destructive",
                      )}
                      data-ocid="onboarding.period_duration_input"
                    />
                    <p className="text-xs text-muted-foreground">
                      How many days does your period (bleeding) last? Typical
                      range: 2–7 days
                    </p>
                    <FieldError
                      ocid="onboarding.period_duration_input.field_error"
                      message={errors.periodDurationDays}
                    />
                  </div>

                  {/* Cycle length */}
                  <div className="space-y-1.5">
                    <Label
                      htmlFor="cycleLength"
                      className="text-sm font-body font-medium"
                    >
                      Average cycle length
                    </Label>
                    <Input
                      id="cycleLength"
                      type="number"
                      min={21}
                      max={35}
                      placeholder="28"
                      value={form.cycleLengthDays}
                      onChange={(e) =>
                        setField("cycleLengthDays", e.target.value)
                      }
                      onBlur={() => blurField("cycleLengthDays")}
                      className={cn(
                        "rounded-xl",
                        errors.cycleLengthDays && "border-destructive",
                      )}
                      data-ocid="onboarding.cycle_length_input"
                    />
                    <p className="text-xs text-muted-foreground">
                      21–35 days is typical
                    </p>
                    <FieldError
                      ocid="onboarding.cycle_length_input.field_error"
                      message={errors.cycleLengthDays}
                    />
                  </div>

                  {/* Live cycle day preview */}
                  {(() => {
                    if (!form.cycleStartDate || !form.cycleLengthDays)
                      return null;
                    const [sYear, sMonth, sDay] =
                      form.cycleStartDate.split("-");
                    const start = new Date(
                      Date.UTC(
                        Number.parseInt(sYear, 10),
                        Number.parseInt(sMonth, 10) - 1,
                        Number.parseInt(sDay, 10),
                      ),
                    );
                    const len = Number.parseInt(form.cycleLengthDays, 10);
                    if (Number.isNaN(len) || len < 1) return null;
                    const diffDays = Math.floor(
                      (Date.now() - start.getTime()) / 86_400_000,
                    );
                    const dayOfCycle = (((diffDays % len) + len) % len) + 1;
                    return (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.96 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="rounded-2xl bg-primary/8 border border-primary/20 px-4 py-3"
                      >
                        <p className="text-xs text-muted-foreground font-body mb-0.5">
                          Based on your input
                        </p>
                        <p className="text-sm font-body font-semibold text-primary">
                          You're on cycle day {dayOfCycle} 🌙
                        </p>
                      </motion.div>
                    );
                  })()}

                  <div className="rounded-2xl bg-muted/60 border border-border px-4 py-3 text-xs text-muted-foreground font-body">
                    🌸 Your cycle phase is calculated automatically — no daily
                    check-in needed. Update anytime in Profile.
                  </div>
                </div>

                {/* Finish CTA */}
                <div className="pt-8 flex gap-3">
                  <Button
                    variant="outline"
                    onClick={retreat}
                    disabled={isSubmitting}
                    data-ocid="onboarding.cycle.back_button"
                    className="flex-1 rounded-full h-12"
                  >
                    Back
                  </Button>
                  <Button
                    onClick={handleFinish}
                    disabled={isSubmitting || !isActorReady}
                    data-ocid="onboarding.finish_button"
                    className="flex-1 rounded-full h-12 font-semibold shadow-warm-md"
                  >
                    {isSubmitting
                      ? "Setting up…"
                      : !isActorReady
                        ? "Connecting…"
                        : "Finish 🎉"}
                  </Button>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
