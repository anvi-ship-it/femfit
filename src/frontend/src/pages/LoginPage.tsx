import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useNavigate } from "@tanstack/react-router";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useAuth, sendOtp, verifyOtp } from "../lib/supabase";

type Method = "phone" | "email";
type Step = "credentials" | "otp";

export default function LoginPage() {
  const navigate = useNavigate();
  const { session } = useAuth();
  const [method, setMethod] = useState<Method>("phone");
  const [step, setStep] = useState<Step>("credentials");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const value = method === "phone" ? `+91${phone}` : email.trim().toLowerCase();

  useEffect(() => { if (session) navigate({ to: "/profile-setup" }); }, [session, navigate]);

  async function handleSendOtp() {
    setError("");
    if (method === "phone" && phone.replace(/\D/g, "").length !== 10) { setError("Enter a valid 10-digit Indian mobile number."); return; }
    if (method === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setError("Enter a valid email address."); return; }
    setLoading(true);
    try {
      await sendOtp(method, value);
      setStep("otp");
      setOtp("");
      toast.success(`Verification code sent to ${method === "phone" ? value : email}`);
    } catch (e) { setError(e instanceof Error ? e.message : "Could not send code. Please try again."); }
    finally { setLoading(false); }
  }

  async function handleVerify() {
    if (!/^\d{6}$/.test(otp)) { setError("Enter the 6-digit code."); return; }
    setLoading(true); setError("");
    try { await verifyOtp(method, value, otp); navigate({ to: "/profile-setup" }); }
    catch (e) { setError(e instanceof Error ? e.message : "That code could not be verified."); }
    finally { setLoading(false); }
  }

  return <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-6 py-10">
    <div className="absolute -top-32 -right-32 h-96 w-96 rounded-full bg-primary/10 blur-3xl pointer-events-none" />
    <div className="absolute -bottom-24 -left-24 h-80 w-80 rounded-full bg-accent/10 blur-3xl pointer-events-none" />
    <div className="relative z-10 w-full max-w-md">
      <div className="mb-8 text-center">
        <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-3xl text-primary-foreground shadow-md">🌸</div>
        <h1 className="font-display text-4xl font-semibold tracking-tight text-primary">FemFit</h1>
        <p className="mt-1 text-sm text-muted-foreground">Your cycle-synced wellness companion</p>
      </div>
      <section className="space-y-5 rounded-2xl border border-border bg-card px-6 py-7 shadow-sm">
        <div className="text-center"><h2 className="text-lg font-semibold">{step === "otp" ? "Enter your verification code" : "Sign in or create an account"}</h2><p className="mt-1 text-sm text-muted-foreground">{step === "otp" ? `We sent a code to ${method === "phone" ? value : email}` : "Continue securely with a one-time code"}</p></div>
        {step === "credentials" ? <>
          <div className="flex gap-1 rounded-xl bg-muted p-1">{(["phone", "email"] as Method[]).map((item) => <button key={item} type="button" onClick={() => { setMethod(item); setError(""); }} className={cn("flex-1 rounded-lg py-2 text-sm font-semibold capitalize", method === item ? "bg-card text-foreground shadow-sm" : "text-muted-foreground")}>{item}</button>)}</div>
          {method === "phone" ? <div className="space-y-1.5"><label htmlFor="phone" className="text-sm font-medium">Mobile number</label><div className="flex overflow-hidden rounded-xl border border-border focus-within:border-primary"><span className="border-r border-border bg-muted px-3 py-3 text-sm text-muted-foreground">+91</span><input id="phone" type="tel" inputMode="numeric" autoComplete="tel-national" placeholder="9876543210" value={phone} onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))} className="min-w-0 flex-1 bg-card px-4 py-3 text-sm outline-none" /></div></div> : <div className="space-y-1.5"><label htmlFor="email" className="text-sm font-medium">Email address</label><input id="email" type="email" autoComplete="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full rounded-xl border border-border bg-card px-4 py-3 text-sm outline-none focus:border-primary" /></div>}
          <Button className="w-full rounded-xl py-6" disabled={loading} onClick={handleSendOtp}>{loading ? "Sending code…" : "Send verification code"}</Button>
        </> : <>
          <input aria-label="6-digit verification code" type="text" inputMode="numeric" autoComplete="one-time-code" maxLength={6} placeholder="• • • • • •" value={otp} onChange={(e) => { setOtp(e.target.value.replace(/\D/g, "").slice(0, 6)); setError(""); }} className="w-full rounded-xl border border-border bg-card px-4 py-3.5 text-center text-xl tracking-[0.6em] outline-none focus:border-primary" />
          <Button className="w-full rounded-xl py-6" disabled={loading || otp.length !== 6} onClick={handleVerify}>{loading ? "Verifying…" : "Verify and continue"}</Button>
          <button type="button" disabled={loading} onClick={handleSendOtp} className="w-full text-sm text-primary hover:underline">Resend code</button>
          <button type="button" onClick={() => { setStep("credentials"); setError(""); }} className="w-full text-sm text-muted-foreground hover:text-primary">Change {method === "phone" ? "number" : "email"}</button>
        </>}
        <AnimatePresence>{error && <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} role="alert" className="text-sm text-destructive">{error}</motion.p>}</AnimatePresence>
        <p className="text-center text-xs text-muted-foreground">By continuing, you agree to receive a one-time verification code.</p>
      </section>
    </div>
  </main>;
}
