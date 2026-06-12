import type { Exercise, WorkoutTemplate } from "@/types";
import { X } from "lucide-react";
import { useEffect, useRef } from "react";

// ─── Stick Figure Animations ───────────────────────────────────────────────

function SquatFigure() {
  return (
    <svg
      viewBox="0 0 80 100"
      className="w-16 h-20"
      role="img"
      aria-label="Squat animation"
    >
      <title>Squat animation</title>
      {/* Head */}
      <circle cx="40" cy="12" r="9" className="fill-primary/80" />
      {/* Body */}
      <rect
        cx="40"
        x="36"
        y="21"
        width="8"
        height="22"
        rx="4"
        className="fill-primary/70 origin-top"
        style={{ transformBox: "fill-box" }}
      />
      {/* Arms */}
      <line
        x1="36"
        y1="26"
        x2="20"
        y2="38"
        stroke="var(--color-primary)"
        strokeWidth="3"
        strokeLinecap="round"
        className="origin-top-right"
        style={{ opacity: 0.75 }}
      />
      <line
        x1="44"
        y1="26"
        x2="60"
        y2="38"
        stroke="var(--color-primary)"
        strokeWidth="3"
        strokeLinecap="round"
        style={{ opacity: 0.75 }}
      />
      {/* Legs */}
      <g className="animate-squat" style={{ transformOrigin: "40px 43px" }}>
        <line
          x1="40"
          y1="43"
          x2="28"
          y2="62"
          stroke="var(--color-primary)"
          strokeWidth="3.5"
          strokeLinecap="round"
          style={{ opacity: 0.85 }}
        />
        <line
          x1="40"
          y1="43"
          x2="52"
          y2="62"
          stroke="var(--color-primary)"
          strokeWidth="3.5"
          strokeLinecap="round"
          style={{ opacity: 0.85 }}
        />
        {/* Lower legs */}
        <line
          x1="28"
          y1="62"
          x2="22"
          y2="82"
          stroke="var(--color-primary)"
          strokeWidth="3"
          strokeLinecap="round"
          style={{ opacity: 0.7 }}
        />
        <line
          x1="52"
          y1="62"
          x2="58"
          y2="82"
          stroke="var(--color-primary)"
          strokeWidth="3"
          strokeLinecap="round"
          style={{ opacity: 0.7 }}
        />
      </g>
    </svg>
  );
}

function PlankFigure() {
  return (
    <svg
      viewBox="0 0 120 60"
      className="w-24 h-12"
      role="img"
      aria-label="Plank animation"
    >
      <title>Plank animation</title>
      <g className="animate-plank">
        {/* Head */}
        <circle cx="15" cy="20" r="8" className="fill-primary/80" />
        {/* Body - horizontal */}
        <rect
          x="22"
          y="22"
          width="55"
          height="7"
          rx="3.5"
          className="fill-primary/70"
        />
        {/* Arms - supporting */}
        <rect
          x="26"
          y="29"
          width="5"
          height="18"
          rx="2.5"
          className="fill-primary/75"
        />
        <rect
          x="46"
          y="29"
          width="5"
          height="18"
          rx="2.5"
          className="fill-primary/75"
        />
        {/* Legs */}
        <rect
          x="72"
          y="26"
          width="30"
          height="6"
          rx="3"
          className="fill-primary/70"
        />
        {/* Feet */}
        <rect
          x="100"
          y="28"
          width="10"
          height="5"
          rx="2.5"
          className="fill-primary/65"
        />
      </g>
    </svg>
  );
}

function LungeFigure() {
  return (
    <svg
      viewBox="0 0 90 110"
      className="w-16 h-20"
      role="img"
      aria-label="Lunge animation"
    >
      <title>Lunge animation</title>
      {/* Head */}
      <circle cx="45" cy="12" r="9" className="fill-primary/80" />
      {/* Body */}
      <rect
        x="41"
        y="21"
        width="8"
        height="22"
        rx="4"
        className="fill-primary/70"
      />
      {/* Arms */}
      <line
        x1="41"
        y1="28"
        x2="22"
        y2="40"
        stroke="var(--color-primary)"
        strokeWidth="3"
        strokeLinecap="round"
        style={{ opacity: 0.75 }}
      />
      <line
        x1="49"
        y1="28"
        x2="68"
        y2="40"
        stroke="var(--color-primary)"
        strokeWidth="3"
        strokeLinecap="round"
        style={{ opacity: 0.75 }}
      />
      {/* Lunge legs */}
      <g className="animate-lunge">
        {/* Front leg bent */}
        <line
          x1="45"
          y1="43"
          x2="22"
          y2="68"
          stroke="var(--color-primary)"
          strokeWidth="3.5"
          strokeLinecap="round"
          style={{ opacity: 0.85 }}
        />
        <line
          x1="22"
          y1="68"
          x2="18"
          y2="94"
          stroke="var(--color-primary)"
          strokeWidth="3"
          strokeLinecap="round"
          style={{ opacity: 0.7 }}
        />
        {/* Back leg extended */}
        <line
          x1="45"
          y1="43"
          x2="68"
          y2="60"
          stroke="var(--color-primary)"
          strokeWidth="3.5"
          strokeLinecap="round"
          style={{ opacity: 0.85 }}
        />
        <line
          x1="68"
          y1="60"
          x2="72"
          y2="90"
          stroke="var(--color-primary)"
          strokeWidth="3"
          strokeLinecap="round"
          style={{ opacity: 0.7 }}
        />
      </g>
    </svg>
  );
}

function JumpingJackFigure() {
  return (
    <svg
      viewBox="0 0 100 110"
      className="w-16 h-20"
      role="img"
      aria-label="Jumping jack animation"
    >
      <title>Jumping jack animation</title>
      {/* Head */}
      <circle cx="50" cy="12" r="9" className="fill-primary/80" />
      {/* Body */}
      <rect
        x="46"
        y="21"
        width="8"
        height="22"
        rx="4"
        className="fill-primary/70"
      />
      {/* Arms - spread */}
      <g className="animate-jumping-jack-arms">
        <line
          x1="46"
          y1="26"
          x2="14"
          y2="46"
          stroke="var(--color-primary)"
          strokeWidth="3"
          strokeLinecap="round"
          style={{ opacity: 0.8 }}
        />
        <line
          x1="54"
          y1="26"
          x2="86"
          y2="46"
          stroke="var(--color-primary)"
          strokeWidth="3"
          strokeLinecap="round"
          style={{ opacity: 0.8 }}
        />
      </g>
      {/* Legs - spread */}
      <g className="animate-jumping-jack-legs">
        <line
          x1="50"
          y1="43"
          x2="20"
          y2="80"
          stroke="var(--color-primary)"
          strokeWidth="3.5"
          strokeLinecap="round"
          style={{ opacity: 0.85 }}
        />
        <line
          x1="50"
          y1="43"
          x2="80"
          y2="80"
          stroke="var(--color-primary)"
          strokeWidth="3.5"
          strokeLinecap="round"
          style={{ opacity: 0.85 }}
        />
      </g>
    </svg>
  );
}

function PushUpFigure() {
  return (
    <svg
      viewBox="0 0 130 70"
      className="w-28 h-14"
      role="img"
      aria-label="Push-up animation"
    >
      <title>Push-up animation</title>
      <g className="animate-pushup">
        {/* Head */}
        <circle cx="15" cy="18" r="8" className="fill-primary/80" />
        {/* Body */}
        <rect
          x="22"
          y="18"
          width="55"
          height="7"
          rx="3.5"
          className="fill-primary/70"
        />
        {/* Arms - bent pushing up */}
        <line
          x1="30"
          y1="25"
          x2="28"
          y2="44"
          stroke="var(--color-primary)"
          strokeWidth="3.5"
          strokeLinecap="round"
          style={{ opacity: 0.8 }}
        />
        <line
          x1="28"
          y1="44"
          x2="26"
          y2="44"
          stroke="var(--color-primary)"
          strokeWidth="4"
          strokeLinecap="round"
          style={{ opacity: 0.7 }}
        />
        <line
          x1="52"
          y1="25"
          x2="50"
          y2="44"
          stroke="var(--color-primary)"
          strokeWidth="3.5"
          strokeLinecap="round"
          style={{ opacity: 0.8 }}
        />
        <line
          x1="50"
          y1="44"
          x2="48"
          y2="44"
          stroke="var(--color-primary)"
          strokeWidth="4"
          strokeLinecap="round"
          style={{ opacity: 0.7 }}
        />
        {/* Legs - extended */}
        <rect
          x="75"
          y="21"
          width="42"
          height="6"
          rx="3"
          className="fill-primary/70"
        />
        <rect
          x="114"
          y="23"
          width="10"
          height="5"
          rx="2.5"
          className="fill-primary/65"
        />
      </g>
    </svg>
  );
}

function StretchFigure() {
  return (
    <svg
      viewBox="0 0 90 110"
      className="w-16 h-20"
      role="img"
      aria-label="Stretch animation"
    >
      <title>Stretch animation</title>
      <g className="animate-stretch">
        {/* Head */}
        <circle cx="45" cy="12" r="9" className="fill-primary/80" />
        {/* Body - slight lean */}
        <rect
          x="41"
          y="21"
          width="8"
          height="24"
          rx="4"
          className="fill-primary/70"
        />
        {/* Arms stretched overhead */}
        <line
          x1="41"
          y1="24"
          x2="18"
          y2="8"
          stroke="var(--color-primary)"
          strokeWidth="3"
          strokeLinecap="round"
          style={{ opacity: 0.8 }}
        />
        <line
          x1="49"
          y1="24"
          x2="72"
          y2="8"
          stroke="var(--color-primary)"
          strokeWidth="3"
          strokeLinecap="round"
          style={{ opacity: 0.8 }}
        />
        {/* Legs */}
        <line
          x1="45"
          y1="45"
          x2="32"
          y2="72"
          stroke="var(--color-primary)"
          strokeWidth="3.5"
          strokeLinecap="round"
          style={{ opacity: 0.85 }}
        />
        <line
          x1="45"
          y1="45"
          x2="58"
          y2="72"
          stroke="var(--color-primary)"
          strokeWidth="3.5"
          strokeLinecap="round"
          style={{ opacity: 0.85 }}
        />
        <line
          x1="32"
          y1="72"
          x2="28"
          y2="96"
          stroke="var(--color-primary)"
          strokeWidth="3"
          strokeLinecap="round"
          style={{ opacity: 0.7 }}
        />
        <line
          x1="58"
          y1="72"
          x2="62"
          y2="96"
          stroke="var(--color-primary)"
          strokeWidth="3"
          strokeLinecap="round"
          style={{ opacity: 0.7 }}
        />
      </g>
    </svg>
  );
}

function DefaultFigure() {
  return (
    <svg
      viewBox="0 0 80 110"
      className="w-14 h-20"
      role="img"
      aria-label="Exercise animation"
    >
      <title>Exercise animation</title>
      <g className="animate-stretch">
        <circle cx="40" cy="12" r="9" className="fill-primary/80" />
        <rect
          x="36"
          y="21"
          width="8"
          height="22"
          rx="4"
          className="fill-primary/70"
        />
        <line
          x1="36"
          y1="28"
          x2="18"
          y2="42"
          stroke="var(--color-primary)"
          strokeWidth="3"
          strokeLinecap="round"
          style={{ opacity: 0.75 }}
        />
        <line
          x1="44"
          y1="28"
          x2="62"
          y2="42"
          stroke="var(--color-primary)"
          strokeWidth="3"
          strokeLinecap="round"
          style={{ opacity: 0.75 }}
        />
        <line
          x1="40"
          y1="43"
          x2="28"
          y2="70"
          stroke="var(--color-primary)"
          strokeWidth="3.5"
          strokeLinecap="round"
          style={{ opacity: 0.85 }}
        />
        <line
          x1="40"
          y1="43"
          x2="52"
          y2="70"
          stroke="var(--color-primary)"
          strokeWidth="3.5"
          strokeLinecap="round"
          style={{ opacity: 0.85 }}
        />
        <line
          x1="28"
          y1="70"
          x2="24"
          y2="94"
          stroke="var(--color-primary)"
          strokeWidth="3"
          strokeLinecap="round"
          style={{ opacity: 0.7 }}
        />
        <line
          x1="52"
          y1="70"
          x2="56"
          y2="94"
          stroke="var(--color-primary)"
          strokeWidth="3"
          strokeLinecap="round"
          style={{ opacity: 0.7 }}
        />
      </g>
    </svg>
  );
}

// Map exercise name keywords → animation component
function getExerciseFigure(name: string): React.ReactNode {
  const lower = name.toLowerCase();
  if (lower.includes("squat")) return <SquatFigure />;
  if (lower.includes("plank")) return <PlankFigure />;
  if (lower.includes("lunge")) return <LungeFigure />;
  if (lower.includes("jumping") || lower.includes("jack"))
    return <JumpingJackFigure />;
  if (lower.includes("push")) return <PushUpFigure />;
  if (
    lower.includes("stretch") ||
    lower.includes("cobra") ||
    lower.includes("cat") ||
    lower.includes("pigeon")
  )
    return <StretchFigure />;
  return <DefaultFigure />;
}

// ─── Exercise Animation Card ──────────────────────────────────────────────

function ExerciseAnimCard({
  exercise,
  index,
}: { exercise: Exercise; index: number }) {
  return (
    <div
      className="rounded-2xl bg-card border border-border shadow-warm p-4 flex items-center gap-4"
      data-ocid={`exercise_panel.exercise.${index + 1}`}
      style={{ animationDelay: `${index * 0.06}s` }}
    >
      {/* Animation figure */}
      <div className="shrink-0 flex items-center justify-center bg-primary/5 rounded-xl p-3 min-w-[72px] min-h-[72px]">
        {getExerciseFigure(exercise.name)}
      </div>

      {/* Info */}
      <div className="min-w-0 flex-1">
        <p className="font-display text-sm text-foreground font-semibold leading-snug">
          {exercise.name}
        </p>
        <p className="text-xs text-primary font-body font-medium mt-0.5">
          {exercise.sets.toString()} sets × {exercise.reps}
        </p>
        {exercise.notes && (
          <p className="text-xs text-muted-foreground font-body mt-1 leading-relaxed">
            {exercise.notes}
          </p>
        )}
      </div>
    </div>
  );
}

// ─── Panel ────────────────────────────────────────────────────────────────

interface ExerciseAnimationPanelProps {
  workout: WorkoutTemplate | null;
  open: boolean;
  onClose: () => void;
}

export function ExerciseAnimationPanel({
  workout,
  open,
  onClose,
}: ExerciseAnimationPanelProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  // Lock body scroll when panel is open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  // Close on Escape key
  useEffect(() => {
    if (!open) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [open, onClose]);

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-foreground/40 backdrop-blur-sm transition-opacity duration-300"
        style={{
          opacity: open ? 1 : 0,
          pointerEvents: open ? "auto" : "none",
        }}
        onClick={onClose}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " " || e.key === "Escape")
            onClose();
        }}
        aria-hidden="true"
        data-ocid="exercise_panel.backdrop"
      />

      {/* Slide-up panel */}
      <dialog
        ref={dialogRef}
        open={open}
        aria-label={workout?.title ?? "Exercise details"}
        className="fixed bottom-0 left-1/2 z-50 w-full max-w-[480px] -translate-x-1/2 transition-transform duration-400 ease-out bg-transparent border-0 p-0 m-0"
        style={{
          transform: open
            ? "translateX(-50%) translateY(0%)"
            : "translateX(-50%) translateY(100%)",
          maxWidth: "480px",
        }}
        data-ocid="exercise_panel.dialog"
      >
        <div
          className="rounded-t-3xl bg-background border-t border-x border-border shadow-warm-md flex flex-col"
          style={{ maxHeight: "85dvh" }}
        >
          {/* Drag handle */}
          <div className="flex justify-center pt-3 pb-1 shrink-0">
            <div className="w-10 h-1 rounded-full bg-border" />
          </div>

          {/* Header */}
          <div className="flex items-start justify-between gap-3 px-5 pt-2 pb-4 border-b border-border/60 shrink-0">
            <div>
              <h2 className="font-display text-lg text-foreground leading-tight">
                {workout?.title ?? "Workout"}
              </h2>
              {workout && (
                <p className="text-xs text-muted-foreground font-body mt-0.5">
                  {workout.durationMin.toString()} min ·{" "}
                  {workout.exercises.length} exercises
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-full bg-muted/60 hover:bg-muted p-2 text-muted-foreground hover:text-foreground transition-colors duration-200 mt-0.5 shrink-0"
              aria-label="Close panel"
              data-ocid="exercise_panel.close_button"
            >
              <X className="size-4" />
            </button>
          </div>

          {/* Exercise list — scrollable */}
          <div className="overflow-y-auto px-4 py-4 space-y-3 pb-safe">
            {workout?.exercises.map((exercise, idx) => (
              <ExerciseAnimCard
                key={`${exercise.name}-${idx}`}
                exercise={exercise}
                index={idx}
              />
            ))}
          </div>
        </div>
      </dialog>
    </>
  );
}
