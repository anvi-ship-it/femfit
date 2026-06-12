import { Outlet, useLocation } from "@tanstack/react-router";
import BottomNav from "./BottomNav";

export default function Layout() {
  const location = useLocation();
  const isOnboarding = location.pathname === "/onboarding";

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Top header bar */}
      {!isOnboarding && (
        <header className="sticky top-0 z-40 bg-card border-b border-border shadow-warm">
          <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
            <span className="font-display text-xl text-primary tracking-tight">
              FemmeFlow
            </span>
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="text-primary text-xs font-semibold">✦</span>
            </div>
          </div>
        </header>
      )}

      {/* Main content */}
      <main className="flex-1 max-w-2xl mx-auto w-full pb-20">
        <Outlet />
      </main>

      {/* Bottom navigation */}
      {!isOnboarding && (
        <div className="fixed bottom-0 left-0 right-0 z-40">
          <BottomNav />
        </div>
      )}

      {/* Branding footer (above bottom nav) */}
      {!isOnboarding && (
        <footer className="fixed bottom-[calc(4rem+env(safe-area-inset-bottom))] left-0 right-0 pointer-events-none hidden md:flex justify-center">
          <p className="text-xs text-muted-foreground/50 px-4 py-1">
            © {new Date().getFullYear()}. Built with love using{" "}
            <a
              href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(typeof window !== "undefined" ? window.location.hostname : "")}`}
              className="underline hover:text-muted-foreground pointer-events-auto transition-colors"
              target="_blank"
              rel="noopener noreferrer"
            >
              caffeine.ai
            </a>
          </p>
        </footer>
      )}
    </div>
  );
}
