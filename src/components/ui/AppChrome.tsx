"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  BriefcaseBusiness,
  Building2,
  FileText,
  Globe,
  IndianRupee,
  LayoutDashboard,
  Receipt,
  Settings,
  ShieldCheck,
  Users,
} from "lucide-react";
import { BottomNav } from "@/components/ui/BottomNav";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { cn } from "@/lib/utils";
import { useStore } from "@/store/useStore";

interface AppChromeProps {
  children: React.ReactNode;
}

const primaryLinks = [
  { href: "/dashboard", label: "Home", icon: LayoutDashboard },
  { href: "/contacts", label: "Contacts", icon: Users },
  { href: "/finance", label: "Money", icon: IndianRupee },
  { href: "/staff", label: "Staff", icon: ShieldCheck },
];

const secondaryLinks = [
  { href: "/invoices/new", label: "New Bill", icon: FileText },
  { href: "/expenses/new", label: "Log Expense", icon: Receipt },
  { href: "/settings", label: "Settings", icon: Settings },
];

function isActivePath(pathname: string, href: string) {
  if (href === "/dashboard") {
    return pathname === href;
  }

  return pathname.startsWith(href);
}

export function AppChrome({ children }: AppChromeProps) {
  const pathname = usePathname();
  const user = useStore((state) => state.user);
  const organization = useStore((state) => state.organization);
  
  const hideChrome =
    pathname === "/" || pathname.startsWith("/onboarding") || pathname.startsWith("/employee");

  if (hideChrome) {
    return <>{children}</>;
  }

  const homeHref = user?.role === "worker" ? "/employee" : "/dashboard";

  return (
    <div className="app-shell relative min-h-screen">
      <aside className="app-sidebar hidden xl:flex">
        <div className="app-sidebar-panel">
          <Link
            href={homeHref}
            className="rounded-3xl border border-border/70 bg-background/55 p-5 transition-colors hover:bg-background/75"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent/15 text-accent shadow-[0_18px_50px_-24px_rgba(255,122,26,0.85)]">
                <Building2 className="h-6 w-6" />
              </div>
              <div>
                <p className="text-lg font-semibold tracking-tight text-foreground">Karkhana</p>
                <p className="text-xs text-muted-foreground">Built for daily business work</p>
              </div>
            </div>
          </Link>

          <nav className="space-y-2">
            {primaryLinks.map((link) => {
              const Icon = link.icon;
              const active = isActivePath(pathname, link.href);

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition-all",
                    active
                      ? "bg-accent text-white shadow-[0_18px_50px_-24px_rgba(255,122,26,0.85)]"
                      : "text-muted-foreground hover:bg-background/70 hover:text-foreground"
                  )}
                >
                  <Icon className="h-4.5 w-4.5" />
                  <span className="flex-1">{link.label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="mt-auto space-y-3 rounded-3xl border border-border/70 bg-background/55 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
              Actions
            </p>
            <ThemeToggle />
            {secondaryLinks.map((link) => {
              const Icon = link.icon;

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className="flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm text-muted-foreground transition-colors hover:bg-background/70 hover:text-foreground"
                >
                  <Icon className="h-4 w-4" />
                  <span>{link.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </aside>

      <div className="app-content">{children}</div>

      <BottomNav />
    </div>
  );
}
