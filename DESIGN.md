# Design Brief

## Direction
Warm Wellness — a light, warm, female-centric fitness and nutrition platform with refined minimalism and cycle-phase awareness woven into the visual language.

## Tone
Spa-like calm with botanical undertones; refined, not cutesy. Deep rose primary paired with soft sage secondary creates a sophisticated, female-forward aesthetic grounded in warmth.

## Differentiation
Subtle color depth and warm shadows create an inviting, layered experience. No gradients, no decorative noise — just intentional tonal shifts that guide the eye through content zones and reflect the wellness journey.

## Color Palette

| Token          | OKLCH          | Role                                      |
| -------------- | -------------- | ----------------------------------------- |
| background     | 0.98 0.008 70  | Warm off-white, inviting base             |
| foreground     | 0.18 0.015 20  | Deep warm text, highest contrast          |
| card           | 1.0 0.004 70   | Pure white lift, subtle shadow depth      |
| primary        | 0.48 0.14 10   | Deep rose/mauve, cycle tracking, CTAs     |
| secondary      | 0.58 0.12 155  | Muted sage, nutrition & growth actions    |
| accent         | 0.65 0.12 40   | Warm peach, calls-to-action emphasis      |
| muted          | 0.92 0.01 70   | Disabled states, secondary text           |
| destructive    | 0.52 0.18 25   | Warm terra-red for alerts                 |

## Typography
- Display: Fraunces — elegant serif for headings, phase indicators, and hero text
- Body: Figtree — refined sans-serif for content clarity, labels, and UI text
- Mono: JetBrains Mono — code/data display
- Scale: hero `text-5xl font-bold`, h2 `text-3xl font-semibold`, labels `text-sm font-medium tracking-widest`, body `text-base`

## Elevation & Depth
Warm, soft shadows (`shadow-warm`, `shadow-warm-md`) create subtle depth without drama. Cards lift with minimal shadow; no drop shadows or glows.

## Structural Zones

| Zone    | Background       | Border                | Notes                                    |
| ------- | ---------------- | --------------------- | ---------------------------------------- |
| Header  | `bg-card`        | `border-b border-border` | Tab navigation, icon-based               |
| Content | `bg-background`  | —                     | Alternates with `bg-card` every section  |
| Card    | `bg-card`        | `border border-border` | `shadow-warm`, `rounded-lg`              |
| Footer  | `bg-muted/20`    | `border-t border-border` | Navigation or subscription info          |

## Spacing & Rhythm
Spacious grid (6–8px base unit). Content sections separated by 2–3 units (`px-6 py-8`). Cards maintain consistent padding and breathing room for a refined, unhurried feel.

## Component Patterns
- Buttons: Primary (rose), secondary (sage), accent (peach) with soft warm shadows on hover; rounded-lg
- Cards: White card background with minimal border and warm shadow; section headers in Fraunces
- Badges: Muted background with foreground text; small rounded-md
- Tabs: Icon + label, active state bold with rose underline

## Motion
- Entrance: Fade + subtle scale (0.95 → 1.0) over 200ms for cards and sections
- Hover: Color shift on buttons/links, shadow elevation on interactive cards
- Transition default: `transition-smooth` (0.3s ease)

## Constraints
- No full-page gradients
- No glow or neon shadows
- Warm tones throughout; no cool or saturated accents
- Mobile-first responsive: `sm:`, `md:`, `lg:` breakpoints
- Icon-based navigation for space efficiency

## Signature Detail
Cycle-phase color hints in progress cards — subtle rose-to-sage transitions reflect the wellness journey without explicit messaging.
