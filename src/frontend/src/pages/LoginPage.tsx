import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useInternetIdentity } from "@caffeineai/core-infrastructure";
import { cn } from "@/lib/utils";
import { useNavigate } from "@tanstack/react-router";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  useBackendActor,
  useInitFreeTrial,
  useSaveOnboardingProfile,
} from "../hooks/use-backend";
import { MOCK_MODE } from "../lib/mock-mode";
import {
  DIET_PREF_LABELS,
  DietaryPreference,
  FITNESS_GOAL_LABELS,
  FITNESS_LEVEL_LABELS,
  FitnessGoal,
  FitnessLevel,
  type OnboardingProfile,
} from "../types";

// ─── Types ────────────────────────────────────────────────────────────────────

type Mode = "signin" | "signup";
type SignupStep = "auth" | "name" | "body" | "goals" | "diet" | "cycle" | "done";

const SIGNUP_STEPS: SignupStep[] = ["auth", "name", "body", "goals", "diet", "cycle", "done"];
const PROFILE_STEPS: SignupStep[] = ["name", "body", "goals", "diet", "cycle"];

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

// ─── Validation ───────────────────────────────────────────────────────────────

function validateName(f: FormState): FieldErrors {
  const e: FieldErrors = {};
  if (!f.displayName.trim()) e.displayName = "Please enter your name.";
  return e;
}

function validateBody(f: FormState): FieldErrors {
  const e: FieldErrors = {};
  const age = Number.parseInt(f.age, 10);
  if (!f.age || Number.isNaN(age) || age < 16 || age > 80)
    e.age = "Please enter your age (16–80).";
  const h = Number.parseInt(f.heightCm, 10);
  if (!f.heightCm || Number.isNaN(h) || h < 120 || h > 220)
    e.heightCm = "Enter a valid height (120–220 cm).";
  const w = Number.parseFloat(f.weightKg);
  if (!f.weightKg || Number.isNaN(w) || w < 30 || w > 250)
    e.weightKg = "Enter a valid weight (30–250 kg).";
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
    const [y, m, d] = f.cycleStartDate.split("-");
    const date = new Date(Date.UTC(+y, +m - 1, +d));
    if (Number.isNaN(date.getTime()) || date > new Date())
      e.cycleStartDate = "Please enter a valid date in the past.";
  }
  const pd = Number.parseInt(f.periodDurationDays, 10);
  if (!f.periodDurationDays || Number.isNaN(pd) || pd < 1 || pd > 10)
    e.periodDurationDays = "Period duration must be 1–10 days.";
  const len = Number.parseInt(f.cycleLengthDays, 10);
  if (!f.cycleLengthDays || Number.isNaN(len) || len < 21 || len > 35)
    e.cycleLengthDays = "Cycle length must be 21–35 days.";
  return e;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function FieldError({ msg }: { msg?: string }) {
  if (!msg) return null;
  return <p className="text-xs text-destructive mt-1 font-body">{msg}</p>;
}

const ORDERED_GOALS: FitnessGoal[] = [
  FitnessGoal.weightLoss,
  FitnessGoal.muscleGain,
  FitnessGoal.maintenance,
];

const GOAL_META: Record<FitnessGoal, { icon: string; desc: string }> = {
  [FitnessGoal.weightLoss]: { icon: "🔥", desc: "Burn fat & boost metabolism" },
  [FitnessGoal.muscleGain]: { icon: "💪", desc: "Build strength & lean muscle" },
  [FitnessGoal.maintenance]: { icon: "⚖️", desc: "Stay balanced & energised" },
};

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

// Auth buttons shared between sign-in and sign-up
function AuthButtons({ onProceed }: { onProceed: () => void }) {
  const [phone, setPhone] = useState("");
  const [phoneStep, setPhoneStep] = useState<"input" | "otp">("input");
  const [otp, setOtp] = useState("");

  const handlePhoneContinue = () => {
    if (phone.length < 10) return;
    setPhoneStep("otp");
  };

  const handleOtpVerify = () => {
    if (otp.length < 6) return;
    onProceed();
  };

  return (
    <div className="space-y-3">
      {phoneStep === "input" ? (
        <>
          <div className="flex rounded-xl overflow-hidden border border-border focus-within:border-primary transition-colors">
            <span className="flex items-center px-3 bg-muted text-muted-foreground text-sm font-body select-none border-r border-border">
              +91
            </span>
            <input
              type="tel"
              inputMode="numeric"
              placeholder="Mobile number"
              value={phone}
              onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
              className="flex-1 px-4 py-3 bg-card text-foreground text-sm font-body placeholder:text-muted-foreground outline-none"
            />
          </div>
          <button
            type="button"
            onClick={handlePhoneContinue}
            disabled={phone.length < 10}
            className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground rounded-xl py-3.5 px-6 font-body font-semibold text-base transition-all duration-200 hover:bg-primary/90 active:scale-[0.98] shadow-sm disabled:opacity-50 disabled:pointer-events-none"
          >
            <svg viewBox="0 0 24 24" className="w-4 h-4 shrink-0" fill="none">
              <title>Phone</title>
              <path d="M6.62 10.79a15.053 15.053 0 0 0 6.59 6.59l2.2-2.2a1 1 0 0 1 1.01-.24c1.12.37 2.33.57 3.58.57a1 1 0 0 1 1 1V20a1 1 0 0 1-1 1C10.61 21 3 13.39 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1c0 1.25.2 2.45.57 3.58a1 1 0 0 1-.25 1.01l-2.2 2.2Z" fill="currentColor" />
            </svg>
            Continue with Phone
          </button>
        </>
      ) : (
        <>
          <p className="text-sm text-center text-muted-foreground">
            OTP sent to <span className="text-foreground font-medium">+91 {phone}</span>
          </p>
          <input
            type="text"
            inputMode="numeric"
            placeholder="6-digit OTP"
            maxLength={6}
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
            className="w-full text-center tracking-[0.5em] px-4 py-3 rounded-xl border border-border focus:border-primary bg-card text-foreground text-lg font-body outline-none transition-colors"
          />
          <button
            type="button"
            onClick={handleOtpVerify}
            disabled={otp.length < 6}
            className="w-full bg-primary text-primary-foreground rounded-xl py-3.5 px-6 font-body font-semibold text-base transition-all duration-200 hover:bg-primary/90 active:scale-[0.98] shadow-sm disabled:opacity-50 disabled:pointer-events-none"
          >
            Verify &amp; Continue
          </button>
          <button
            type="button"
            onClick={() => { setPhoneStep("input"); setOtp(""); }}
            className="w-full text-sm text-muted-foreground hover:text-primary transition-colors"
          >
            ← Change number
          </button>
        </>
      )}

      <div className="flex items-center gap-3">
        <div className="flex-1 h-px bg-border" />
        <span className="text-xs text-muted-foreground font-body">or</span>
        <div className="flex-1 h-px bg-border" />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={onProceed}
          className="flex items-center justify-center gap-2 border border-border bg-card rounded-xl py-3 px-4 text-sm font-body font-medium text-foreground hover:bg-muted/40 hover:border-primary/30 transition-all duration-200 active:scale-[0.98]"
        >
          <svg viewBox="0 0 24 24" className="w-5 h-5 shrink-0">
            <title>Google</title>
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09Z" fill="#4285F4" />
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23Z" fill="#34A853" />
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84Z" fill="#FBBC05" />
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53Z" fill="#EA4335" />
          </svg>
          Google
        </button>
        <button
          type="button"
          onClick={onProceed}
          className="flex items-center justify-center gap-2 border border-border bg-card rounded-xl py-3 px-4 text-sm font-body font-medium text-foreground hover:bg-muted/40 hover:border-primary/30 transition-all duration-200 active:scale-[0.98]"
        >
          <svg viewBox="0 0 24 24" className="w-5 h-5 shrink-0" fill="currentColor">
            <title>Apple</title>
            <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.7 9.05 7.4c1.38.07 2.33.74 3.13.8 1.19-.24 2.33-.93 3.6-.84 1.54.12 2.7.7 3.44 1.8-3.14 1.88-2.4 5.98.48 7.13-.56 1.45-1.3 2.88-2.65 4ZM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25Z" />
          </svg>
          Apple ID
        </button>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function LoginPage() {
  const { isAuthenticated, isInitializing } = useInternetIdentity();
  const navigate = useNavigate();
  const { actor, isFetching: isActorFetching } = useBackendActor();
  const isActorReady = !!actor && !isActorFetching;
  const saveProfile = useSaveOnboardingProfile(actor);
  const initTrial = useInitFreeTrial(actor);

  const [mode, setMode] = useState<Mode>("signup");
  const [signupStep, setSignupStep] = useState<SignupStep>("auth");
  const [dir, setDir] = useState<1 | -1>(1);
  const [form, setForm] = useState<FormState>(INITIAL_FORM);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Real auth: redirect after login
  useEffect(() => {
    if (MOCK_MODE) return;
    if (!isAuthenticated || isInitializing) return;
    navigate({ to: "/home" });
  }, [isAuthenticated, isInitializing, navigate]);

  const setField = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((p) => ({ ...p, [key]: value }));
    setErrors((p) => ({ ...p, [key]: undefined }));
  };

  const toggleDiet = (pref: DietaryPreference) => {
    if (pref !== DietaryPreference.none && form.dietPrefs.includes(DietaryPreference.none)) return;
    setForm((p) => {
      const has = p.dietPrefs.includes(pref);
      if (pref === DietaryPreference.none) return { ...p, dietPrefs: has ? [] : [DietaryPreference.none] };
      const next = has
        ? p.dietPrefs.filter((d) => d !== pref)
        : p.dietPrefs.filter((d) => d !== DietaryPreference.none).concat(pref);
      return { ...p, dietPrefs: next };
    });
  };

  const goTo = (step: SignupStep, direction: 1 | -1 = 1) => {
    setDir(direction);
    setSignupStep(step);
  };

  const advance = (validate?: () => FieldErrors, next?: SignupStep) => {
    if (validate) {
      const errs = validate();
      if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    }
    setErrors({});
    const idx = SIGNUP_STEPS.indexOf(signupStep);
    goTo(next ?? SIGNUP_STEPS[idx + 1], 1);
  };

  const retreat = () => {
    setErrors({});
    const idx = SIGNUP_STEPS.indexOf(signupStep);
    goTo(SIGNUP_STEPS[idx - 1], -1);
  };

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
      goTo("done", 1);
      toast.success("Welcome to FemFit! 🌸");
      setTimeout(() => navigate({ to: "/home" }), 2000);
    } catch (err) {
      console.error(err);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Progress for profile steps (excludes auth + done)
  const profileStepIdx = PROFILE_STEPS.indexOf(signupStep as SignupStep);
  const progressPct = profileStepIdx >= 0
    ? Math.round((profileStepIdx / (PROFILE_STEPS.length - 1)) * 100)
    : 0;

  const variants = {
    enter: (d: number) => ({ opacity: 0, x: d * 40 }),
    center: { opacity: 1, x: 0 },
    exit: (d: number) => ({ opacity: 0, x: d * -40 }),
  };

  // ── Loading state ──
  if (!MOCK_MODE && isInitializing) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="space-y-3 w-48">
          <div className="h-4 w-full rounded bg-muted animate-pulse" />
          <div className="h-4 w-3/4 rounded bg-muted animate-pulse" />
          <div className="h-4 w-1/2 rounded bg-muted animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex flex-col min-h-screen bg-background overflow-hidden">
      {/* Decorative blobs */}
      <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-primary/10 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-80 h-80 rounded-full bg-accent/10 blur-3xl pointer-events-none" />

      <div className="flex flex-1 items-center justify-center px-6 py-10">
        <div className="relative z-10 w-full max-w-md">

          {/* Logo */}
          <div className="flex justify-center mb-6">
            <div className="w-14 h-14 rounded-2xl bg-primary flex items-center justify-center shadow-md">
              <svg viewBox="0 0 24 24" fill="none" className="w-8 h-8 text-primary-foreground">
                <title>FemFit logo</title>
                <path d="M12 2C8.686 2 6 4.686 6 8c0 2.21.895 4.21 2.343 5.657L12 17.314l3.657-3.657A7.965 7.965 0 0 0 18 8c0-3.314-2.686-6-6-6Z" fill="currentColor" opacity="0.85" />
                <path d="M12 17.314V22M10 22h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </div>
          </div>

          {/* Title */}
          <div className="text-center mb-6">
            <h1 className="font-display text-4xl font-semibold text-primary tracking-tight">FemFit</h1>
            <p className="text-muted-foreground font-body text-sm mt-1">Your cycle-synced wellness companion</p>
          </div>

          {/* Mode tabs — only on auth step */}
          {signupStep === "auth" && (
            <div className="flex bg-muted rounded-xl p-1 mb-6">
              <button
                type="button"
                onClick={() => setMode("signup")}
                className={cn(
                  "flex-1 rounded-lg py-2 text-sm font-body font-semibold transition-all duration-200",
                  mode === "signup"
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                Create Account
              </button>
              <button
                type="button"
                onClick={() => setMode("signin")}
                className={cn(
                  "flex-1 rounded-lg py-2 text-sm font-body font-semibold transition-all duration-200",
                  mode === "signin"
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                Sign In
              </button>
            </div>
          )}

          {/* Progress bar for profile steps */}
          {profileStepIdx >= 0 && (
            <div className="mb-5">
              <div className="flex justify-between text-xs text-muted-foreground font-body mb-1.5">
                <span>Step {profileStepIdx + 1} of {PROFILE_STEPS.length}</span>
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
                key={signupStep + mode}
                custom={dir}
                variants={variants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.22, ease: "easeInOut" }}
                className="px-6 py-7 space-y-5"
              >

                {/* ── AUTH STEP ──────────────────────────────────────────── */}
                {signupStep === "auth" && mode === "signup" && (
                  <>
                    <div className="text-center space-y-1">
                      <h2 className="font-body font-semibold text-foreground text-lg">Hello beautiful 🌸</h2>
                      <p className="text-sm text-muted-foreground">Create your account to get started</p>
                    </div>
                    <AuthButtons onProceed={() => advance(undefined, "name")} />
                    <p className="text-center text-xs text-muted-foreground">
                      <span className="text-primary font-medium">7-day free trial</span> — no card required.
                    </p>
                  </>
                )}

                {signupStep === "auth" && mode === "signin" && (
                  <>
                    <div className="text-center space-y-1">
                      <h2 className="font-body font-semibold text-foreground text-lg">Hello beautiful 🌸</h2>
                      <p className="text-sm text-muted-foreground">Sign in to continue your journey</p>
                    </div>
                    <AuthButtons onProceed={() => navigate({ to: "/home" })} />
                  </>
                )}

                {/* ── NAME STEP ─────────────────────────────────────────── */}
                {signupStep === "name" && (
                  <>
                    <div className="text-center space-y-1">
                      <h2 className="font-display text-2xl font-semibold text-foreground">What's your name?</h2>
                      <p className="text-sm text-muted-foreground">We'll use this to personalise your experience</p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="displayName" className="font-body text-sm font-medium">Your name</Label>
                      <Input
                        id="displayName"
                        placeholder="e.g. Priya"
                        value={form.displayName}
                        onChange={(e) => setField("displayName", e.target.value)}
                        className="rounded-xl"
                        autoFocus
                      />
                      <FieldError msg={errors.displayName} />
                    </div>
                    <div className="flex gap-3 pt-2">
                      <Button variant="outline" onClick={retreat} className="flex-1 rounded-xl">Back</Button>
                      <Button onClick={() => advance(validateName)} className="flex-1 rounded-xl font-semibold">Continue</Button>
                    </div>
                  </>
                )}

                {/* ── BODY STEP ─────────────────────────────────────────── */}
                {signupStep === "body" && (
                  <>
                    <div className="text-center space-y-1">
                      <h2 className="font-display text-2xl font-semibold text-foreground">About you</h2>
                      <p className="text-sm text-muted-foreground">Helps us tailor your workout & meal plans</p>
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      <div className="space-y-1.5">
                        <Label htmlFor="age" className="text-xs font-body font-medium">Age</Label>
                        <Input id="age" type="number" inputMode="numeric" placeholder="25" value={form.age} onChange={(e) => setField("age", e.target.value)} className="rounded-xl text-center" />
                        <FieldError msg={errors.age} />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="height" className="text-xs font-body font-medium">Height (cm)</Label>
                        <Input id="height" type="number" inputMode="numeric" placeholder="160" value={form.heightCm} onChange={(e) => setField("heightCm", e.target.value)} className="rounded-xl text-center" />
                        <FieldError msg={errors.heightCm} />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="weight" className="text-xs font-body font-medium">Weight (kg)</Label>
                        <Input id="weight" type="number" inputMode="decimal" placeholder="60" value={form.weightKg} onChange={(e) => setField("weightKg", e.target.value)} className="rounded-xl text-center" />
                        <FieldError msg={errors.weightKg} />
                      </div>
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
                                ? "bg-primary text-primary-foreground border-primary shadow-sm"
                                : "bg-card text-muted-foreground border-border hover:border-primary/40",
                            )}
                          >
                            {FITNESS_LEVEL_LABELS[lvl]}
                          </button>
                        ))}
                      </div>
                      <FieldError msg={errors.fitnessLevel} />
                    </div>

                    <div className="flex gap-3 pt-1">
                      <Button variant="outline" onClick={retreat} className="flex-1 rounded-xl">Back</Button>
                      <Button onClick={() => advance(validateBody)} className="flex-1 rounded-xl font-semibold">Continue</Button>
                    </div>
                  </>
                )}

                {/* ── GOALS STEP ────────────────────────────────────────── */}
                {signupStep === "goals" && (
                  <>
                    <div className="text-center space-y-1">
                      <h2 className="font-display text-2xl font-semibold text-foreground">Your goal</h2>
                      <p className="text-sm text-muted-foreground">What are you working towards?</p>
                    </div>

                    <div className="space-y-2.5">
                      {ORDERED_GOALS.map((goal) => {
                        const meta = GOAL_META[goal];
                        const selected = form.fitnessGoal === goal;
                        return (
                          <button
                            key={goal}
                            type="button"
                            onClick={() => setField("fitnessGoal", goal)}
                            className={cn(
                              "w-full flex items-center gap-4 rounded-xl border px-4 py-3.5 text-left transition-all duration-150",
                              selected
                                ? "border-primary bg-primary/5 shadow-sm"
                                : "border-border bg-card hover:border-primary/40",
                            )}
                          >
                            <span className="text-2xl">{meta.icon}</span>
                            <div>
                              <p className={cn("font-body font-semibold text-sm", selected ? "text-primary" : "text-foreground")}>
                                {FITNESS_GOAL_LABELS[goal]}
                              </p>
                              <p className="text-xs text-muted-foreground">{meta.desc}</p>
                            </div>
                            {selected && (
                              <div className="ml-auto w-5 h-5 rounded-full bg-primary flex items-center justify-center shrink-0">
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

                    <div className="flex gap-3 pt-1">
                      <Button variant="outline" onClick={retreat} className="flex-1 rounded-xl">Back</Button>
                      <Button onClick={() => advance(validateGoals)} className="flex-1 rounded-xl font-semibold">Continue</Button>
                    </div>
                  </>
                )}

                {/* ── DIET STEP ─────────────────────────────────────────── */}
                {signupStep === "diet" && (
                  <>
                    <div className="text-center space-y-1">
                      <h2 className="font-display text-2xl font-semibold text-foreground">Your diet</h2>
                      <p className="text-sm text-muted-foreground">Choose all that apply</p>
                    </div>

                    <div className="space-y-2">
                      {ORDERED_DIETS.map((pref) => {
                        const selected = form.dietPrefs.includes(pref);
                        const blocked = pref !== DietaryPreference.none && form.dietPrefs.includes(DietaryPreference.none);
                        return (
                          <button
                            key={pref}
                            type="button"
                            onClick={() => toggleDiet(pref)}
                            disabled={blocked}
                            className={cn(
                              "w-full flex items-center justify-between rounded-xl border px-4 py-3 text-sm font-body font-medium transition-all duration-150",
                              selected
                                ? "border-primary bg-primary/5 text-primary"
                                : "border-border bg-card text-foreground hover:border-primary/40",
                              blocked && "opacity-40 cursor-not-allowed",
                            )}
                          >
                            {DIET_PREF_LABELS[pref]}
                            {selected && (
                              <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
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

                    <div className="space-y-1.5">
                      <Label htmlFor="allergies" className="text-sm font-body font-medium">Allergies <span className="text-muted-foreground font-normal">(optional)</span></Label>
                      <Input
                        id="allergies"
                        placeholder="e.g. nuts, shellfish"
                        value={form.allergies}
                        onChange={(e) => setField("allergies", e.target.value)}
                        className="rounded-xl"
                      />
                    </div>

                    <div className="flex gap-3 pt-1">
                      <Button variant="outline" onClick={retreat} className="flex-1 rounded-xl">Back</Button>
                      <Button onClick={() => advance(undefined)} className="flex-1 rounded-xl font-semibold">Continue</Button>
                    </div>
                  </>
                )}

                {/* ── CYCLE STEP ────────────────────────────────────────── */}
                {signupStep === "cycle" && (
                  <>
                    <div className="text-center space-y-1">
                      <h2 className="font-display text-2xl font-semibold text-foreground">Your cycle 🌙</h2>
                      <p className="text-sm text-muted-foreground">Personalise workouts & meals to each phase</p>
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

                      {form.cycleStartDate && !errors.cycleStartDate && (() => {
                        const [y, m, d] = form.cycleStartDate.split("-");
                        const start = new Date(Date.UTC(+y, +m - 1, +d));
                        const day = Math.floor((Date.now() - start.getTime()) / 86400000) + 1;
                        const len = Number.parseInt(form.cycleLengthDays, 10);
                        const cycleDay = ((day - 1) % (len || 28)) + 1;
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

                    <div className="flex gap-3 pt-1">
                      <Button variant="outline" onClick={retreat} disabled={isSubmitting} className="flex-1 rounded-xl">Back</Button>
                      <Button
                        onClick={handleFinish}
                        disabled={isSubmitting || !isActorReady}
                        className="flex-1 rounded-xl font-semibold"
                      >
                        {isSubmitting ? "Setting up…" : !isActorReady ? "Connecting…" : "Finish 🎉"}
                      </Button>
                    </div>
                  </>
                )}

                {/* ── DONE STEP ─────────────────────────────────────────── */}
                {signupStep === "done" && (
                  <div className="text-center py-8 space-y-4">
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 200, damping: 14 }}
                      className="text-6xl"
                    >
                      🌸
                    </motion.div>
                    <h2 className="font-display text-2xl font-semibold text-foreground">
                      Welcome, {form.displayName || "beautiful"}!
                    </h2>
                    <p className="text-sm text-muted-foreground">Your profile is ready. Taking you to your dashboard…</p>
                  </div>
                )}

              </motion.div>
            </AnimatePresence>
          </div>

          {/* Footer */}
          <p className="text-center text-xs text-muted-foreground mt-6">
            © {new Date().getFullYear()}. Built with love using{" "}
            <a
              href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral`}
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-primary transition-colors"
            >
              caffeine.ai
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
