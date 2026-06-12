import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, CheckCircle2, Clock } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  useActivateSubscription,
  useCancelSubscription,
  useCreateSubscriptionCheckout,
  useGrantDummySubscription,
  useSubscription,
} from "../hooks/use-backend";
import { SubscriptionStatus, SubscriptionTier } from "../types";

// ─── Helpers ────────────────────────────────────────────────────────────────

function daysUntil(tsNs: bigint): number {
  const ms = Number(tsNs / BigInt(1_000_000));
  return Math.max(0, Math.ceil((ms - Date.now()) / 86_400_000));
}

function formatDate(tsNs: bigint): string {
  const ms = Number(tsNs / BigInt(1_000_000));
  return new Date(ms).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

const TIER_LABELS: Record<string, string> = {
  freeTrial: "Free Trial",
  weekly: "3 Months",
  monthly: "6 Months",
  premium: "12 Months",
};

// ─── Trial Banner ────────────────────────────────────────────────────────────

function TrialBanner({ daysLeft }: { daysLeft: number }) {
  const pct = Math.round(((7 - daysLeft) / 7) * 100);
  return (
    <div
      data-ocid="subscription.trial_banner"
      className="rounded-2xl bg-primary/10 border border-primary/25 p-4 space-y-3"
    >
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-1.5 mb-0.5">
            <Clock className="size-3.5 text-primary" />
            <p className="text-sm font-semibold text-primary font-body">
              Free Trial Active
            </p>
          </div>
          <p className="text-xs text-muted-foreground">
            {daysLeft} day{daysLeft !== 1 ? "s" : ""} remaining — upgrade to
            keep full access
          </p>
        </div>
        <span className="font-display text-2xl font-semibold text-primary leading-none">
          {daysLeft}d
        </span>
      </div>
      <div
        className="h-2 rounded-full bg-primary/20 overflow-hidden"
        aria-label={`Trial progress: ${pct}% elapsed`}
      >
        <div
          className="h-full rounded-full bg-primary transition-smooth"
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="text-xs text-muted-foreground">
        Choose a plan below before your trial expires.
      </p>
    </div>
  );
}

// ─── Current Plan Card ───────────────────────────────────────────────────────

function CurrentPlanCard({
  tier,
  status,
  renewalDate,
  trialEndsAt,
  onCancelClick,
  isCancelling,
}: {
  tier: string;
  status: string;
  renewalDate?: bigint;
  trialEndsAt: bigint;
  onCancelClick: () => void;
  isCancelling: boolean;
}) {
  const isActive = status === SubscriptionStatus.active;
  const isTrial = tier === SubscriptionTier.freeTrial;
  const isPaidActive = isActive && !isTrial;

  return (
    <Card
      data-ocid="subscription.current_plan_card"
      className="p-5 shadow-warm-md bg-card space-y-3"
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-muted-foreground font-body uppercase tracking-wider mb-1">
            Current Plan
          </p>
          <h2 className="font-display text-xl text-foreground">
            {TIER_LABELS[tier] ?? tier}
          </h2>
        </div>
        <Badge
          data-ocid="subscription.status_badge"
          variant={
            isActive
              ? "default"
              : status === "expired"
                ? "destructive"
                : "outline"
          }
          className={
            isActive
              ? "bg-secondary/20 text-secondary-foreground border-secondary/30"
              : undefined
          }
        >
          {isActive ? "Active" : status === "expired" ? "Expired" : "Cancelled"}
        </Badge>
      </div>

      {isTrial && (
        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <AlertCircle className="size-3.5 text-primary shrink-0" />
          Trial ends {formatDate(trialEndsAt)}
        </p>
      )}
      {renewalDate && isActive && !isTrial && (
        <p className="text-xs text-muted-foreground">
          Renews on{" "}
          <span className="text-foreground font-medium">
            {formatDate(renewalDate)}
          </span>
        </p>
      )}

      {isPaidActive && (
        <Button
          variant="outline"
          size="sm"
          data-ocid="subscription.cancel_button"
          onClick={onCancelClick}
          disabled={isCancelling}
          className="text-destructive border-destructive/30 hover:bg-destructive/8 w-full mt-1"
        >
          {isCancelling ? "Cancelling…" : "Cancel Subscription"}
        </Button>
      )}
    </Card>
  );
}

// ─── Plan Cards ───────────────────────────────────────────────────────────────

const PLANS = [
  {
    tier: SubscriptionTier.weekly,
    label: "3 Months",
    totalPrice: "₹1,499",
    effectivePrice: "₹499/month",
    style: "rose" as const,
    features: [
      "Cycle-synced workout plans",
      "Daily nutrition guidance",
      "Phase-based meal templates",
      "Progress tracking",
    ],
  },
  {
    tier: SubscriptionTier.monthly,
    label: "6 Months",
    totalPrice: "₹2,499",
    effectivePrice: "₹416/month",
    style: "sage" as const,
    badge: "Most Popular",
    features: [
      "Everything in 3 Months",
      "Full recipe library access",
      "Water & weight tracking",
      "Grocery list generator",
    ],
  },
  {
    tier: SubscriptionTier.premium,
    label: "12 Months",
    totalPrice: "₹3,999",
    effectivePrice: "₹333/month",
    style: "gold" as const,
    badge: "Best Value",
    features: [
      "Everything in 6 Months",
      "Advanced cycle analytics",
      "Custom plan adjustments",
      "Expert consultation (Coming Soon)",
    ],
  },
] as const;

type PlanStyle = "rose" | "sage" | "gold";

const STYLE_MAP: Record<
  PlanStyle,
  { card: string; label: string; cta: string; check: string; badge: string }
> = {
  rose: {
    card: "bg-primary/5 border-primary/20",
    label: "bg-primary/10 text-primary",
    cta: "bg-primary text-primary-foreground hover:bg-primary/90",
    check: "text-primary",
    badge: "bg-primary/15 text-primary border-primary/25",
  },
  sage: {
    card: "bg-secondary/5 border-secondary/25",
    label: "bg-secondary/15 text-secondary-foreground",
    cta: "bg-secondary text-secondary-foreground hover:bg-secondary/90",
    check: "text-secondary",
    badge: "bg-secondary/20 text-secondary-foreground border-secondary/30",
  },
  gold: {
    card: "bg-accent/8 border-accent/30 ring-1 ring-accent/15",
    label: "bg-accent/15 text-accent-foreground",
    cta: "bg-accent text-accent-foreground hover:bg-accent/90",
    check: "text-accent-foreground",
    badge: "bg-accent/20 text-accent-foreground border-accent/30",
  },
};

function PlanCard({
  plan,
  index,
  isCurrent,
  onSelect,
  isLoadingThis,
  anyLoading,
}: {
  plan: (typeof PLANS)[number];
  index: number;
  isCurrent: boolean;
  onSelect: () => void;
  isLoadingThis: boolean;
  anyLoading: boolean;
}) {
  const s = STYLE_MAP[plan.style];

  return (
    <Card
      data-ocid={`subscription.plan_card.${index}`}
      className={`p-5 space-y-4 shadow-warm transition-smooth ${s.card} ${isCurrent ? "ring-2 ring-offset-1 ring-secondary/50" : ""}`}
    >
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className={`text-xs font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full ${s.label}`}
            >
              {plan.label}
            </span>
            {"badge" in plan && plan.badge && (
              <Badge
                className={`text-[10px] px-2 rounded-full border ${s.badge}`}
              >
                {plan.badge}
              </Badge>
            )}
            {isCurrent && (
              <span className="text-xs text-secondary font-medium">
                ✓ Current
              </span>
            )}
          </div>
          <div className="flex items-baseline gap-1 mt-2">
            <span className="font-display text-3xl font-semibold text-foreground">
              {plan.totalPrice}
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5 font-body">
            {plan.effectivePrice} effective
          </p>
        </div>
        {plan.style === "gold" && (
          <span className="text-xl" aria-hidden="true">
            ✨
          </span>
        )}
      </div>

      <ul className="space-y-2">
        {plan.features.map((f) => {
          const isComingSoon = f.includes("Coming Soon");
          return (
            <li key={f} className="flex items-start gap-2 text-sm">
              <CheckCircle2
                className={`size-4 mt-0.5 shrink-0 ${isComingSoon ? "text-muted-foreground opacity-50" : s.check}`}
              />
              <span
                className={
                  isComingSoon
                    ? "text-muted-foreground italic"
                    : "text-foreground"
                }
              >
                {f}
              </span>
            </li>
          );
        })}
      </ul>

      <Button
        data-ocid={`subscription.plan_select_button.${index}`}
        onClick={onSelect}
        disabled={isCurrent || anyLoading}
        className={`w-full font-semibold transition-smooth ${s.cta}`}
      >
        {isCurrent
          ? "Current Plan"
          : isLoadingThis
            ? "Redirecting…"
            : `Choose ${plan.label} Plan`}
      </Button>
    </Card>
  );
}

// ─── Cancel Dialog ───────────────────────────────────────────────────────────

function CancelDialog({
  open,
  onClose,
  onConfirm,
  isPending,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isPending: boolean;
}) {
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent
        data-ocid="subscription.cancel_dialog"
        className="max-w-sm rounded-2xl"
      >
        <DialogHeader>
          <DialogTitle className="font-display">
            Cancel Subscription?
          </DialogTitle>
          <DialogDescription className="font-body text-muted-foreground">
            You'll keep access until the end of your billing period, then lose
            premium features. This cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex gap-2 mt-2">
          <Button
            variant="outline"
            data-ocid="subscription.keep_plan_button"
            onClick={onClose}
            disabled={isPending}
            className="flex-1"
          >
            Keep Plan
          </Button>
          <Button
            variant="destructive"
            data-ocid="subscription.confirm_button"
            onClick={onConfirm}
            disabled={isPending}
            className="flex-1"
          >
            {isPending ? "Cancelling…" : "Yes, Cancel"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function SubscriptionPage() {
  const { data: subscription, isLoading, isError } = useSubscription();
  const cancelMutation = useCancelSubscription();
  const checkoutMutation = useCreateSubscriptionCheckout();
  const activateMutation = useActivateSubscription();
  const dummyMutation = useGrantDummySubscription();
  const activateMutate = activateMutation.mutate;

  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [checkingOutTier, setCheckingOutTier] =
    useState<SubscriptionTier | null>(null);

  // Handle Stripe redirect return
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const sessionId = params.get("session_id");
    const rawTier = params.get("tier");
    const tier =
      rawTier &&
      Object.values(SubscriptionTier).includes(rawTier as SubscriptionTier)
        ? (rawTier as SubscriptionTier)
        : null;

    if (sessionId && tier) {
      activateMutate(
        { sessionId, tier },
        {
          onSuccess: () => {
            toast.success("Subscription activated! Welcome to FemmeFlow. 🌸");
            window.history.replaceState({}, "", window.location.pathname);
          },
          onError: () => {
            toast.error(
              "Could not activate your subscription. Please contact support.",
            );
          },
        },
      );
    }
  }, [activateMutate]);

  function handleSelectPlan(tier: SubscriptionTier) {
    const origin = window.location.origin;
    const path = window.location.pathname;
    setCheckingOutTier(tier);
    checkoutMutation.mutate(
      {
        tier,
        successUrl: `${origin}${path}?session_id={CHECKOUT_SESSION_ID}&tier=${tier}`,
        cancelUrl: `${origin}${path}`,
      },
      {
        onSuccess: (url) => {
          window.location.href = url;
        },
        onError: () => {
          toast.error("Could not start checkout. Please try again.");
          setCheckingOutTier(null);
        },
      },
    );
  }

  function handleCancelConfirm() {
    cancelMutation.mutate(undefined, {
      onSuccess: () => {
        toast.success("Subscription cancelled.");
        setCancelDialogOpen(false);
      },
      onError: () => {
        toast.error("Could not cancel. Please try again.");
      },
    });
  }

  // ── Loading ──────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div
        data-ocid="subscription.loading_state"
        className="px-4 py-6 space-y-4 max-w-md mx-auto"
      >
        <Skeleton className="h-6 w-40 rounded-xl" />
        <Skeleton className="h-24 w-full rounded-2xl" />
        <Skeleton className="h-36 w-full rounded-2xl" />
        <Skeleton className="h-56 w-full rounded-2xl" />
        <Skeleton className="h-56 w-full rounded-2xl" />
        <Skeleton className="h-56 w-full rounded-2xl" />
      </div>
    );
  }

  // ── Error / no data ──────────────────────────────────────────────────────
  if (isError || !subscription) {
    return (
      <div
        data-ocid="subscription.error_state"
        className="flex flex-col items-center justify-center min-h-[60vh] px-6 text-center space-y-3"
      >
        <span className="text-5xl" aria-hidden="true">
          🌸
        </span>
        <h2 className="font-display text-xl text-foreground">
          Subscription Unavailable
        </h2>
        <p className="text-muted-foreground text-sm max-w-xs font-body">
          We couldn't load your subscription details. Please refresh the page or
          try again later.
        </p>
      </div>
    );
  }

  // ── Derived ──────────────────────────────────────────────────────────────
  const isTrialActive =
    subscription.tier === SubscriptionTier.freeTrial &&
    subscription.status === SubscriptionStatus.active;
  const trialDaysLeft = isTrialActive ? daysUntil(subscription.trialEndsAt) : 0;

  const anyCheckoutLoading = checkoutMutation.isPending;

  return (
    <div
      data-ocid="subscription.page"
      className="px-4 py-6 pb-safe space-y-5 max-w-md mx-auto"
    >
      {/* Heading */}
      <div>
        <h1 className="font-display text-2xl text-foreground">Subscription</h1>
        <p className="text-muted-foreground text-sm mt-0.5 font-body">
          Manage your plan and billing
        </p>
      </div>

      {/* Trial banner */}
      {isTrialActive && <TrialBanner daysLeft={trialDaysLeft} />}

      {/* Current plan */}
      <CurrentPlanCard
        tier={subscription.tier as string}
        status={subscription.status as string}
        renewalDate={subscription.renewalDate}
        trialEndsAt={subscription.trialEndsAt}
        onCancelClick={() => setCancelDialogOpen(true)}
        isCancelling={cancelMutation.isPending}
      />

      {/* Rose upgrade CTA for trial */}
      {isTrialActive && (
        <div
          data-ocid="subscription.upgrade_cta"
          className="rounded-2xl bg-primary/8 border border-primary/20 px-4 py-3 text-center"
        >
          <p className="text-sm font-semibold text-primary font-body">
            Upgrade to keep access →
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Choose a plan below before your trial expires.
          </p>
        </div>
      )}

      {/* Plan cards */}
      <div data-ocid="subscription.plans_section">
        <h2 className="font-display text-lg text-foreground mb-3">
          Choose a Plan
        </h2>
        <div className="space-y-3">
          {PLANS.map((plan, i) => (
            <PlanCard
              key={plan.tier}
              plan={plan}
              index={i + 1}
              isCurrent={subscription.tier === plan.tier}
              onSelect={() => handleSelectPlan(plan.tier)}
              isLoadingThis={checkingOutTier === plan.tier}
              anyLoading={anyCheckoutLoading}
            />
          ))}
        </div>
      </div>

      {/* Test subscription button */}
      <div className="pt-1">
        <Button
          variant="outline"
          size="sm"
          data-ocid="subscription.dummy_test_button"
          onClick={() => {
            dummyMutation.mutate(undefined, {
              onSuccess: () => {
                toast.success("Test subscription activated!");
              },
              onError: () => {
                toast.error("Failed to activate test subscription.");
              },
            });
          }}
          disabled={dummyMutation.isPending}
          className="w-full rounded-full border-dashed border-muted-foreground/40 text-muted-foreground hover:text-foreground hover:border-foreground/40 transition-smooth"
        >
          {dummyMutation.isPending
            ? "Activating…"
            : "Activate 6-Month Test Subscription"}
        </Button>
        <p className="text-[10px] text-center text-muted-foreground mt-1.5 font-body">
          For testing only — grants a 6-month active plan instantly
        </p>
      </div>

      <p className="text-center text-xs text-muted-foreground font-body pb-2">
        Prices in INR · Payments processed securely via Stripe · Cancel anytime
      </p>

      {/* Cancel Confirmation Dialog */}
      <CancelDialog
        open={cancelDialogOpen}
        onClose={() => setCancelDialogOpen(false)}
        onConfirm={handleCancelConfirm}
        isPending={cancelMutation.isPending}
      />
    </div>
  );
}
