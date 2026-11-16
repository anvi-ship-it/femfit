import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useInitFreeTrial, useSaveOnboardingProfile, useOnboardingProfile } from "../hooks/use-backend";
import { DietaryPreference, FitnessGoal, FitnessLevel, HealthCondition, type OnboardingProfile } from "../types";

export default function SupabaseProfileSetupPage() {
  const navigate = useNavigate();
  const { data: existing, isLoading } = useOnboardingProfile();
  const save = useSaveOnboardingProfile();
  const trial = useInitFreeTrial();
  const [name, setName] = useState("");
  const [age, setAge] = useState("25");
  const [height, setHeight] = useState("165");
  const [weight, setWeight] = useState("60");
  const [cycleDate, setCycleDate] = useState("");
  const [cycleLength, setCycleLength] = useState("28");
  const [periodLength, setPeriodLength] = useState("5");
  const [fitnessLevel, setFitnessLevel] = useState<FitnessLevel>(FitnessLevel.beginner);
  const [fitnessGoal, setFitnessGoal] = useState<FitnessGoal>(FitnessGoal.maintenance);
  const [busy, setBusy] = useState(false);
  useEffect(() => { if (existing) navigate({ to: "/home" }); }, [existing, navigate]);
  async function finish() {
    const a=Number(age), h=Number(height), w=Number(weight), c=Number(cycleLength), p=Number(periodLength);
    if (!name.trim() || !cycleDate || ![a,h,w,c,p].every(Number.isFinite) || a<13 || a>80 || h<120 || h>220 || w<30 || w>250 || c<21 || c>35 || p<1 || p>10) { toast.error("Check your name, body measurements, and cycle details."); return; }
    setBusy(true);
    try {
      const startNs=BigInt(new Date(`${cycleDate}T00:00:00Z`).getTime())*1_000_000n;
      const profile: OnboardingProfile={displayName:name.trim(),age:BigInt(a),heightCm:BigInt(h),weightKg:w,fitnessLevel,fitnessGoal,dietPrefs:[DietaryPreference.none],allergies:[],healthConditions:[],cycleStartDate:startNs,cycleLengthDays:BigInt(c),periodDurationDays:BigInt(p)};
      await save.mutateAsync(profile); await trial.mutateAsync(); toast.success("Profile created. Welcome to FemFit 🌸"); navigate({to:"/home"});
    } catch (error) { console.error(error); toast.error(error instanceof Error ? error.message : "Could not save your profile. Please try again."); }
    finally { setBusy(false); }
  }
  if (isLoading) return <div className="p-8 text-center text-muted-foreground">Loading your profile…</div>;
  if (existing) return null;
  return <main className="flex min-h-screen items-center justify-center bg-background px-5 py-8"><section className="w-full max-w-md space-y-4 rounded-2xl border border-border bg-card p-6"><div className="text-center"><div className="text-4xl">🌸</div><h1 className="font-display text-2xl">Set up your FemFit profile</h1><p className="text-sm text-muted-foreground">Your health data is saved privately to your Supabase account.</p></div>
    <div><Label htmlFor="setup-name">Name</Label><Input id="setup-name" value={name} onChange={(e)=>setName(e.target.value)} autoComplete="name"/></div>
    <div className="grid grid-cols-3 gap-2">{[["Age",age,setAge],["Height cm",height,setHeight],["Weight kg",weight,setWeight]].map(([label,value,setter])=><div key={label as string}><Label>{label as string}</Label><Input type="number" value={value as string} onChange={(e)=>(setter as (v:string)=>void)(e.target.value)}/></div>)}</div>
    <div><Label>Fitness level</Label><select className="w-full rounded-xl border bg-background p-2" value={fitnessLevel} onChange={(e)=>setFitnessLevel(e.target.value as FitnessLevel)}>{Object.values(FitnessLevel).map((v)=><option key={v} value={v}>{v}</option>)}</select></div>
    <div><Label>Fitness goal</Label><select className="w-full rounded-xl border bg-background p-2" value={fitnessGoal} onChange={(e)=>setFitnessGoal(e.target.value as FitnessGoal)}>{Object.values(FitnessGoal).map((v)=><option key={v} value={v}>{v}</option>)}</select></div>
    <div><Label htmlFor="cycle-date">Last period start date</Label><Input id="cycle-date" type="date" max={new Date().toISOString().slice(0,10)} value={cycleDate} onChange={(e)=>setCycleDate(e.target.value)}/></div>
    <div className="grid grid-cols-2 gap-3"><div><Label>Cycle length (21–35 days)</Label><Input type="number" min="21" max="35" value={cycleLength} onChange={(e)=>setCycleLength(e.target.value)}/></div><div><Label>Period length (1–10 days)</Label><Input type="number" min="1" max="10" value={periodLength} onChange={(e)=>setPeriodLength(e.target.value)}/></div></div>
    <p className="text-xs text-muted-foreground">Health condition and dietary preferences can be refined later in your profile.</p>
    <Button className="w-full" disabled={busy} onClick={finish}>{busy ? "Saving…" : "Save profile and continue"}</Button>
  </section></main>;
}
