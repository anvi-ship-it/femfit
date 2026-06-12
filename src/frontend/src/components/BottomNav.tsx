import { cn } from "@/lib/utils";
import { Link, useLocation } from "@tanstack/react-router";
import { Crown, Dumbbell, Home, TrendingUp, User } from "lucide-react";

const navItems = [
  { to: "/home", label: "Home", icon: Home, ocid: "nav.home_link" },
  { to: "/plans", label: "Plans", icon: Dumbbell, ocid: "nav.plans_link" },
  {
    to: "/progress",
    label: "Progress",
    icon: TrendingUp,
    ocid: "nav.progress_link",
  },
  { to: "/profile", label: "Profile", icon: User, ocid: "nav.profile_link" },
  {
    to: "/subscription",
    label: "Upgrade",
    icon: Crown,
    ocid: "nav.subscription_link",
  },
] as const;

export default function BottomNav() {
  const location = useLocation();

  return (
    <nav className="bg-card border-t border-border shadow-warm-md pb-safe">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-around h-16">
          {navItems.map(({ to, label, icon: Icon, ocid }) => {
            const isActive = location.pathname === to;
            return (
              <Link
                key={to}
                to={to}
                data-ocid={ocid}
                className={cn(
                  "relative flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl transition-smooth min-w-[3rem]",
                  isActive
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <Icon
                  className={cn(
                    "size-5 transition-smooth",
                    isActive && "stroke-[2.5px]",
                  )}
                />
                <span
                  className={cn(
                    "text-[10px] font-body font-medium tracking-wide",
                    isActive ? "text-primary" : "text-muted-foreground",
                  )}
                >
                  {label}
                </span>
                {isActive && (
                  <span className="absolute bottom-2 w-1 h-1 rounded-full bg-primary" />
                )}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
