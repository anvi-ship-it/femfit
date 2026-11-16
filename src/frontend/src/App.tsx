import { Skeleton } from "@/components/ui/skeleton";
import { Toaster } from "@/components/ui/sonner";
import { isProfileComplete } from "./lib/local-auth";
import { useAuth } from "./lib/supabase";
import { RouterProvider, createRootRoute, createRoute, createRouter, redirect, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import Layout from "./components/Layout";
import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import OnboardingPage from "./pages/OnboardingPage";
import PlansPage from "./pages/PlansPage";
import ProfilePage from "./pages/ProfilePage";
import ProfileSetupPage from "./pages/ProfileSetupPage";
import ProgressPage from "./pages/ProgressPage";
import SubscriptionPage from "./pages/SubscriptionPage";

function AuthLayout() {
  const { session, isInitializing } = useAuth();
  const navigate = useNavigate();
  useEffect(() => { if (!isInitializing && !session) navigate({ to: "/login" }); }, [session, isInitializing, navigate]);
  if (isInitializing) return <div className="flex min-h-screen items-center justify-center bg-background"><div className="w-48 space-y-3"><Skeleton className="h-4 w-full"/><Skeleton className="h-4 w-3/4"/><Skeleton className="h-4 w-1/2"/></div></div>;
  if (!session) return null;
  return <Layout />;
}
const rootRoute = createRootRoute();
const loginRoute = createRoute({ getParentRoute: () => rootRoute, path: "/login", component: LoginPage });
const profileSetupRoute = createRoute({ getParentRoute: () => rootRoute, path: "/profile-setup", component: ProfileSetupPage });
const authRoute = createRoute({ getParentRoute: () => rootRoute, id: "_auth", component: AuthLayout });
const indexRoute = createRoute({ getParentRoute: () => authRoute, path: "/", beforeLoad: () => { throw redirect({ to: "/home" }); }, component: () => null });
const homeRoute = createRoute({ getParentRoute: () => authRoute, path: "/home", component: HomePage });
const plansRoute = createRoute({ getParentRoute: () => authRoute, path: "/plans", component: PlansPage });
const progressRoute = createRoute({ getParentRoute: () => authRoute, path: "/progress", component: ProgressPage });
const profileRoute = createRoute({ getParentRoute: () => authRoute, path: "/profile", component: ProfilePage });
const subscriptionRoute = createRoute({ getParentRoute: () => authRoute, path: "/subscription", component: SubscriptionPage });
const onboardingRoute = createRoute({ getParentRoute: () => authRoute, path: "/onboarding", component: OnboardingPage });
const routeTree = rootRoute.addChildren([loginRoute, profileSetupRoute, authRoute.addChildren([indexRoute, homeRoute, plansRoute, progressRoute, profileRoute, subscriptionRoute, onboardingRoute])]);
const router = createRouter({ routeTree });
declare module "@tanstack/react-router" { interface Register { router: typeof router; } }
export default function App() { return <><RouterProvider router={router}/><Toaster position="top-center" richColors/></>; }
