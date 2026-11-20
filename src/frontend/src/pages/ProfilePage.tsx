import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { Calendar, LogOut, RefreshCw, Save, User } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useAuthSession } from "../hooks/use-auth-session";
import {
  useCycleInfo,
  useOnboardingProfile,
  useUpdateCycleStartDate,
  useUpdateOnboardingProfile,
} from "../hooks/use-backend";
import {
  DIET_PREF_LABELS,
  DietaryPreference,
  FITNESS_GOAL_LABELS,
  FITNESS_LEVEL_LABELS,
  FitnessGoal,
  FitnessLevel,
  HEALTH_CONDITION_LABELS,
  HealthCondition,
} from "../types";
import type { OnboardingProfile } from "../types";

// ── helpers ──────────────────────────────────────────────────────────────────

function nsToDateString(ns: bigint): string {
  if (!ns) return "";
  const ms = Number(ns) / 1_000_000;
  const d = new Date(ms);
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 10);
}

function dateStringToNs(dateStr: string): bigint {
  // Parse YYYY-MM-DD as UTC midnight to avoid timezone offset issues
  const [year, month, day] = dateStr.split("-");
  const utcMs = Date.UTC(
    Number.parseInt(year, 10),
    Number.parseInt(month, 10) - 1,
    Number.parseInt(day, 10),
  );
  return BigInt(utcMs) * BigInt(1_000_000);
}

// ── Section wrapper ───────────────────────────────────────────────────────────

function Section({
  title,
  icon,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl bg-card border border-border shadow-warm overflow-hidden">
      <div className="px-5 py-3.5 bg-primary/5 border-b border-border flex items-center gap-2.5">
        <span className="text-primary">{icon}</span>
        <h2 className="font-body font-semibold text-sm text-foreground">
          {title}
        </h2>
      </div>
      <div className="px-5 py-4 space-y-4">{children}</div>
    </section>
  );
}

// ── Field component ───────────────────────────────────────────────────────────

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <p className="text-xs font-body font-medium text-muted-foreground uppercase tracking-wide">
        {label}
      </p>
      {children}
      {hint && (
        <p className="text-xs text-muted-foreground font-body">{hint}</p>
      )}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function ProfilePage() {
  const { session, signOut } = useAuthSession();
  const { data: profile, isLoading } = useOnboardingProfile();

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch {
      toast.error("Could not sign out. Please try again.");
    }
  };
  const { data: cycleInfo } = useCycleInfo();
  const updateProfile = useUpdateOnboardingProfile();
  const updateCycle = useUpdateCycleStartDate();

  // Display name
  const [displayName, setDisplayName] = useState("");

  // Body metrics
  const [age, setAge] = useState("");
  const [heightCm, setHeightCm] = useState("");
  const [weightKg, setWeightKg] = useState("");

  // Fitness preferences
  const [fitnessLevel, setFitnessLevel] = useState<FitnessLevel>(
    FitnessLevel.beginner,
  );
  const [fitnessGoal, setFitnessGoal] = useState<FitnessGoal>(
    FitnessGoal.maintenance,
  );

  // Dietary preferences
  const [dietPrefs, setDietPrefs] = useState<Set<DietaryPreference>>(new Set());

  // Health conditions
  const [healthConditions, setHealthConditions] = useState<
    Set<HealthCondition>
  >(new Set());

  // Allergies
  const [allergies, setAllergies] = useState("");

  // Cycle
  const [cycleStartDate, setCycleStartDate] = useState("");
  const [periodDuration, setPeriodDuration] = useState("5");
  const [cycleLength, setCycleLength] = useState("");

  // Populate form once profile loads
  useEffect(() => {
    if (!profile) return;
    setDisplayName(profile.displayName ?? "");
    setAge(profile.age.toString());
    setHeightCm(profile.heightCm.toString());
    setWeightKg(profile.weightKg.toString());
    setFitnessLevel(profile.fitnessLevel as FitnessLevel);
    setFitnessGoal(profile.fitnessGoal as FitnessGoal);
    setDietPrefs(new Set(profile.dietPrefs as DietaryPreference[]));
    setHealthConditions(new Set(profile.healthConditions as HealthCondition[]));
    setAllergies(profile.allergies.join(", "));
    setCycleStartDate(nsToDateString(profile.cycleStartDate));
    setPeriodDuration(
      profile.periodDurationDays ? profile.periodDurationDays.toString() : "5",
    );
    setCycleLength(profile.cycleLengthDays.toString());
  }, [profile]);

  const toggleCondition = (condition: HealthCondition) => {
    setHealthConditions((prev) => {
      const next = new Set(prev);
      if (next.has(condition)) next.delete(condition);
      else next.add(condition);
      return next;
    });
  };

  const toggleDiet = (pref: DietaryPreference) => {
    // If 'none' is already selected, block all other options entirely
    if (
      pref !== DietaryPreference.none &&
      dietPrefs.has(DietaryPreference.none)
    ) {
      return;
    }
    setDietPrefs((prev) => {
      const next = new Set(prev);
      if (pref === DietaryPreference.none) {
        // Selecting 'none' clears all other selections
        if (next.has(pref)) {
          next.delete(pref);
        } else {
          next.clear();
          next.add(DietaryPreference.none);
        }
      } else {
        // Selecting any other pref removes 'none' automatically
        next.delete(DietaryPreference.none);
        if (next.has(pref)) next.delete(pref);
        else next.add(pref);
      }
      return next;
    });
  };

  // ── Save all ──────────────────────────────────────────────────────────────

  const handleSaveAll = () => {
    if (!profile) return;

    const ageN = Number.parseInt(age);
    const heightN = Number.parseInt(heightCm);
    const weightN = Number.parseFloat(weightKg);
    const periodDurN = Number.parseInt(periodDuration);
    const cycleLenN = Number.parseInt(cycleLength);

    if (
      Number.isNaN(ageN) ||
      Number.isNaN(heightN) ||
      Number.isNaN(weightN) ||
      Number.isNaN(periodDurN) ||
      Number.isNaN(cycleLenN)
    ) {
      toast.error("Please fill in all numeric fields correctly.");
      return;
    }

    const cycleNs = cycleStartDate
      ? dateStringToNs(cycleStartDate)
      : profile.cycleStartDate;

    const updated: OnboardingProfile = {
      ...profile,
      displayName: displayName.trim(),
      age: ageN as unknown as bigint,
      heightCm: heightN as unknown as bigint,
      weightKg: weightN,
      fitnessLevel,
      fitnessGoal,
      dietPrefs: Array.from(dietPrefs),
      healthConditions: Array.from(healthConditions),
      allergies: allergies
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
      periodDurationDays: periodDurN as unknown as bigint,
      cycleLengthDays: cycleLenN as unknown as bigint,
      cycleStartDate: cycleNs,
    };

    updateProfile.mutate(updated, {
      onSuccess: () => toast.success("Profile saved successfully ✓"),
      onError: (err) => {
        console.error("Profile save error:", err);
        toast.error("Could not save profile. Please try again.");
      },
    });
  };

  // ── Update cycle date only ─────────────────────────────────────────────────

  const handleUpdateCycleDate = () => {
    if (!cycleStartDate) {
      toast.error("Please select a cycle start date.");
      return;
    }
    const ns = dateStringToNs(cycleStartDate);
    updateCycle.mutate(ns, {
      onSuccess: () => toast.success("Cycle start date updated ✓"),
      onError: () => toast.error("Could not update cycle date."),
    });
  };

  const principal = session?.phone ?? "";

  if (isLoading) {
    return (
      <div
        className="px-4 py-6 space-y-6 max-w-lg mx-auto"
        data-ocid="profile.loading_state"
      >
        <div className="flex items-center gap-4">
          <Skeleton className="size-16 rounded-full" />
          <div className="space-y-2 flex-1">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-3 w-48" />
          </div>
        </div>
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="rounded-2xl bg-card border border-border p-5 space-y-3"
          >
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div
      className="px-4 py-6 space-y-5 max-w-lg mx-auto pb-10"
      data-ocid="profile.page"
    >
      {/* ── Profile header ── */}
      <div className="flex items-center gap-4" data-ocid="profile.header">
        <div className="size-16 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center">
          <User className="size-7 text-primary" />
        </div>
        <div className="min-w-0">
          <h1 className="font-display text-2xl text-foreground">My Profile</h1>
          {principal && (
            <p
              className="text-xs text-muted-foreground font-mono truncate max-w-[220px]"
              title={principal}
            >
              {principal.slice(0, 22)}…
            </p>
          )}
          {cycleInfo && (
            <Badge
              variant="outline"
              className="mt-1 text-[10px] rounded-full capitalize border-primary/30 text-primary"
            >
              {cycleInfo.currentPhase} · Day {cycleInfo.dayOfCycle.toString()}
            </Badge>
          )}
        </div>
      </div>

      {/* ── Display Name ── */}
      <Section title="Profile Info" icon={<User className="size-4" />}>
        <Field label="Display Name" hint="How you want to be greeted">
          <Input
            id="display-name"
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="Enter your name (e.g. Tanvi)"
            className="rounded-xl"
            data-ocid="profile.display_name_input"
          />
        </Field>
      </Section>

      {/* ── Body Metrics ── */}
      <Section title="Body Metrics" icon={<User className="size-4" />}>
        <div className="grid grid-cols-3 gap-3">
          <Field label="Age" hint="years">
            <Input
              id="age"
              type="number"
              min="13"
              max="99"
              value={age}
              onChange={(e) => setAge(e.target.value)}
              placeholder="28"
              className="rounded-xl"
              data-ocid="profile.age_input"
            />
          </Field>
          <Field label="Height" hint="cm">
            <Input
              id="height"
              type="number"
              min="100"
              max="250"
              value={heightCm}
              onChange={(e) => setHeightCm(e.target.value)}
              placeholder="165"
              className="rounded-xl"
              data-ocid="profile.height_input"
            />
          </Field>
          <Field label="Weight" hint="kg">
            <Input
              id="weight"
              type="number"
              min="30"
              max="300"
              step="0.1"
              value={weightKg}
              onChange={(e) => setWeightKg(e.target.value)}
              placeholder="60"
              className="rounded-xl"
              data-ocid="profile.weight_input"
            />
          </Field>
        </div>
      </Section>

      {/* ── Fitness Preferences ── */}
      <Section
        title="Fitness Preferences"
        icon={<RefreshCw className="size-4" />}
      >
        <Field label="Fitness Level">
          <select
            value={fitnessLevel}
            onChange={(e) => setFitnessLevel(e.target.value as FitnessLevel)}
            className="w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm font-body text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            data-ocid="profile.fitness_level_select"
          >
            {Object.entries(FITNESS_LEVEL_LABELS).map(([val, label]) => (
              <option key={val} value={val}>
                {label}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Fitness Goal">
          <select
            value={fitnessGoal}
            onChange={(e) => setFitnessGoal(e.target.value as FitnessGoal)}
            className="w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm font-body text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            data-ocid="profile.fitness_goal_select"
          >
            {Object.entries(FITNESS_GOAL_LABELS).map(([val, label]) => (
              <option key={val} value={val}>
                {label}
              </option>
            ))}
          </select>
        </Field>
      </Section>

      {/* ── Dietary Preferences ── */}
      <Section
        title="Dietary Preferences"
        icon={<span className="text-base leading-none">🥗</span>}
      >
        <div className="space-y-2.5" data-ocid="profile.diet_prefs_list">
          {(Object.values(DietaryPreference) as DietaryPreference[]).map(
            (pref) => {
              const noneSelected = dietPrefs.has(DietaryPreference.none);
              const isDisabled =
                pref !== DietaryPreference.none && noneSelected;
              return (
                <div
                  key={pref}
                  className={cn(
                    "flex items-center gap-3 transition-opacity duration-150",
                    isDisabled && "opacity-40",
                  )}
                  data-ocid={`profile.diet_pref.${pref}`}
                >
                  <Checkbox
                    id={`diet-${pref}`}
                    checked={dietPrefs.has(pref)}
                    onCheckedChange={() => toggleDiet(pref)}
                    disabled={isDisabled}
                    className="border-border data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                  />
                  <Label
                    htmlFor={`diet-${pref}`}
                    className={cn(
                      "text-sm font-body text-foreground transition-colors duration-150",
                      isDisabled
                        ? "cursor-not-allowed"
                        : "cursor-pointer hover:text-primary",
                    )}
                  >
                    {DIET_PREF_LABELS[pref] ?? pref}
                  </Label>
                </div>
              );
            },
          )}
        </div>
      </Section>

      {/* ── Health Conditions ── */}
      <Section
        title="Health Conditions"
        icon={<span className="text-base leading-none">🩺</span>}
      >
        <p className="text-xs font-body text-muted-foreground leading-relaxed">
          Select any conditions that apply to you — your plan will be adjusted
          accordingly.
        </p>
        <div className="space-y-2.5" data-ocid="profile.health_conditions_list">
          {(Object.values(HealthCondition) as HealthCondition[]).map(
            (condition) => (
              <div
                key={condition}
                className="flex items-center gap-3"
                data-ocid={`profile.health_condition.${condition}`}
              >
                <Checkbox
                  id={`condition-${condition}`}
                  checked={healthConditions.has(condition)}
                  onCheckedChange={() => toggleCondition(condition)}
                  className="border-border data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                />
                <Label
                  htmlFor={`condition-${condition}`}
                  className="text-sm font-body text-foreground cursor-pointer hover:text-primary transition-colors duration-150"
                >
                  {HEALTH_CONDITION_LABELS[condition] ?? condition}
                </Label>
              </div>
            ),
          )}
        </div>
      </Section>

      {/* ── Allergies ── */}
      <Section
        title="Allergies"
        icon={<span className="text-base leading-none">⚠️</span>}
      >
        <Field
          label="Known Allergies"
          hint="Enter as comma-separated values, e.g. nuts, shellfish, eggs"
        >
          <Input
            id="allergies"
            type="text"
            value={allergies}
            onChange={(e) => setAllergies(e.target.value)}
            placeholder="nuts, soy, eggs"
            className="rounded-xl"
            data-ocid="profile.allergies_input"
          />
        </Field>
      </Section>

      {/* ── Cycle Settings ── */}
      <Section title="Cycle Settings" icon={<Calendar className="size-4" />}>
        <Field label="Cycle Start Date">
          <Input
            id="cycle-start"
            type="date"
            value={cycleStartDate}
            onChange={(e) => setCycleStartDate(e.target.value)}
            className="rounded-xl"
            data-ocid="profile.cycle_start_input"
          />
        </Field>
        <Field
          label="Period Duration"
          hint="How many days does your period (bleeding) last? Typical range: 2–7 days"
        >
          <Input
            id="period-duration"
            type="number"
            min="1"
            max="10"
            value={periodDuration}
            onChange={(e) => setPeriodDuration(e.target.value)}
            placeholder="5"
            className="rounded-xl"
            data-ocid="profile.period_duration_input"
          />
        </Field>
        <Field label="Cycle Length" hint="21–35 days is typical">
          <Input
            id="cycle-length"
            type="number"
            min="21"
            max="45"
            value={cycleLength}
            onChange={(e) => setCycleLength(e.target.value)}
            placeholder="28"
            className="rounded-xl"
            data-ocid="profile.cycle_length_input"
          />
        </Field>

        {/* Update cycle shortcut */}
        <Button
          variant="outline"
          size="sm"
          className="w-full rounded-full border-primary/40 text-primary hover:bg-primary/5 transition-smooth"
          onClick={handleUpdateCycleDate}
          disabled={updateCycle.isPending || !cycleStartDate}
          data-ocid="profile.update_cycle_button"
        >
          <RefreshCw
            className={`size-3.5 mr-2 ${updateCycle.isPending ? "animate-spin" : ""}`}
          />
          {updateCycle.isPending ? "Updating…" : "Update Cycle Date Only"}
        </Button>
      </Section>

      {/* ── Save Changes ── */}
      <div className="pt-1 space-y-3">
        <Button
          className="w-full rounded-full py-6 font-body font-semibold text-base shadow-warm-md bg-primary text-primary-foreground hover:bg-primary/90 transition-smooth"
          onClick={handleSaveAll}
          disabled={updateProfile.isPending || !profile}
          data-ocid="profile.save_button"
        >
          <Save className="size-4 mr-2" />
          {updateProfile.isPending ? "Saving…" : "Save Changes"}
        </Button>

        {updateProfile.isSuccess && (
          <p
            className="text-xs text-center text-secondary font-body"
            data-ocid="profile.success_state"
          >
            ✓ Profile updated successfully
          </p>
        )}
        {updateProfile.isError && (
          <p
            className="text-xs text-center text-destructive font-body"
            data-ocid="profile.error_state"
          >
            Something went wrong. Please try again.
          </p>
        )}
      </div>

      {/* ── Sign Out ── */}
      <div className="border-t border-border pt-4">
        <Button
          variant="ghost"
          className="w-full rounded-full text-muted-foreground hover:text-destructive hover:bg-destructive/5 transition-smooth"
          onClick={() => void handleSignOut()}
          data-ocid="profile.signout_button"
        >
          <LogOut className="size-4 mr-2" />
          Sign Out
        </Button>
      </div>
    </div>
  );
}
