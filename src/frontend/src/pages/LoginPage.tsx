import { Skeleton } from "@/components/ui/skeleton";
import { useInternetIdentity } from "@caffeineai/core-infrastructure";
import { useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useOnboardingProfile } from "../hooks/use-backend";
import { MOCK_MODE } from "../lib/mock-mode";

export default function LoginPage() {
  const { isAuthenticated, isInitializing } = useInternetIdentity();
  const navigate = useNavigate();
  const { data: profile, isLoading: isProfileLoading } = useOnboardingProfile();

  const [phone, setPhone] = useState("");
  const [phoneStep, setPhoneStep] = useState<"input" | "otp">("input");
  const [otp, setOtp] = useState("");

  useEffect(() => {
    if (MOCK_MODE) {
      navigate({ to: "/home" });
      return;
    }
    if (!isAuthenticated || isInitializing || isProfileLoading) return;
    if (profile !== null && profile !== undefined) {
      navigate({ to: "/home" });
    } else {
      navigate({ to: "/onboarding" });
    }
  }, [isAuthenticated, isInitializing, isProfileLoading, profile, navigate]);

  if (isInitializing) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="space-y-3 w-48">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      </div>
    );
  }

  const handlePhoneContinue = () => {
    if (!phone.trim()) return;
    // TODO: integrate SMS OTP provider (e.g. Twilio / Firebase Phone Auth)
    setPhoneStep("otp");
  };

  const handleOtpVerify = () => {
    if (otp.length < 6) return;
    // TODO: verify OTP with SMS provider, then establish session
  };

  return (
    <div className="relative flex flex-col min-h-screen bg-background overflow-hidden">
      {/* Decorative blobs */}
      <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-primary/10 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-80 h-80 rounded-full bg-accent/10 blur-3xl pointer-events-none" />

      {/* Centered card */}
      <div className="flex flex-1 items-center justify-center px-6 py-12">
        <div className="relative z-10 w-full max-w-md">
          {/* Logo mark */}
          <div className="flex justify-center mb-8">
            <div
              className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center shadow-md"
              aria-hidden="true"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                className="w-9 h-9 text-primary-foreground"
              >
                <title>FemFit logo</title>
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
          </div>

          {/* Heading */}
          <div className="text-center mb-8 space-y-2">
            <h1 className="font-display text-5xl font-semibold text-primary tracking-tight">
              FemFit
            </h1>
            <p className="text-muted-foreground font-body text-lg leading-snug max-w-xs mx-auto">
              Your cycle-synced wellness companion for workouts and nutrition.
            </p>
          </div>

          {/* Feature pills */}
          <div className="flex flex-wrap justify-center gap-2 mb-10">
            {["Cycle Tracking", "Personalized Plans", "Indian Meals"].map(
              (tag) => (
                <span
                  key={tag}
                  className="px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-body font-medium border border-primary/20"
                >
                  {tag}
                </span>
              ),
            )}
          </div>

          {/* Sign-in card */}
          <div className="bg-card rounded-2xl border border-border shadow-sm px-6 py-8 space-y-5">
            <div className="text-center space-y-1">
              <h2 className="font-body font-semibold text-foreground text-lg">
                Welcome back
              </h2>
              <p className="text-sm text-muted-foreground">
                Sign in to continue your fitness journey
              </p>
            </div>

            {/* Phone number flow */}
            {phoneStep === "input" ? (
              <div className="space-y-3">
                <div className="flex rounded-xl overflow-hidden border border-border focus-within:border-primary transition-colors">
                  <span className="flex items-center px-3 bg-muted text-muted-foreground text-sm font-body select-none border-r border-border">
                    +91
                  </span>
                  <input
                    type="tel"
                    inputMode="numeric"
                    placeholder="Mobile number"
                    value={phone}
                    onChange={(e) =>
                      setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))
                    }
                    className="flex-1 px-4 py-3 bg-card text-foreground text-sm font-body placeholder:text-muted-foreground outline-none"
                  />
                </div>
                <button
                  type="button"
                  onClick={handlePhoneContinue}
                  disabled={phone.length < 10}
                  data-ocid="login.phone_button"
                  className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground rounded-xl py-3.5 px-6 font-body font-semibold text-base transition-all duration-200 hover:bg-primary/90 hover:shadow-md active:scale-[0.98] shadow-sm disabled:opacity-50 disabled:pointer-events-none"
                >
                  <svg viewBox="0 0 24 24" className="w-4 h-4 shrink-0" fill="none">
                    <title>Phone</title>
                    <path
                      d="M6.62 10.79a15.053 15.053 0 0 0 6.59 6.59l2.2-2.2a1 1 0 0 1 1.01-.24c1.12.37 2.33.57 3.58.57a1 1 0 0 1 1 1V20a1 1 0 0 1-1 1C10.61 21 3 13.39 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1c0 1.25.2 2.45.57 3.58a1 1 0 0 1-.25 1.01l-2.2 2.2Z"
                      fill="currentColor"
                    />
                  </svg>
                  Continue with Phone
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-center text-muted-foreground">
                  Enter the OTP sent to{" "}
                  <span className="text-foreground font-medium">+91 {phone}</span>
                </p>
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="6-digit OTP"
                  maxLength={6}
                  value={otp}
                  onChange={(e) =>
                    setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))
                  }
                  className="w-full text-center tracking-[0.5em] px-4 py-3 rounded-xl border border-border focus:border-primary bg-card text-foreground text-lg font-body outline-none transition-colors"
                />
                <button
                  type="button"
                  onClick={handleOtpVerify}
                  disabled={otp.length < 6}
                  className="w-full bg-primary text-primary-foreground rounded-xl py-3.5 px-6 font-body font-semibold text-base transition-all duration-200 hover:bg-primary/90 hover:shadow-md active:scale-[0.98] shadow-sm disabled:opacity-50 disabled:pointer-events-none"
                >
                  Verify &amp; Sign In
                </button>
                <button
                  type="button"
                  onClick={() => { setPhoneStep("input"); setOtp(""); }}
                  className="w-full text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  ← Change number
                </button>
              </div>
            )}

            {/* Divider */}
            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-border" />
              <span className="text-xs text-muted-foreground font-body">
                or continue with
              </span>
              <div className="flex-1 h-px bg-border" />
            </div>

            {/* Social sign-in buttons */}
            <div className="grid grid-cols-2 gap-3">
              {/* Google */}
              <button
                type="button"
                data-ocid="login.google_button"
                className="flex items-center justify-center gap-2 border border-border bg-card rounded-xl py-3 px-4 text-sm font-body font-medium text-foreground hover:bg-muted/40 hover:border-primary/30 transition-all duration-200 active:scale-[0.98]"
              >
                <svg viewBox="0 0 24 24" className="w-5 h-5 shrink-0">
                  <title>Google</title>
                  <path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09Z"
                    fill="#4285F4"
                  />
                  <path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23Z"
                    fill="#34A853"
                  />
                  <path
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84Z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53Z"
                    fill="#EA4335"
                  />
                </svg>
                Google
              </button>

              {/* Apple */}
              <button
                type="button"
                data-ocid="login.apple_button"
                className="flex items-center justify-center gap-2 border border-border bg-card rounded-xl py-3 px-4 text-sm font-body font-medium text-foreground hover:bg-muted/40 hover:border-primary/30 transition-all duration-200 active:scale-[0.98]"
              >
                <svg viewBox="0 0 24 24" className="w-5 h-5 shrink-0" fill="currentColor">
                  <title>Apple</title>
                  <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.7 9.05 7.4c1.38.07 2.33.74 3.13.8 1.19-.24 2.33-.93 3.6-.84 1.54.12 2.7.7 3.44 1.8-3.14 1.88-2.4 5.98.48 7.13-.56 1.45-1.3 2.88-2.65 4ZM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25Z" />
                </svg>
                Apple ID
              </button>
            </div>

            <p className="text-center text-xs text-muted-foreground">
              New here? Creating an account is free.{" "}
              <span className="text-primary font-medium">7-day free trial</span>{" "}
              starts automatically — no card required.
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="relative z-10 text-center py-4 text-xs text-muted-foreground">
        © {new Date().getFullYear()}. Built with love using{" "}
        <a
          href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(typeof window !== "undefined" ? window.location.hostname : "")}`}
          target="_blank"
          rel="noopener noreferrer"
          className="underline hover:text-primary transition-colors"
        >
          caffeine.ai
        </a>
      </footer>
    </div>
  );
}
