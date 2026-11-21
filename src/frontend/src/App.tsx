import { Skeleton } from "@/components/ui/skeleton";
import { Toaster } from "@/components/ui/sonner";
import {
  RouterProvider,
  createRootRoute,
  createRoute,
  createRouter,
  redirect,
  useNavigate,
} from "@tanstack/react-router";
import { type ReactNode, useEffect } from "react";
import Layout from "./components/Layout";
import { useAuthSession } from "./hooks/use-auth-session";
import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import OnboardingPage from "./pages/OnboardingPage";
import PlansPage from "./pages/PlansPage";
import ProfilePage from "./pages/ProfilePage";
import ProfileSetupPage from "./pages/ProfileSetupPage";
import ProgressPage from "./pages/ProgressPage";
import SubscriptionPage from "./pages/SubscriptionPage";

function SessionGate({ children }: { children: ReactNode }) {
  const { session, isLoading } = useAuthSession();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && !session?.authenticated) navigate({ to: "/login" });
  }, [isLoading, navigate, session?.authenticated]);

  if (isLoading) {
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

  return session?.authenticated ? <>{children}</> : null;
}

/** Wraps all protected routes — redirects to /login if not authenticated */
function AuthLayout() {
  return (
    <SessionGate>
      <Layout />
    </SessionGate>
  );
}

function ProtectedProfileSetup() {
  return (
    <SessionGate>
      <ProfileSetupPage />
    </SessionGate>
  );
}

const rootRoute = createRootRoute();

// ─── Public routes ────────────────────────────────────────────────────────────

const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/login",
  component: LoginPage,
});

const profileSetupRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/profile-setup",
  component: ProtectedProfileSetup,
});

// ─── Protected routes ─────────────────────────────────────────────────────────

const authLayoutRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: "_auth",
  component: AuthLayout,
});

const indexRoute = createRoute({
  getParentRoute: () => authLayoutRoute,
  path: "/",
  beforeLoad: () => {
    throw redirect({ to: "/home" });
  },
  component: () => null,
});

const homeRoute = createRoute({
  getParentRoute: () => authLayoutRoute,
  path: "/home",
  component: HomePage,
});

const plansRoute = createRoute({
  getParentRoute: () => authLayoutRoute,
  path: "/plans",
  component: PlansPage,
});

const progressRoute = createRoute({
  getParentRoute: () => authLayoutRoute,
  path: "/progress",
  component: ProgressPage,
});

const profileRoute = createRoute({
  getParentRoute: () => authLayoutRoute,
  path: "/profile",
  component: ProfilePage,
});

const subscriptionRoute = createRoute({
  getParentRoute: () => authLayoutRoute,
  path: "/subscription",
  component: SubscriptionPage,
});

const onboardingRoute = createRoute({
  getParentRoute: () => authLayoutRoute,
  path: "/onboarding",
  component: OnboardingPage,
});

const routeTree = rootRoute.addChildren([
  loginRoute,
  profileSetupRoute,
  authLayoutRoute.addChildren([
    indexRoute,
    homeRoute,
    plansRoute,
    progressRoute,
    profileRoute,
    subscriptionRoute,
    onboardingRoute,
  ]),
]);

const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

export default function App() {
  return (
    <>
      <RouterProvider router={router} />
      <Toaster position="top-center" richColors />
    </>
  );
}
