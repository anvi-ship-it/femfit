# Women's Fitness & Nutrition Platform

A subscription-based women's fitness and nutrition platform delivering personalized workout and meal plan templates tailored to each user's body metrics, fitness goals, and menstrual cycle phase.

## Stack

- **Backend**: Motoko canister running on ICP (Internet Computer Protocol), managed via [`mops`](https://mops.one). Entry point: `src/backend/main.mo`
- **Frontend**: React 19 + Vite + TypeScript + TailwindCSS + Radix UI. Entry point: `src/frontend/src/main.tsx`
- **Package manager**: `pnpm` (workspaces at `src/**/*`)
- **Backend packages**: `mops` (Motoko package manager), config in `mops.toml`
- **ICP SDK**: `@dfinity/*` packages for canister calls from the frontend

## Key Features

- Guided onboarding (age, weight, height, fitness level, goals, dietary preferences)
- Menstrual cycle tracking with auto phase calculation
- Daily dashboard: cycle phase, workout templates, meal plan templates
- Water intake tracking and workout/meal completion logging
- Profile editing with instant plan refresh
- Stripe-powered subscriptions (7-day trial, weekly/monthly/premium tiers)

## Project Structure

```
src/
  backend/          # Motoko canister
    main.mo         # Canister entry point
    lib/            # Backend library modules
    mixins/         # Reusable Motoko mixins
    types/          # Shared type definitions
    system-idl/     # ICP system interfaces
    dist/           # Compiled output (generated)
  frontend/
    src/
      App.tsx       # Root component
      main.tsx      # Entry point
      pages/        # Route-level pages
      components/   # Reusable UI components
      hooks/        # Custom React hooks
      lib/          # Utilities
      types/        # TypeScript types
      backend.ts    # Auto-generated canister bindings
      backend.d.ts  # Type declarations for canister
      declarations/ # Candid-generated types
      mocks/        # Mock data for local development
    vite.config.js
    tailwind.config.js
    env.json        # Environment config (canister IDs etc.)
```

## Design System

See `DESIGN.md` for the full design brief. Summary:
- **Colors**: Deep rose primary, muted sage secondary, warm peach accent (OKLCH palette)
- **Typography**: Fraunces (display/headings), Figtree (body), JetBrains Mono (code)
- **Style**: Warm wellness — spa-like calm, botanical, female-forward, no gradients/glows

## Running Commands

**Frontend** (from `src/frontend/`):
- Install: `pnpm install --prefer-offline`
- Dev server: `pnpm dev`
- Build: `pnpm build`
- Typecheck: `pnpm typecheck`
- Lint fix: `pnpm fix`

**Backend** (from `src/backend/`):
- Install deps: `mops install`
- Typecheck: `mops check --fix`
- Build: `mops build`

**Root-level** (from project root):
- Build all: `pnpm build`
- Generate frontend bindings from backend: `pnpm bindgen`

## Environment & Secrets

- `SESSION_SECRET` — available in Replit secrets
- Stripe keys — needed for subscription features (not yet configured)
- ICP canister IDs — configured in `src/frontend/env.json`

## User Preferences

[No preferences yet]
