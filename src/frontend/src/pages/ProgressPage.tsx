import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useQueries, useQuery } from "@tanstack/react-query";
import {
  CheckCircle2,
  Droplets,
  Dumbbell,
  Flame,
  Scale,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { useBackendActor, useOnboardingProfile } from "../hooks/use-backend";
import type { CycleEntry, DailyLog } from "../types";
import { CYCLE_PHASE_COLORS, CYCLE_PHASE_LABELS } from "../types";

// ─── Helpers ────────────────────────────────────────────────────────────────

function dateStr(daysAgo = 0): string {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString().split("T")[0];
}

function formatShortDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function calcPhaseForDay(
  cycleStartMs: number,
  cycleLengthDays: number,
  day: Date,
  periodDurationDays = 5,
): string {
  const dayMs = day.getTime();
  const diffDays = Math.floor((dayMs - cycleStartMs) / 86_400_000);
  const dayOfCycle =
    (((diffDays % cycleLengthDays) + cycleLengthDays) % cycleLengthDays) + 1;

  if (dayOfCycle <= periodDurationDays) return "menstrual";
  if (dayOfCycle <= 13) return "follicular";
  if (dayOfCycle <= 16) return "ovulatory";
  return "luteal";
}

// ─── Phase color bands for cycle timeline ───────────────────────────────────

const PHASE_BG: Record<string, string> = {
  menstrual: "bg-destructive/25",
  follicular: "bg-primary/25",
  ovulatory: "bg-accent/25",
  luteal: "bg-secondary/25",
};

const PHASE_BORDER: Record<string, string> = {
  menstrual: "border-destructive/40",
  follicular: "border-primary/40",
  ovulatory: "border-accent/40",
  luteal: "border-secondary/40",
};

// ─── Hooks ───────────────────────────────────────────────────────────────────

function useCycleHistory() {
  const { actor, isFetching } = useBackendActor();
  return useQuery<CycleEntry[]>({
    queryKey: ["cycleHistory"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getCycleHistory();
    },
    enabled: !!actor && !isFetching,
  });
}

function useMultiDayLogs(days: number) {
  const { actor, isFetching } = useBackendActor();
  const dates = Array.from({ length: days }, (_, i) => dateStr(i));
  return useQueries({
    queries: dates.map((date) => ({
      queryKey: ["dailyLog", date],
      queryFn: async (): Promise<DailyLog | null> => {
        if (!actor) return null;
        return actor.getDailyLog(date);
      },
      enabled: !!actor && !isFetching,
    })),
  });
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="font-display text-lg text-foreground mb-3">{children}</h2>
  );
}

function EmptyState({
  icon,
  message,
  ocid,
}: {
  icon: React.ReactNode;
  message: string;
  ocid: string;
}) {
  return (
    <div
      className="rounded-2xl bg-muted/40 border border-dashed border-border p-6 text-center space-y-2"
      data-ocid={ocid}
    >
      <div className="flex justify-center text-muted-foreground/40">{icon}</div>
      <p className="text-sm text-muted-foreground font-body">{message}</p>
    </div>
  );
}

// ─── Today's Summary ────────────────────────────────────────────────────────

function TodaySummary({ log }: { log: DailyLog | null | undefined }) {
  const waterL = Math.round((Number(log?.waterMl ?? 0) / 1000) * 10) / 10;
  const meals = log?.mealsLogged?.length ?? 0;
  const done = log?.workoutDone ?? false;

  const items = [
    {
      icon: <Dumbbell className="size-4 text-primary" />,
      label: "Workout",
      value: done ? "Done ✓" : "Pending",
      highlight: done,
      ocid: "progress.today.workout_card",
    },
    {
      icon: <Droplets className="size-4 text-blue-400" />,
      label: "Water",
      value: `${waterL}L`,
      highlight: waterL >= 2,
      ocid: "progress.today.water_card",
    },
    {
      icon: <span className="text-base">🥗</span>,
      label: "Meals",
      value: `${meals} logged`,
      highlight: meals >= 3,
      ocid: "progress.today.meals_card",
    },
  ];

  return (
    <div className="grid grid-cols-3 gap-3" data-ocid="progress.today_summary">
      {items.map(({ icon, label, value, highlight, ocid }) => (
        <div
          key={label}
          className={cn(
            "rounded-2xl border shadow-warm p-3 text-center space-y-1.5 transition-smooth",
            highlight
              ? "bg-primary/5 border-primary/20"
              : "bg-card border-border",
          )}
          data-ocid={ocid}
        >
          <div className="flex justify-center">{icon}</div>
          <p
            className={cn(
              "font-display text-sm",
              highlight ? "text-primary" : "text-foreground",
            )}
          >
            {value}
          </p>
          <p className="text-[10px] text-muted-foreground font-body uppercase tracking-wide">
            {label}
          </p>
        </div>
      ))}
    </div>
  );
}

// ─── Streak ──────────────────────────────────────────────────────────────────

function StreakBadge({
  logs,
  isLoading,
}: {
  logs: (DailyLog | null | undefined)[];
  isLoading: boolean;
}) {
  if (isLoading) {
    return <Skeleton className="h-20 w-full rounded-2xl" />;
  }

  // Count consecutive days from today where workoutDone=true
  let streak = 0;
  for (const log of logs) {
    if (log?.workoutDone) streak++;
    else break;
  }

  return (
    <div
      className={cn(
        "rounded-2xl border shadow-warm p-4 flex items-center gap-4",
        streak > 0 ? "bg-accent/8 border-accent/25" : "bg-card border-border",
      )}
      data-ocid="progress.streak_card"
    >
      <div
        className={cn(
          "rounded-full p-3",
          streak > 0 ? "bg-accent/15" : "bg-muted",
        )}
      >
        <Flame
          className={cn(
            "size-6",
            streak > 0 ? "text-accent" : "text-muted-foreground",
          )}
        />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-display text-3xl text-foreground leading-none">
          {streak}
          <span className="font-body text-sm text-muted-foreground ml-1">
            day{streak !== 1 ? "s" : ""}
          </span>
        </p>
        <p className="text-xs text-muted-foreground font-body mt-0.5">
          {streak === 0
            ? "Start your streak today!"
            : streak < 3
              ? "Keep it up! 🌱"
              : streak < 7
                ? "You're on fire! 🔥"
                : "Unstoppable! 💪"}
        </p>
      </div>
      {streak >= 3 && (
        <Badge
          className="bg-accent/15 text-accent border-accent/30 font-body text-xs rounded-full"
          variant="outline"
        >
          {streak >= 7 ? "🏆 Champion" : "⚡ Hot Streak"}
        </Badge>
      )}
    </div>
  );
}

// ─── Weight Chart ────────────────────────────────────────────────────────────

function WeightLog({
  logs,
  isLoading,
}: {
  logs: (DailyLog | null | undefined)[];
  isLoading: boolean;
}) {
  if (isLoading) {
    return <Skeleton className="h-32 w-full rounded-2xl" />;
  }

  // Collect entries oldest-first, exclude days without weight
  const entries = logs
    .map((log, i) => ({
      date: dateStr(i),
      weight: log?.weightKg,
    }))
    .filter(
      (e): e is { date: string; weight: number } =>
        e.weight !== undefined && e.weight !== null,
    )
    .reverse(); // oldest first for chart

  if (entries.length === 0) {
    return (
      <EmptyState
        icon={<Scale className="size-8" />}
        message="No weight entries yet. Log your weight from the Progress tab to see trends."
        ocid="progress.weight.empty_state"
      />
    );
  }

  const weights = entries.map((e) => e.weight);
  const minW = Math.min(...weights) - 1;
  const maxW = Math.max(...weights) + 1;
  const range = maxW - minW || 1;

  // Trend direction
  const trend =
    entries.length >= 2 ? weights[weights.length - 1] - weights[0] : 0;

  const chartH = 80;
  const pts = entries.map((e, i) => {
    const x = entries.length === 1 ? 50 : (i / (entries.length - 1)) * 100;
    const y = chartH - ((e.weight - minW) / range) * chartH;
    return `${x},${y}`;
  });

  return (
    <div
      className="rounded-2xl bg-card border border-border shadow-warm p-4 space-y-3"
      data-ocid="progress.weight_section"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Scale className="size-4 text-accent" />
          <span className="text-sm font-body font-medium text-foreground">
            Weight
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          {trend < -0.5 ? (
            <TrendingDown className="size-3.5 text-secondary" />
          ) : trend > 0.5 ? (
            <TrendingUp className="size-3.5 text-accent" />
          ) : null}
          <span className="text-xs text-muted-foreground font-body">
            {entries[entries.length - 1].weight} kg
          </span>
        </div>
      </div>

      {/* SVG sparkline */}
      <svg
        viewBox={`0 0 100 ${chartH}`}
        preserveAspectRatio="none"
        className="w-full h-20"
        role="img"
        aria-label="Weight trend chart showing recent measurements"
      >
        <title>Weight trend</title>
        <defs>
          <linearGradient id="wgrad" x1="0" y1="0" x2="0" y2="1">
            <stop
              offset="0%"
              stopColor="oklch(var(--accent))"
              stopOpacity="0.3"
            />
            <stop
              offset="100%"
              stopColor="oklch(var(--accent))"
              stopOpacity="0"
            />
          </linearGradient>
        </defs>
        {entries.length > 1 && (
          <polygon
            points={`0,${chartH} ${pts.join(" ")} 100,${chartH}`}
            fill="url(#wgrad)"
          />
        )}
        <polyline
          points={pts.join(" ")}
          fill="none"
          stroke="oklch(var(--accent))"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {entries.map((e, i) => {
          const [x, y] = pts[i].split(",").map(Number);
          return (
            <circle
              key={e.date}
              cx={x}
              cy={y}
              r="2.5"
              fill="oklch(var(--accent))"
            />
          );
        })}
      </svg>

      {/* Recent entries list */}
      <div className="space-y-1 border-t border-border pt-3">
        {entries
          .slice(-5)
          .reverse()
          .map((e, i) => (
            <div
              key={e.date}
              className="flex items-center justify-between text-sm"
              data-ocid={`progress.weight_item.${i + 1}`}
            >
              <span className="text-muted-foreground font-body text-xs">
                {formatShortDate(e.date)}
              </span>
              <span className="font-display text-foreground text-sm">
                {e.weight} kg
              </span>
            </div>
          ))}
      </div>
    </div>
  );
}

// ─── Cycle Timeline ──────────────────────────────────────────────────────────

function CycleTimeline({
  cycleHistory,
  isLoading,
  periodDurationDays,
}: {
  cycleHistory: CycleEntry[] | undefined;
  isLoading: boolean;
  periodDurationDays?: number;
}) {
  if (isLoading) {
    return <Skeleton className="h-40 w-full rounded-2xl" />;
  }

  if (!cycleHistory || cycleHistory.length === 0) {
    return (
      <EmptyState
        icon={<span className="text-3xl">🌙</span>}
        message="No cycle data yet. Complete onboarding to track your cycle phases."
        ocid="progress.cycle.empty_state"
      />
    );
  }

  // Use the most recent cycle entry
  const latest = cycleHistory.reduce((a, b) =>
    a.startDate > b.startDate ? a : b,
  );
  const cycleStartMs = Number(latest.startDate / 1_000_000n);
  const cycleLengthDays = Number(latest.lengthDays);

  // Build 3-month window: previous month, current month, next month
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth();

  const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
  const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear;
  const nextMonth = currentMonth === 11 ? 0 : currentMonth + 1;
  const nextYear = currentMonth === 11 ? currentYear + 1 : currentYear;

  const monthsToShow = [
    { year: prevYear, month: prevMonth },
    { year: currentYear, month: currentMonth },
    { year: nextYear, month: nextMonth },
  ];

  // Determine the date range we need phase data for
  const rangeStart = new Date(prevYear, prevMonth, 1);
  const rangeEnd = new Date(nextYear, nextMonth + 1, 0);

  // Build a Set of tracked date strings for quick lookup
  const trackedDates = new Set<string>();
  const phaseByDate = new Map<string, string>();
  const totalDays =
    Math.floor((rangeEnd.getTime() - rangeStart.getTime()) / 86_400_000) + 1;
  for (let i = 0; i < totalDays; i++) {
    const d = new Date(rangeStart);
    d.setDate(d.getDate() + i);
    const key = d.toISOString().split("T")[0];
    trackedDates.add(key);
    phaseByDate.set(
      key,
      calcPhaseForDay(cycleStartMs, cycleLengthDays, d, periodDurationDays),
    );
  }

  // Phase stats across the displayed date range
  const phases = ["menstrual", "follicular", "ovulatory", "luteal"];
  const phaseCounts = phases.reduce<Record<string, number>>((acc, p) => {
    acc[p] = 0;
    return acc;
  }, {});
  for (const phase of phaseByDate.values()) {
    phaseCounts[phase] = (phaseCounts[phase] ?? 0) + 1;
  }

  const calendarMonths = monthsToShow;

  // Day-of-week labels (Sun–Sat)
  const DOW_LABELS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

  const todayStr = today.toISOString().split("T")[0];

  return (
    <div className="space-y-4" data-ocid="progress.cycle_section">
      {calendarMonths.map(({ year, month }) => {
        const monthName = new Date(year, month, 1).toLocaleDateString("en-US", {
          month: "long",
          year: "numeric",
        });

        const isNextMonth = year === nextYear && month === nextMonth;

        // First day of month (0=Sun)
        const firstDow = new Date(year, month, 1).getDay();
        // Total days in month
        const daysInMonth = new Date(year, month + 1, 0).getDate();

        // Build cell array: leading empty slots + day cells
        const cells: {
          type: "empty" | "day";
          key: string;
          day?: number;
          dateStr?: string;
          phase?: string;
          isToday?: boolean;
          isTracked?: boolean;
        }[] = [];
        // Give every cell a stable key at construction time
        for (let e = 0; e < firstDow; e++) {
          cells.push({ type: "empty", key: `${year}-${month}-pad-${e}` });
        }
        for (let d = 1; d <= daysInMonth; d++) {
          const ds = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
          const isTracked = trackedDates.has(ds);
          const phase = isTracked ? phaseByDate.get(ds) : undefined;
          cells.push({
            type: "day",
            key: ds,
            day: d,
            dateStr: ds,
            phase,
            isToday: ds === todayStr,
            isTracked,
          });
        }

        return (
          <div
            key={`${year}-${month}`}
            className="rounded-2xl bg-card border border-border shadow-warm p-4 space-y-3"
          >
            {/* Month heading */}
            <div className="flex items-center gap-2">
              <span className="text-base">🌸</span>
              <span className="font-display text-sm font-semibold text-foreground">
                {monthName}
              </span>
              {isNextMonth && (
                <Badge
                  variant="outline"
                  className="text-[10px] font-body rounded-full px-2 py-0.5 border-primary/30 text-primary bg-primary/8"
                >
                  Predicted
                </Badge>
              )}
            </div>

            {/* Day-of-week header */}
            <div className="grid grid-cols-7 gap-1">
              {DOW_LABELS.map((dow) => (
                <div
                  key={dow}
                  className="text-[10px] font-body font-semibold text-muted-foreground/70 text-center uppercase tracking-wide"
                >
                  {dow}
                </div>
              ))}
            </div>

            {/* Calendar grid — flat 7-col, stable keys built at cell construction */}
            <div className="grid grid-cols-7 gap-1">
              {cells.map((cell) => {
                if (cell.type === "empty") {
                  return <div key={cell.key} className="aspect-square" />;
                }
                return (
                  <div
                    key={cell.dateStr}
                    title={
                      cell.isTracked && cell.phase
                        ? `${new Date(cell.dateStr!).toLocaleDateString("en-US", { month: "short", day: "numeric" })} — ${CYCLE_PHASE_LABELS[cell.phase]}`
                        : undefined
                    }
                    className={cn(
                      "aspect-square rounded-lg flex items-start justify-start p-1 transition-smooth relative",
                      cell.isTracked && cell.phase
                        ? PHASE_BG[cell.phase]
                        : "bg-muted/20",
                      cell.isToday && "ring-2 ring-foreground/50 ring-offset-1",
                    )}
                  >
                    <span
                      className={cn(
                        "text-[11px] font-body font-semibold leading-none",
                        cell.isTracked && cell.phase
                          ? "text-foreground/80"
                          : "text-muted-foreground/40",
                        cell.isToday && "text-foreground",
                      )}
                    >
                      {cell.day}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      {/* Phase legend + day counts */}
      <div className="rounded-2xl bg-card border border-border shadow-warm p-4 space-y-3">
        <div className="flex flex-wrap gap-2">
          {phases.map((phase) => (
            <Badge
              key={phase}
              variant="outline"
              className={cn(
                "text-[10px] font-body rounded-full px-2 py-0.5 border",
                CYCLE_PHASE_COLORS[phase],
                PHASE_BORDER[phase],
              )}
            >
              {CYCLE_PHASE_LABELS[phase]}: {phaseCounts[phase]}d
            </Badge>
          ))}
        </div>
        <div className="flex flex-wrap gap-3 pt-1 border-t border-border">
          {phases.map((phase) => (
            <div key={phase} className="flex items-center gap-1.5">
              <div
                className={cn(
                  "w-3 h-3 rounded-sm border",
                  PHASE_BG[phase],
                  PHASE_BORDER[phase],
                )}
              />
              <span className="text-[10px] text-muted-foreground font-body capitalize">
                {CYCLE_PHASE_LABELS[phase]}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function ProgressPage() {
  const { data: profile } = useOnboardingProfile();
  const periodDurationDays =
    profile && "periodDurationDays" in profile && profile.periodDurationDays
      ? Number(profile.periodDurationDays)
      : 5;

  const { data: cycleHistory, isLoading: cycleLoading } = useCycleHistory();

  // Fetch last 30 days of logs for streak + weight trend
  const logsResults = useMultiDayLogs(30);
  const logsLoading = logsResults.some((r) => r.isLoading);
  const logs = logsResults.map((r) => r.data);

  const todayLog = logs[0]; // index 0 = today

  return (
    <div className="px-4 py-6 space-y-6" data-ocid="progress.page">
      {/* Header */}
      <div>
        <h1 className="font-display text-2xl text-foreground">Your Progress</h1>
        <p className="text-sm text-muted-foreground font-body mt-0.5">
          Track your fitness journey, cycle, and wellness
        </p>
      </div>

      {/* Today's summary */}
      <section data-ocid="progress.today_section">
        <SectionTitle>Today's Summary</SectionTitle>
        {logsLoading ? (
          <div
            className="grid grid-cols-3 gap-3"
            data-ocid="progress.today.loading_state"
          >
            <Skeleton className="h-20 rounded-2xl" />
            <Skeleton className="h-20 rounded-2xl" />
            <Skeleton className="h-20 rounded-2xl" />
          </div>
        ) : (
          <TodaySummary log={todayLog} />
        )}
      </section>

      {/* Workout streak */}
      <section data-ocid="progress.streak_section">
        <SectionTitle>Workout Streak 🔥</SectionTitle>
        <StreakBadge logs={logs} isLoading={logsLoading} />
      </section>

      {/* Weight trend */}
      <section data-ocid="progress.weight_log_section">
        <SectionTitle>Weight Trend</SectionTitle>
        <WeightLog logs={logs} isLoading={logsLoading} />
      </section>

      {/* Cycle history */}
      <section data-ocid="progress.cycle_history_section">
        <SectionTitle>Cycle History</SectionTitle>
        <CycleTimeline
          cycleHistory={cycleHistory}
          isLoading={cycleLoading}
          periodDurationDays={periodDurationDays}
        />
      </section>

      {/* Branding */}
      <footer className="pt-2 pb-1 text-center md:hidden">
        <p className="text-[10px] text-muted-foreground/50">
          © {new Date().getFullYear()}. Built with love using{" "}
          <a
            href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(typeof window !== "undefined" ? window.location.hostname : "")}`}
            className="underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            caffeine.ai
          </a>
        </p>
      </footer>
    </div>
  );
}
