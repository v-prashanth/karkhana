"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, BriefcaseBusiness, Globe, IndianRupee, LayoutDashboard, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { useStore } from "@/store/useStore";

export function BottomNav() {
  const pathname = usePathname();
  const organization = useStore((state) => state.organization);

  // Don't show bottom nav on login or onboarding screens
  if (pathname === "/" || pathname.startsWith("/onboarding") || pathname.startsWith("/employee")) {
    return null;
  }

  const mainLinks = [
    { href: "/dashboard", icon: LayoutDashboard, label: "Home" },
    { href: "/contacts", icon: Users, label: "Contacts" },
    { href: "/finance", icon: IndianRupee, label: "Money" },
  ];

  return (
    <>
      <nav className="fixed bottom-0 left-0 right-0 z-50 flex h-[72px] items-center justify-around border-t border-white/5 bg-[#0a0a0a]/95 pb-safe pt-1 backdrop-blur-xl xl:hidden">
        {mainLinks.map((link) => {
          const Icon = link.icon;
          const isActive = pathname.startsWith(link.href);
          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "relative flex flex-col items-center justify-center w-full h-full gap-1.5 transition-colors active:scale-95",
                isActive ? "text-accent" : "text-[#888]"
              )}
            >
              <div className="relative">
                <Icon className="h-5 w-5" strokeWidth={isActive ? 2.5 : 1.8} />
              </div>
              <span className={cn(
                "text-[10px] leading-none",
                isActive ? "font-bold" : "font-medium"
              )}>{link.label}</span>
              {isActive && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute bottom-0 w-12 h-0.5 bg-accent rounded-full"
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                />
              )}
            </Link>
          );
        })}
      </nav>
    </>
  );
}
