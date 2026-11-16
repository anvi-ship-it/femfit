import { Outlet, useLocation } from "@tanstack/react-router";
import { useAuth } from "../lib/supabase";
import BottomNav from "./BottomNav";
import { Button } from "./ui/button";

export default function Layout() {
  const location = useLocation();
  const { session, signOut } = useAuth();
  const isOnboarding = location.pathname === "/onboarding";
  return <div className="flex min-h-screen flex-col bg-background">
    {!isOnboarding && <header className="sticky top-0 z-40 border-b border-border bg-card shadow-warm"><div className="mx-auto flex h-14 max-w-2xl items-center justify-between px-4"><span className="font-display text-xl tracking-tight text-primary">FemFit</span><div className="flex items-center gap-2"><span className="hidden max-w-36 truncate text-xs text-muted-foreground sm:inline">{session?.user.email ?? session?.user.phone ?? ""}</span><Button variant="ghost" size="sm" onClick={() => void signOut()} aria-label="Sign out">Sign out</Button></div></div></header>}
    <main className="mx-auto w-full max-w-2xl flex-1 pb-20"><Outlet/></main>
    {!isOnboarding && <div className="fixed bottom-0 left-0 right-0 z-40"><BottomNav/></div>}
    {!isOnboarding && <footer className="pointer-events-none fixed bottom-[calc(4rem+env(safe-area-inset-bottom))] left-0 right-0 hidden justify-center md:flex"><p className="px-4 py-1 text-xs text-muted-foreground/50">© {new Date().getFullYear()} FemFit</p></footer>}
  </div>;
}
