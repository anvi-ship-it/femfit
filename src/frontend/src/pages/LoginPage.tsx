import { Skeleton } from "@/components/ui/skeleton";
import { useInternetIdentity } from "@caffeineai/core-infrastructure";
import { useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useOnboardingProfile } from "../hooks/use-backend";

export default function LoginPage() {
  const { isAuthenticated, isInitializing, login } = useInternetIdentity();
  const navigate = useNavigate();
  const { data: profile, isLoading: isProfileLoading } = useOnboardingProfile();

  useEffect(() => {
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

            <button
              type="button"
              onClick={login}
              data-ocid="login.primary_button"
              className="w-full flex items-center justify-center gap-3 bg-primary text-primary-foreground rounded-xl py-3.5 px-6 font-body font-semibold text-base transition-all duration-200 hover:bg-primary/90 hover:shadow-md active:scale-[0.98] shadow-sm"
            >
              <svg viewBox="0 0 24 24" className="w-5 h-5 shrink-0" fill="none">
                <title>Identity icon</title>
                <circle
                  cx="12"
                  cy="8"
                  r="4"
                  fill="currentColor"
                  opacity="0.9"
                />
                <path
                  d="M4 20c0-4 3.582-7 8-7s8 3 8 7"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
              Sign In with Internet Identity
            </button>

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
