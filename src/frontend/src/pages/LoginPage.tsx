import { cn } from "@/lib/utils";
import { useNavigate } from "@tanstack/react-router";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { MOCK_MODE } from "../lib/mock-mode";
import { isLocallyAuthenticated, isProfileComplete, localSignIn, localSignUp } from "../lib/local-auth";

// ─── Types ────────────────────────────────────────────────────────────────────

type Mode = "signup" | "signin";
type AuthMethod = "phone" | "email";

type SignupStep = "method" | "credentials" | "otp" | "password";
type SigninStep = "method" | "credentials";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function Logo() {
  return (
    <div className="flex flex-col items-center gap-3 mb-8">
      <div className="w-14 h-14 rounded-2xl bg-primary flex items-center justify-center shadow-md">
        <svg viewBox="0 0 24 24" fill="none" className="w-8 h-8 text-primary-foreground">
          <title>FemFit</title>
          <path d="M12 2C8.686 2 6 4.686 6 8c0 2.21.895 4.21 2.343 5.657L12 17.314l3.657-3.657A7.965 7.965 0 0 0 18 8c0-3.314-2.686-6-6-6Z" fill="currentColor" opacity="0.85" />
          <path d="M12 17.314V22M10 22h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </div>
      <div className="text-center">
        <h1 className="font-display text-4xl font-semibold text-primary tracking-tight">FemFit</h1>
        <p className="text-muted-foreground font-body text-sm mt-0.5">Your cycle-synced wellness companion</p>
      </div>
    </div>
  );
}

function InputField({
  label,
  id,
  type = "text",
  inputMode,
  placeholder,
  value,
  onChange,
  prefix,
  error,
  autoFocus,
  maxLength,
}: {
  label: string;
  id: string;
  type?: string;
  inputMode?: React.InputHTMLAttributes<HTMLInputElement>["inputMode"];
  placeholder?: string;
  value: string;
  onChange: (v: string) => void;
  prefix?: string;
  error?: string;
  autoFocus?: boolean;
  maxLength?: number;
}) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="text-sm font-body font-medium text-foreground block">
        {label}
      </label>
      <div className={cn("flex rounded-xl overflow-hidden border transition-colors focus-within:border-primary", error ? "border-destructive" : "border-border")}>
        {prefix && (
          <span className="flex items-center px-3 bg-muted text-muted-foreground text-sm font-body select-none border-r border-border shrink-0">
            {prefix}
          </span>
        )}
        <input
          id={id}
          type={type}
          inputMode={inputMode}
          placeholder={placeholder}
          value={value}
          maxLength={maxLength}
          autoFocus={autoFocus}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 px-4 py-3 bg-card text-foreground text-sm font-body placeholder:text-muted-foreground outline-none"
        />
      </div>
      {error && <p className="text-xs text-destructive font-body">{error}</p>}
    </div>
  );
}

function PrimaryButton({
  onClick,
  disabled,
  children,
  loading,
}: {
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
  loading?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || loading}
      className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground rounded-xl py-3.5 px-6 font-body font-semibold text-base transition-all duration-200 hover:bg-primary/90 active:scale-[0.98] shadow-sm disabled:opacity-50 disabled:pointer-events-none"
    >
      {loading ? (
        <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
          <title>Loading</title>
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
        </svg>
      ) : null}
      {children}
    </button>
  );
}

function MethodToggle({
  method,
  onChange,
}: {
  method: AuthMethod;
  onChange: (m: AuthMethod) => void;
}) {
  return (
    <div className="flex bg-muted rounded-xl p-1 gap-1">
      {(["phone", "email"] as AuthMethod[]).map((m) => (
        <button
          key={m}
          type="button"
          onClick={() => onChange(m)}
          className={cn(
            "flex-1 flex items-center justify-center gap-2 rounded-lg py-2 text-sm font-body font-semibold transition-all duration-200",
            method === m ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
          )}
        >
          {m === "phone" ? (
            <>
              <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor"><title>Phone</title><path d="M6.62 10.79a15.053 15.053 0 0 0 6.59 6.59l2.2-2.2a1 1 0 0 1 1.01-.24c1.12.37 2.33.57 3.58.57a1 1 0 0 1 1 1V20a1 1 0 0 1-1 1C10.61 21 3 13.39 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1c0 1.25.2 2.45.57 3.58a1 1 0 0 1-.25 1.01l-2.2 2.2Z" /></svg>
              Phone
            </>
          ) : (
            <>
              <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none"><title>Email</title><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /><polyline points="22,6 12,13 2,6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
              Email
            </>
          )}
        </button>
      ))}
    </div>
  );
}

// ─── Sign Up Flow ─────────────────────────────────────────────────────────────

function SignUpForm({ onDone }: { onDone: () => void }) {
  const [step, setStep] = useState<SignupStep>("method");
  const [method, setMethod] = useState<AuthMethod>("phone");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [dir, setDir] = useState(1);

  const value = method === "phone" ? phone : email;

  const goNext = (next: SignupStep) => { setDir(1); setStep(next); };
  const goBack = (prev: SignupStep) => { setDir(-1); setStep(prev); };

  const handleSendOtp = () => {
    const errs: Record<string, string> = {};
    if (method === "phone") {
      if (phone.replace(/\D/g, "").length < 10) errs.value = "Enter a valid 10-digit phone number.";
    } else {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errs.value = "Enter a valid email address.";
    }
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setErrors({});
    setLoading(true);
    // Simulate OTP send
    setTimeout(() => {
      setLoading(false);
      toast.success(`OTP sent to ${method === "phone" ? `+91 ${phone}` : email}`);
      goNext("otp");
    }, 1000);
  };

  const handleVerifyOtp = () => {
    const errs: Record<string, string> = {};
    if (otp.replace(/\D/g, "").length < 6) errs.otp = "Enter the 6-digit OTP.";
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setErrors({});
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      goNext("password");
    }, 800);
  };

  const handleCreateAccount = () => {
    const errs: Record<string, string> = {};
    if (password.length < 8) errs.password = "Password must be at least 8 characters.";
    if (password !== confirmPassword) errs.confirmPassword = "Passwords do not match.";
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setErrors({});
    setLoading(true);
    setTimeout(() => {
      localSignUp(method, value);
      setLoading(false);
      onDone();
    }, 800);
  };

  const variants = {
    enter: (d: number) => ({ opacity: 0, x: d * 32 }),
    center: { opacity: 1, x: 0 },
    exit: (d: number) => ({ opacity: 0, x: d * -32 }),
  };

  return (
    <AnimatePresence mode="wait" custom={dir}>
      <motion.div
        key={step}
        custom={dir}
        variants={variants}
        initial="enter"
        animate="center"
        exit="exit"
        transition={{ duration: 0.2, ease: "easeInOut" }}
        className="space-y-4"
      >
        {/* STEP: method + credentials */}
        {step === "method" && (
          <>
            <div className="text-center space-y-1">
              <h2 className="font-body font-semibold text-foreground text-lg">Hello beautiful 🌸</h2>
              <p className="text-sm text-muted-foreground">Create your account to get started</p>
            </div>
            <MethodToggle method={method} onChange={(m) => { setMethod(m); setErrors({}); }} />
            {method === "phone" ? (
              <InputField
                label="Mobile number"
                id="signup-phone"
                type="tel"
                inputMode="numeric"
                placeholder="9876543210"
                prefix="+91"
                value={phone}
                onChange={(v) => setPhone(v.replace(/\D/g, "").slice(0, 10))}
                error={errors.value}
                autoFocus
              />
            ) : (
              <InputField
                label="Email address"
                id="signup-email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={setEmail}
                error={errors.value}
                autoFocus
              />
            )}
            <PrimaryButton onClick={handleSendOtp} loading={loading}>
              Send OTP
            </PrimaryButton>
            <p className="text-center text-xs text-muted-foreground">
              <span className="text-primary font-medium">7-day free trial</span> — no card required.
            </p>
          </>
        )}

        {/* STEP: OTP */}
        {step === "otp" && (
          <>
            <div className="text-center space-y-1">
              <h2 className="font-body font-semibold text-foreground text-lg">Enter your OTP</h2>
              <p className="text-sm text-muted-foreground">
                Sent to <span className="text-foreground font-medium">{method === "phone" ? `+91 ${phone}` : email}</span>
              </p>
            </div>
            <div className="space-y-1.5">
              <label htmlFor="otp-input" className="text-sm font-body font-medium text-foreground block">6-digit OTP</label>
              <input
                id="otp-input"
                type="text"
                inputMode="numeric"
                maxLength={6}
                placeholder="• • • • • •"
                value={otp}
                autoFocus
                onChange={(e) => { setOtp(e.target.value.replace(/\D/g, "").slice(0, 6)); setErrors({}); }}
                className={cn(
                  "w-full text-center tracking-[0.6em] text-xl px-4 py-3.5 rounded-xl border bg-card text-foreground outline-none transition-colors font-body",
                  errors.otp ? "border-destructive" : "border-border focus:border-primary",
                )}
              />
              {errors.otp && <p className="text-xs text-destructive">{errors.otp}</p>}
            </div>
            <PrimaryButton onClick={handleVerifyOtp} disabled={otp.length < 6} loading={loading}>
              Verify OTP
            </PrimaryButton>
            <button type="button" onClick={() => { goBack("method"); setOtp(""); setErrors({}); }} className="w-full text-sm text-muted-foreground hover:text-primary transition-colors text-center">
              ← Change {method === "phone" ? "number" : "email"}
            </button>
            <button type="button" onClick={handleSendOtp} className="w-full text-xs text-muted-foreground hover:text-primary transition-colors text-center">
              Didn't get it? Resend OTP
            </button>
          </>
        )}

        {/* STEP: password */}
        {step === "password" && (
          <>
            <div className="text-center space-y-1">
              <h2 className="font-body font-semibold text-foreground text-lg">Create a password</h2>
              <p className="text-sm text-muted-foreground">You'll use this to sign in next time</p>
            </div>
            <InputField
              label="Password"
              id="signup-password"
              type="password"
              placeholder="Min. 8 characters"
              value={password}
              onChange={setPassword}
              error={errors.password}
              autoFocus
            />
            <InputField
              label="Confirm password"
              id="signup-confirm"
              type="password"
              placeholder="Re-enter password"
              value={confirmPassword}
              onChange={setConfirmPassword}
              error={errors.confirmPassword}
            />
            <PrimaryButton onClick={handleCreateAccount} loading={loading}>
              Create Account
            </PrimaryButton>
            <button type="button" onClick={() => { goBack("otp"); setErrors({}); }} className="w-full text-sm text-muted-foreground hover:text-primary transition-colors text-center">
              ← Back
            </button>
          </>
        )}
      </motion.div>
    </AnimatePresence>
  );
}

// ─── Sign In Flow ─────────────────────────────────────────────────────────────

function SignInForm({ onDone }: { onDone: () => void }) {
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const handleSignIn = () => {
    const errs: Record<string, string> = {};
    if (phone.replace(/\D/g, "").length < 10) {
      errs.value = "Enter a valid 10-digit phone number.";
    }
    if (password.length < 1) errs.password = "Please enter your password.";
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    setErrors({});
    setLoading(true);
    setTimeout(() => {
      localSignIn("phone", phone);
      setLoading(false);
      onDone();
    }, 900);
  };

  return (
    <div className="space-y-4">
      <div className="text-center space-y-1">
        <h2 className="font-body font-semibold text-foreground text-lg">Welcome back</h2>
        <p className="text-sm text-muted-foreground">Sign in with the demo account</p>
      </div>
      <InputField
        label="Mobile number"
        id="signin-phone"
        type="tel"
        inputMode="numeric"
        placeholder="9876543210"
        prefix="+91"
        value={phone}
        onChange={(v) => { setPhone(v.replace(/\D/g, "").slice(0, 10)); setErrors({}); }}
        error={errors.value}
        autoFocus
      />
      <InputField
        label="Password"
        id="signin-password"
        type="password"
        placeholder="Your password"
        value={password}
        onChange={(v) => { setPassword(v); setErrors({}); }}
        error={errors.password}
      />
      <p className="text-center text-xs text-muted-foreground">
        Demo login: +91 9876543210 · Password: 123456
      </p>
      <PrimaryButton onClick={handleSignIn} loading={loading}>
        Sign In
      </PrimaryButton>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function LoginPage() {
  const navigate = useNavigate();
  const [mode] = useState<Mode>("signin");

  // If already authenticated, skip to the right place
  useEffect(() => {
    if (MOCK_MODE && isLocallyAuthenticated()) {
      if (isProfileComplete()) navigate({ to: "/home" });
      else navigate({ to: "/profile-setup" });
    }
  }, [navigate]);

  const handleSignUpDone = () => navigate({ to: "/profile-setup" });
  const handleSignInDone = () => {
    if (isProfileComplete()) navigate({ to: "/home" });
    else navigate({ to: "/profile-setup" });
  };

  const variants = {
    enter: (d: number) => ({ opacity: 0, x: d * 32 }),
    center: { opacity: 1, x: 0 },
    exit: (d: number) => ({ opacity: 0, x: d * -32 }),
  };

  return (
    <div className="relative flex flex-col min-h-screen bg-background overflow-hidden">
      {/* Blobs */}
      <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-primary/10 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-80 h-80 rounded-full bg-accent/10 blur-3xl pointer-events-none" />

      <div className="flex flex-1 items-center justify-center px-6 py-10">
        <div className="relative z-10 w-full max-w-md">
          <Logo />

          {/* Auth card */}
          <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
            <AnimatePresence mode="wait" custom={mode === "signup" ? 1 : -1}>
              <motion.div
                key={mode}
                custom={mode === "signup" ? 1 : -1}
                variants={variants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.2 }}
                className="px-6 py-7"
              >
                {mode === "signup" ? (
                  <SignUpForm onDone={handleSignUpDone} />
                ) : (
                  <SignInForm onDone={handleSignInDone} />
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          <p className="text-center text-xs text-muted-foreground mt-6">
            © {new Date().getFullYear()}. Built with love using{" "}
            <a href="https://caffeine.ai" target="_blank" rel="noopener noreferrer" className="underline hover:text-primary transition-colors">
              caffeine.ai
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
