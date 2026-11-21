import { cn } from "@/lib/utils";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { Flower2 } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import { isProfileComplete } from "../lib/local-auth";

// ─── Types ────────────────────────────────────────────────────────────────────

type Mode = "signup" | "signin";
type SignupStep = "method" | "otp";

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function authRequest(
  path: string,
  body?: Record<string, string>,
  method = "POST",
): Promise<{ phone?: string }> {
  const response = await fetch(path, {
    method,
    credentials: "same-origin",
    ...(body
      ? {
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        }
      : {}),
  });
  const result = (await response.json().catch(() => ({}))) as {
    error?: string;
    phone?: string;
  };
  if (!response.ok)
    throw new Error(result.error || "We could not complete that request.");
  return result;
}

function Logo() {
  return (
    <div className="flex flex-col items-center gap-3 mb-8">
      <div className="w-14 h-14 rounded-2xl bg-primary flex items-center justify-center shadow-md">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          className="w-8 h-8 text-primary-foreground"
        >
          <title>FemFit</title>
          <path
            d="M12 2C8.686 2 6 4.686 6 8c0 2.21.895 4.21 2.343 5.657L12 17.314l3.657-3.657A7.965 7.965 0 0 0 18 8c0-3.314-2.686-6-6-6Z"
            fill="currentColor"
            opacity="0.85"
          />
          <path
            d="M12 17.314V22M10 22h4"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      </div>
      <div className="text-center">
        <h1 className="font-display text-4xl font-semibold text-primary tracking-tight">
          FemFit
        </h1>
        <p className="text-muted-foreground font-body text-sm mt-0.5">
          Your cycle-synced wellness companion
        </p>
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

  maxLength?: number;
}) {
  return (
    <div className="space-y-1.5">
      <label
        htmlFor={id}
        className="text-sm font-body font-medium text-foreground block"
      >
        {label}
      </label>
      <div
        className={cn(
          "flex rounded-xl overflow-hidden border transition-colors focus-within:border-primary",
          error ? "border-destructive" : "border-border",
        )}
      >
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
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8v8H4z"
          />
        </svg>
      ) : null}
      {children}
    </button>
  );
}

// ─── Sign Up Flow ─────────────────────────────────────────────────────────────

function SignUpForm({
  mode,
  onDone,
}: {
  mode: Mode;
  onDone: (phone: string) => void;
}) {
  const [step, setStep] = useState<SignupStep>("method");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [dir, setDir] = useState(1);

  const goNext = (next: SignupStep) => {
    setDir(1);
    setStep(next);
  };
  const goBack = (prev: SignupStep) => {
    setDir(-1);
    setStep(prev);
  };

  const handleSendOtp = async () => {
    if (phone.replace(/\D/g, "").length < 10) {
      setErrors({ value: "Enter a valid 10-digit phone number." });
      return;
    }

    setErrors({});
    setLoading(true);
    try {
      await authRequest("/api/auth/request-code", { phone: `+91${phone}` });
      toast.success(`Verification code sent to +91 ${phone}`);
      goNext("otp");
    } catch (error) {
      console.error("OTP send failed:", error);
      setErrors({
        value:
          error instanceof Error ? error.message : "Could not send a code.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (otp.replace(/\D/g, "").length !== 6) {
      setErrors({ otp: "Enter the 6-digit code." });
      return;
    }

    setErrors({});
    setLoading(true);
    try {
      const session = await authRequest("/api/auth/verify-code", {
        phone: `+91${phone}`,
        code: otp,
      });
      onDone(session.phone ?? `+91${phone}`);
    } catch (error) {
      console.error("OTP verification failed:", error);
      setErrors({
        otp:
          error instanceof Error
            ? error.message
            : "Could not verify that code.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setLoading(true);
    setErrors({});
    try {
      await authRequest("/api/auth/request-code", { phone: `+91${phone}` });
      toast.success("A new verification code has been sent.");
    } catch (error) {
      console.error("OTP resend failed:", error);
      setErrors({
        otp:
          error instanceof Error ? error.message : "Could not resend the code.",
      });
    } finally {
      setLoading(false);
    }
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
              <h2 className="font-body font-semibold text-foreground text-lg">
                {mode === "signup" ? "Hello beautiful" : "Welcome back"}{" "}
                <Flower2
                  aria-hidden="true"
                  className="inline-block h-4 w-4 text-primary"
                />
              </h2>
              <p className="text-sm text-muted-foreground">
                {mode === "signup"
                  ? "Create your account to get started"
                  : "Sign in with your verified phone number"}
              </p>
            </div>
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
            />
            <PrimaryButton onClick={handleSendOtp} loading={loading}>
              Send verification code
            </PrimaryButton>
            {import.meta.env.DEV && (
              <p className="text-center text-xs text-muted-foreground">
                Development demo: +91 9876543210 · OTP 123456
              </p>
            )}
            <p className="text-center text-xs text-muted-foreground">
              <span className="text-primary font-medium">7-day free trial</span>{" "}
              — no card required.
            </p>
          </>
        )}

        {/* STEP: OTP */}
        {step === "otp" && (
          <>
            <div className="text-center space-y-1">
              <h2 className="font-body font-semibold text-foreground text-lg">
                Enter your OTP
              </h2>
              <p className="text-sm text-muted-foreground">
                Sent to{" "}
                <span className="text-foreground font-medium">+91 {phone}</span>
              </p>
            </div>
            <div className="space-y-1.5">
              <label
                htmlFor="otp-input"
                className="text-sm font-body font-medium text-foreground block"
              >
                6-digit OTP
              </label>
              <input
                id="otp-input"
                type="text"
                inputMode="numeric"
                maxLength={6}
                placeholder="• • • • • •"
                value={otp}
                onChange={(e) => {
                  setOtp(e.target.value.replace(/\D/g, "").slice(0, 6));
                  setErrors({});
                }}
                className={cn(
                  "w-full text-center tracking-[0.6em] text-xl px-4 py-3.5 rounded-xl border bg-card text-foreground outline-none transition-colors font-body",
                  errors.otp
                    ? "border-destructive"
                    : "border-border focus:border-primary",
                )}
              />
              {errors.otp && (
                <p className="text-xs text-destructive">{errors.otp}</p>
              )}
            </div>
            <PrimaryButton
              onClick={handleVerifyOtp}
              disabled={otp.length < 6}
              loading={loading}
            >
              Verify OTP
            </PrimaryButton>
            <button
              type="button"
              onClick={() => {
                goBack("method");
                setOtp("");
                setErrors({});
              }}
              className="w-full text-sm text-muted-foreground hover:text-primary transition-colors text-center"
            >
              ← Change number
            </button>
            <button
              type="button"
              onClick={handleResendOtp}
              disabled={loading}
              className="w-full text-xs text-muted-foreground hover:text-primary transition-colors text-center disabled:opacity-50"
            >
              Didn&apos;t get it? Resend code
            </button>
          </>
        )}
      </motion.div>
    </AnimatePresence>
  );
}

// ─── Sign In Flow ─────────────────────────────────────────────────────────────

function SignInForm({ onDone }: { onDone: (phone: string) => void }) {
  return <SignUpForm mode="signin" onDone={onDone} />;
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function LoginPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [mode, setMode] = useState<Mode>("signup");

  const startSession = (phone: string) => {
    queryClient.setQueryData(["authSession"], { authenticated: true, phone });
  };
  const handleSignUpDone = (phone: string) => {
    startSession(phone);
    navigate({ to: "/profile-setup" });
  };
  const handleSignInDone = (phone: string) => {
    startSession(phone);
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

          {/* Mode tabs */}
          <div className="flex bg-muted rounded-xl p-1 gap-1 mb-6">
            {(["signup", "signin"] as Mode[]).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMode(m)}
                className={cn(
                  "flex-1 rounded-lg py-2.5 text-sm font-body font-semibold transition-all duration-200",
                  mode === m
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {m === "signup" ? "Create Account" : "Sign In"}
              </button>
            ))}
          </div>

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
                  <SignUpForm mode="signup" onDone={handleSignUpDone} />
                ) : (
                  <SignInForm onDone={handleSignInDone} />
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          <p className="text-center text-xs text-muted-foreground mt-6">
            © {new Date().getFullYear()}. Built with love using{" "}
            <a
              href="https://caffeine.ai"
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
