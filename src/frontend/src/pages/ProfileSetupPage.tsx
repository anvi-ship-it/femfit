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
import { markProfileComplete } from "../lib/local-auth";
import {
  DIET_PREF_LABELS,
  DietaryPreference,
  FITNESS_GOAL_LABELS,
  FITNESS_LEVEL_LABELS,
  FitnessGoal,
  FitnessLevel,
  HEALTH_CONDITION_LABELS,
  HealthCondition,
  type OnboardingProfile,
} from "../types";

// ─── Step config ──────────────────────────────────────────────────────────────

const STEPS = ["name", "metrics", "goals", "diet", "health", "cycle", "done"] as const;
type Step = (typeof STEPS)[number];

// ─── Form state ───────────────────────────────────────────────────────────────

interface FormState {
  displayName: string;
  age: string;
  heightCm: string;
  weightKg: string;
  fitnessLevel: FitnessLevel | "";
  fitnessGoal: FitnessGoal | "";
  dietPrefs: DietaryPreference[];
  allergies: string;
  healthConditions: HealthCondition[];
  cycleStartDate: string;
  periodDurationDays: string;
  cycleLengthDays: string;
}

const INITIAL: FormState = {
  displayName: "",
  age: "",
  heightCm: "",
  weightKg: "",
  fitnessLevel: "",
  fitnessGoal: "",
  dietPrefs: [],
  allergies: "",
  healthConditions: [],
  cycleStartDate: "",
  periodDurationDays: "5",
  cycleLengthDays: "28",
};

interface Errors {
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

// ─── Validation ───────────────────────────────────────────────────────────────

function validateName(f: FormState): Errors {
  const e: Errors = {};
  if (!f.displayName.trim()) e.displayName = "Please enter your name.";
  return e;
}

function validateMetrics(f: FormState): Errors {
  const e: Errors = {};
  const age = Number.parseInt(f.age, 10);
  if (!f.age || Number.isNaN(age) || age < 13 || age > 80) e.age = "Enter your age (13–80).";
  const h = Number.parseInt(f.heightCm, 10);
  if (!f.heightCm || Number.isNaN(h) || h < 120 || h > 220) e.heightCm = "Valid height: 120–220 cm.";
  const w = Number.parseFloat(f.weightKg);
  if (!f.weightKg || Number.isNaN(w) || w < 30 || w > 250) e.weightKg = "Valid weight: 30–250 kg.";
  if (!f.fitnessLevel) e.fitnessLevel = "Please select your fitness level.";
  return e;
}

function validateGoals(f: FormState): Errors {
  const e: Errors = {};
  if (!f.fitnessGoal) e.fitnessGoal = "Please select a goal.";
  return e;
}

function validateCycle(f: FormState): Errors {
  const e: Errors = {};
  if (!f.cycleStartDate) {
    e.cycleStartDate = "Please enter your last period start date.";
  } else {
    const [y, m, d] = f.cycleStartDate.split("-");
    const date = new Date(Date.UTC(+y, +m - 1, +d));
    if (Number.isNaN(date.getTime()) || date > new Date())
      e.cycleStartDate = "Please enter a valid past date.";
  }
  const pd = Number.parseInt(f.periodDurationDays, 10);
  if (!f.periodDurationDays || Number.isNaN(pd) || pd < 1 || pd > 10)
    e.periodDurationDays = "Period duration: 1–10 days.";
  const len = Number.parseInt(f.cycleLengthDays, 10);
  if (!f.cycleLengthDays || Number.isNaN(len) || len < 21 || len > 35)
    e.cycleLengthDays = "Cycle length: 21–35 days.";
  return e;
}

// ─── Shared UI ────────────────────────────────────────────────────────────────

function FieldError({ msg }: { msg?: string }) {
  if (!msg) return null;
  return <p className="text-xs text-destructive mt-1 font-body">{msg}</p>;
}

function CheckCard({
  selected,
  onClick,
  children,
  disabled,
}: {
  selected: boolean;
  onClick: () => void;
  children: React.ReactNode;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "w-full flex items-center justify-between rounded-xl border px-4 py-3 text-sm font-body font-medium transition-all duration-150 text-left",
        selected ? "border-primary bg-primary/5 text-primary" : "border-border bg-card text-foreground hover:border-primary/40",
        disabled && "opacity-40 cursor-not-allowed",
      )}
    >
      {children}
      {selected && (
        <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center shrink-0 ml-3">
          <svg viewBox="0 0 24 24" className="w-3 h-3 text-primary-foreground" fill="none">
            <title>Selected</title>
            <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      )}
    </button>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ProfileSetupPage() {
  const navigate = useNavigate();
  const { actor, isFetching: isActorFetching } = useBackendActor();
  const isActorReady = !!actor && !isActorFetching;
  const saveProfile = useSaveOnboardingProfile(actor);
  const initTrial = useInitFreeTrial(actor);

  const [step, setStep] = useState<Step>("name");
  const [dir, setDir] = useState<1 | -1>(1);
  const [form, setForm] = useState<FormState>(INITIAL);
  const [errors, setErrors] = useState<Errors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const currentIdx = STEPS.indexOf(step);
  const profileSteps = STEPS.slice(0, -1); // exclude "done"
  const progressPct = Math.round((currentIdx / (profileSteps.length - 1)) * 100);

  const setField = <K extends keyof FormState>(key: K, val: FormState[K]) => {
    setForm((p) => ({ ...p, [key]: val }));
    setErrors((p) => ({ ...p, [key]: undefined }));
  };

  const toggleList = <T,>(key: keyof FormState, item: T, noneItem?: T) => {
    setForm((p) => {
      const list = p[key] as T[];
      if (noneItem && item !== noneItem && list.includes(noneItem)) return p;
      const has = list.includes(item);
      if (item === noneItem) return { ...p, [key]: has ? [] : [noneItem] };
      const next = has ? list.filter((x) => x !== item) : [...list.filter((x) => x !== noneItem), item];
      return { ...p, [key]: next };
    });
  };

  const goTo = (s: Step, d: 1 | -1) => { setDir(d); setErrors({}); setStep(s); };

  const advance = (validate?: () => Errors) => {
    if (validate) {
      const errs = validate();
      if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    }
    goTo(STEPS[currentIdx + 1], 1);
  };

  const retreat = () => goTo(STEPS[currentIdx - 1], -1);

  const handleFinish = async () => {
    const errs = validateCycle(form);
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setIsSubmitting(true);
    try {
      const [y, m, d] = form.cycleStartDate.split("-");
      const utcDate = new Date(Date.UTC(+y, +m - 1, +d));
      const startNs = BigInt(utcDate.getTime()) * 1_000_000_000n;
      const profile: OnboardingProfile = {
        age: BigInt(Number.parseInt(form.age, 10)),
        heightCm: BigInt(Number.parseInt(form.heightCm, 10)),
        weightKg: Number.parseFloat(form.weightKg),
        fitnessLevel: form.fitnessLevel as FitnessLevel,
        fitnessGoal: form.fitnessGoal as FitnessGoal,
        dietPrefs: form.dietPrefs.length === 0 ? [DietaryPreference.none] : form.dietPrefs,
        allergies: form.allergies.split(",").map((a) => a.trim()).filter(Boolean),
        cycleStartDate: startNs,
        periodDurationDays: BigInt(Number.parseInt(form.periodDurationDays, 10)),
        cycleLengthDays: BigInt(Number.parseInt(form.cycleLengthDays, 10)),
        displayName: form.displayName.trim(),
      };
      await saveProfile.mutateAsync(profile);
      await initTrial.mutateAsync();
      markProfileComplete();
      goTo("done", 1);
      toast.success("Profile created! Welcome to FemFit 🌸");
      setTimeout(() => navigate({ to: "/home" }), 2200);
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

  const ORDERED_LEVELS: FitnessLevel[] = [FitnessLevel.beginner, FitnessLevel.intermediate, FitnessLevel.advanced];
  const ORDERED_GOALS: FitnessGoal[] = [FitnessGoal.weightLoss, FitnessGoal.muscleGain, FitnessGoal.maintenance];
  const GOAL_META: Record<FitnessGoal, { icon: string; desc: string }> = {
    [FitnessGoal.weightLoss]: { icon: "🔥", desc: "Burn fat & boost metabolism" },
    [FitnessGoal.muscleGain]: { icon: "💪", desc: "Build strength & lean muscle" },
    [FitnessGoal.maintenance]: { icon: "⚖️", desc: "Stay balanced & energised" },
  };
  const ORDERED_DIETS: DietaryPreference[] = [
    DietaryPreference.none, DietaryPreference.vegetarian, DietaryPreference.vegan,
    DietaryPreference.glutenFree, DietaryPreference.dairyFree,
  ];
  const ORDERED_CONDITIONS: HealthCondition[] = [
    HealthCondition.pcos, HealthCondition.pcod, HealthCondition.diabetes,
    HealthCondition.thyroidDisorder, HealthCondition.hormoneImbalance,
    HealthCondition.anemia, HealthCondition.hypertension, HealthCondition.heartCondition,
  ];

  return (
    <div className="relative flex flex-col min-h-screen bg-background overflow-hidden">
      <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-primary/10 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-80 h-80 rounded-full bg-accent/10 blur-3xl pointer-events-none" />

      <div className="flex flex-1 items-center justify-center px-5 py-8">
        <div className="relative z-10 w-full max-w-md">

          {/* Header */}
          <div className="flex items-center gap-3 mb-5">
            <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center shadow-sm">
              <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5 text-primary-foreground">
                <title>FemFit</title>
                <path d="M12 2C8.686 2 6 4.686 6 8c0 2.21.895 4.21 2.343 5.657L12 17.314l3.657-3.657A7.965 7.965 0 0 0 18 8c0-3.314-2.686-6-6-6Z" fill="currentColor" opacity="0.85" />
                <path d="M12 17.314V22M10 22h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </div>
            <div>
              <p className="font-display text-lg font-semibold text-primary leading-none">FemFit</p>
              <p className="text-xs text-muted-foreground font-body">Let's set up your profile</p>
            </div>
          </div>

          {/* Progress */}
          {step !== "done" && (
            <div className="mb-5">
              <div className="flex justify-between text-xs text-muted-foreground font-body mb-1.5">
                <span>Step {currentIdx + 1} of {profileSteps.length}</span>
                <span>{progressPct}%</span>
              </div>
              <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-primary rounded-full"
                  initial={false}
                  animate={{ width: `${progressPct}%` }}
                  transition={{ duration: 0.4, ease: "easeInOut" }}
                />
              </div>
            </div>
          )}

          {/* Card */}
          <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
            <AnimatePresence mode="wait" custom={dir}>
              <motion.div
                key={step}
                custom={dir}
                variants={variants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.22, ease: "easeInOut" }}
                className="px-6 py-7 space-y-5"
              >

                {/* ── NAME ──────────────────────────────────────────────── */}
                {step === "name" && (
                  <>
                    <div className="text-center space-y-1">
                      <div className="text-4xl mb-2">👋</div>
                      <h2 className="font-display text-2xl font-semibold text-foreground">What's your name?</h2>
                      <p className="text-sm text-muted-foreground">We'll personalise your experience</p>
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="name" className="font-body text-sm font-medium">Your name</Label>
                      <Input
                        id="name"
                        placeholder="e.g. Priya"
                        value={form.displayName}
                        autoFocus
                        onChange={(e) => setField("displayName", e.target.value)}
                        className="rounded-xl"
                      />
                      <FieldError msg={errors.displayName} />
                    </div>
                    <Button onClick={() => advance(() => validateName(form))} className="w-full rounded-xl font-semibold">
                      Continue
                    </Button>
                  </>
                )}

                {/* ── METRICS ───────────────────────────────────────────── */}
                {step === "metrics" && (
                  <>
                    <div className="text-center space-y-1">
                      <div className="text-4xl mb-2">📏</div>
                      <h2 className="font-display text-2xl font-semibold text-foreground">About you</h2>
                      <p className="text-sm text-muted-foreground">Helps us tailor your plans to your body</p>
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      {[
                        { id: "age", label: "Age", placeholder: "25", key: "age" as const },
                        { id: "height", label: "Height (cm)", placeholder: "160", key: "heightCm" as const },
                        { id: "weight", label: "Weight (kg)", placeholder: "60", key: "weightKg" as const },
                      ].map(({ id, label, placeholder, key }) => (
                        <div key={id} className="space-y-1.5">
                          <Label htmlFor={id} className="text-xs font-body font-medium">{label}</Label>
                          <Input
                            id={id}
                            type="number"
                            inputMode="decimal"
                            placeholder={placeholder}
                            value={form[key]}
                            onChange={(e) => setField(key, e.target.value)}
                            className="rounded-xl text-center px-2"
                          />
                          <FieldError msg={errors[key]} />
                        </div>
                      ))}
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-body font-medium">Fitness level</Label>
                      <div className="grid grid-cols-3 gap-2">
                        {ORDERED_LEVELS.map((lvl) => (
                          <button
                            key={lvl}
                            type="button"
                            onClick={() => setField("fitnessLevel", lvl)}
                            className={cn(
                              "rounded-xl border py-2.5 px-2 text-sm font-body font-medium transition-all duration-150",
                              form.fitnessLevel === lvl
                                ? "bg-primary text-primary-foreground border-primary"
                                : "bg-card text-muted-foreground border-border hover:border-primary/40",
                            )}
                          >
                            {FITNESS_LEVEL_LABELS[lvl]}
                          </button>
                        ))}
                      </div>
                      <FieldError msg={errors.fitnessLevel} />
                    </div>

                    <div className="flex gap-3">
                      <Button variant="outline" onClick={retreat} className="flex-1 rounded-xl">Back</Button>
                      <Button onClick={() => advance(() => validateMetrics(form))} className="flex-1 rounded-xl font-semibold">Continue</Button>
                    </div>
                  </>
                )}

                {/* ── GOALS ─────────────────────────────────────────────── */}
                {step === "goals" && (
                  <>
                    <div className="text-center space-y-1">
                      <div className="text-4xl mb-2">🎯</div>
                      <h2 className="font-display text-2xl font-semibold text-foreground">Your main goal</h2>
                      <p className="text-sm text-muted-foreground">What are you working towards?</p>
                    </div>

                    <div className="space-y-2.5">
                      {ORDERED_GOALS.map((goal) => {
                        const { icon, desc } = GOAL_META[goal];
                        const selected = form.fitnessGoal === goal;
                        return (
                          <button
                            key={goal}
                            type="button"
                            onClick={() => setField("fitnessGoal", goal)}
                            className={cn(
                              "w-full flex items-center gap-4 rounded-xl border px-4 py-3.5 text-left transition-all duration-150",
                              selected ? "border-primary bg-primary/5" : "border-border bg-card hover:border-primary/40",
                            )}
                          >
                            <span className="text-2xl">{icon}</span>
                            <div className="flex-1">
                              <p className={cn("font-body font-semibold text-sm", selected ? "text-primary" : "text-foreground")}>
                                {FITNESS_GOAL_LABELS[goal]}
                              </p>
                              <p className="text-xs text-muted-foreground">{desc}</p>
                            </div>
                            {selected && (
                              <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center shrink-0">
                                <svg viewBox="0 0 24 24" className="w-3 h-3 text-primary-foreground" fill="none">
                                  <title>Selected</title>
                                  <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                              </div>
                            )}
                          </button>
                        );
                      })}
                    </div>
                    <FieldError msg={errors.fitnessGoal} />

                    <div className="flex gap-3">
                      <Button variant="outline" onClick={retreat} className="flex-1 rounded-xl">Back</Button>
                      <Button onClick={() => advance(() => validateGoals(form))} className="flex-1 rounded-xl font-semibold">Continue</Button>
                    </div>
                  </>
                )}

                {/* ── DIET ──────────────────────────────────────────────── */}
                {step === "diet" && (
                  <>
                    <div className="text-center space-y-1">
                      <div className="text-4xl mb-2">🥗</div>
                      <h2 className="font-display text-2xl font-semibold text-foreground">Dietary preferences</h2>
                      <p className="text-sm text-muted-foreground">Select all that apply</p>
                    </div>

                    <div className="space-y-2">
                      {ORDERED_DIETS.map((pref) => {
                        const blocked = pref !== DietaryPreference.none && form.dietPrefs.includes(DietaryPreference.none);
                        return (
                          <CheckCard
                            key={pref}
                            selected={form.dietPrefs.includes(pref)}
                            disabled={blocked}
                            onClick={() => toggleList("dietPrefs", pref, DietaryPreference.none)}
                          >
                            {DIET_PREF_LABELS[pref]}
                          </CheckCard>
                        );
                      })}
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="allergies" className="text-sm font-body font-medium">
                        Allergies <span className="text-muted-foreground font-normal">(optional, comma-separated)</span>
                      </Label>
                      <Input
                        id="allergies"
                        placeholder="e.g. nuts, shellfish, soy"
                        value={form.allergies}
                        onChange={(e) => setField("allergies", e.target.value)}
                        className="rounded-xl"
                      />
                    </div>

                    <div className="flex gap-3">
                      <Button variant="outline" onClick={retreat} className="flex-1 rounded-xl">Back</Button>
                      <Button onClick={() => advance()} className="flex-1 rounded-xl font-semibold">Continue</Button>
                    </div>
                  </>
                )}

                {/* ── HEALTH CONDITIONS ─────────────────────────────────── */}
                {step === "health" && (
                  <>
                    <div className="text-center space-y-1">
                      <div className="text-4xl mb-2">🩺</div>
                      <h2 className="font-display text-2xl font-semibold text-foreground">Health conditions</h2>
                      <p className="text-sm text-muted-foreground">
                        Optional — helps us tailor safer plans for you
                      </p>
                    </div>

                    <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                      {ORDERED_CONDITIONS.map((cond) => (
                        <CheckCard
                          key={cond}
                          selected={form.healthConditions.includes(cond)}
                          onClick={() => toggleList("healthConditions", cond)}
                        >
                          {HEALTH_CONDITION_LABELS[cond]}
                        </CheckCard>
                      ))}
                    </div>

                    {form.healthConditions.length > 0 && (
                      <p className="text-xs text-muted-foreground bg-muted/60 rounded-lg px-3 py-2 font-body">
                        🌸 Your plans will be adapted with your health in mind. Always consult your doctor.
                      </p>
                    )}

                    <div className="flex gap-3">
                      <Button variant="outline" onClick={retreat} className="flex-1 rounded-xl">Back</Button>
                      <Button onClick={() => advance()} className="flex-1 rounded-xl font-semibold">
                        {form.healthConditions.length === 0 ? "Skip" : "Continue"}
                      </Button>
                    </div>
                  </>
                )}

                {/* ── CYCLE ─────────────────────────────────────────────── */}
                {step === "cycle" && (
                  <>
                    <div className="text-center space-y-1">
                      <div className="text-4xl mb-2">🌙</div>
                      <h2 className="font-display text-2xl font-semibold text-foreground">Your cycle</h2>
                      <p className="text-sm text-muted-foreground">Personalises workouts & meals to each phase</p>
                    </div>

                    <div className="space-y-4">
                      <div className="space-y-1.5">
                        <Label htmlFor="cycleStart" className="text-sm font-body font-medium">Last period start date</Label>
                        <Input
                          id="cycleStart"
                          type="date"
                          max={new Date().toISOString().split("T")[0]}
                          value={form.cycleStartDate}
                          onChange={(e) => setField("cycleStartDate", e.target.value)}
                          className="rounded-xl"
                        />
                        <FieldError msg={errors.cycleStartDate} />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <Label htmlFor="cycleLen" className="text-sm font-body font-medium">Cycle length (days)</Label>
                          <Input
                            id="cycleLen"
                            type="number"
                            inputMode="numeric"
                            placeholder="28"
                            min={21}
                            max={35}
                            value={form.cycleLengthDays}
                            onChange={(e) => setField("cycleLengthDays", e.target.value)}
                            className="rounded-xl text-center"
                          />
                          <FieldError msg={errors.cycleLengthDays} />
                        </div>
                        <div className="space-y-1.5">
                          <Label htmlFor="periodDur" className="text-sm font-body font-medium">Period duration (days)</Label>
                          <Input
                            id="periodDur"
                            type="number"
                            inputMode="numeric"
                            placeholder="5"
                            min={1}
                            max={10}
                            value={form.periodDurationDays}
                            onChange={(e) => setField("periodDurationDays", e.target.value)}
                            className="rounded-xl text-center"
                          />
                          <FieldError msg={errors.periodDurationDays} />
                        </div>
                      </div>

                      {/* Live cycle day preview */}
                      {form.cycleStartDate && !errors.cycleStartDate && (() => {
                        const [y, m, d] = form.cycleStartDate.split("-");
                        const start = new Date(Date.UTC(+y, +m - 1, +d));
                        const dayDiff = Math.floor((Date.now() - start.getTime()) / 86400000) + 1;
                        const len = Number.parseInt(form.cycleLengthDays, 10) || 28;
                        const cycleDay = ((dayDiff - 1) % len) + 1;
                        if (cycleDay > 0)
                          return (
                            <div className="rounded-xl bg-primary/8 border border-primary/20 px-4 py-3 text-center">
                              <p className="text-xs text-muted-foreground mb-0.5">Based on your input</p>
                              <p className="text-sm font-body font-semibold text-primary">You're on cycle day {cycleDay} 🌙</p>
                            </div>
                          );
                      })()}

                      <div className="rounded-xl bg-muted/60 border border-border px-4 py-3 text-xs text-muted-foreground font-body">
                        🌸 Your phase is calculated automatically. Update anytime in Profile.
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <Button variant="outline" onClick={retreat} disabled={isSubmitting} className="flex-1 rounded-xl">Back</Button>
                      <Button
                        onClick={handleFinish}
                        disabled={isSubmitting || !isActorReady}
                        className="flex-1 rounded-xl font-semibold shadow-sm"
                      >
                        {isSubmitting ? "Setting up…" : !isActorReady ? "Connecting…" : "Finish 🎉"}
                      </Button>
                    </div>
                  </>
                )}

                {/* ── DONE ──────────────────────────────────────────────── */}
                {step === "done" && (
                  <div className="text-center py-10 space-y-4">
                    <motion.div
                      initial={{ scale: 0, rotate: -20 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ type: "spring", stiffness: 200, damping: 12 }}
                      className="text-7xl"
                    >
                      🌸
                    </motion.div>
                    <h2 className="font-display text-2xl font-semibold text-foreground">
                      You're all set, {form.displayName || "beautiful"}!
                    </h2>
                    <p className="text-sm text-muted-foreground">Taking you to your dashboard…</p>
                  </div>
                )}

              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
