"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  BriefcaseBusiness, IndianRupee, LayoutDashboard, Users, Network, 
  Menu, X, FileText, Settings, ShieldCheck, Inbox, Truck, Box, Package
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { useStore } from "@/store/useStore";

export function BottomNav() {
  const pathname = usePathname();
  const organization = useStore((state) => state.organization);
  const user = useStore((state) => state.user);
  
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Close menu on route change
  useEffect(() => {
    setIsMenuOpen(false);
  }, [pathname]);

  // Don't show bottom nav on login or onboarding screens
  if (pathname === "/" || pathname.startsWith("/onboarding") || pathname.startsWith("/employee")) {
    return null;
  }

  const mainLinks = [
    { href: "/home", icon: LayoutDashboard, label: "Home", allowedRoles: ["owner", "accountant", "manager", "viewer"] },
    { href: "/clients", icon: Users, label: "Contacts", allowedRoles: ["owner", "manager", "viewer"] }
  ];

  if (organization?.business_type === "manufacturing") {
    mainLinks.push({ href: "/jobs", icon: Network, label: "Jobs", allowedRoles: ["owner", "manager"] });
  } else {
    mainLinks.push({ href: "/finance", icon: IndianRupee, label: "Money", allowedRoles: ["owner", "accountant", "viewer"] });
  }

  const primaryNavLinks = mainLinks.filter(link => !user || link.allowedRoles.includes(user.role));

  const allMenuItems = [
    ...(organization?.business_type === "manufacturing" ? [
      { href: "/finance", icon: IndianRupee, label: "Money", desc: "Invoices & Payments", allowedRoles: ["owner", "accountant", "viewer"] },
      { href: "/dc/inward", icon: Package, label: "Inward DC", desc: "Incoming materials", allowedRoles: ["owner", "manager", "viewer"] },
      { href: "/dc/outward", icon: Truck, label: "Outward DC", desc: "Outgoing dispatches", allowedRoles: ["owner", "manager", "viewer"] }
    ] : []),
    { href: "/invoices/new", icon: FileText, label: "New Bill", desc: "Generate a Tax Invoice", allowedRoles: ["owner", "accountant"] },
    { href: "/network", icon: BriefcaseBusiness, label: "Vendor Network", desc: "Manage your supply chain", allowedRoles: ["owner", "accountant", "manager"] },
    { href: "/network/inbox", icon: Inbox, label: "PO Inbox", desc: "Received purchase orders", allowedRoles: ["owner", "accountant", "manager"] },
    { href: "/staff", icon: ShieldCheck, label: "Staff", desc: "Users and roles", allowedRoles: ["owner", "manager", "accountant", "viewer"] },
    { href: "/settings", icon: Settings, label: "Settings", desc: "Organization profile", allowedRoles: ["owner", "accountant", "manager", "viewer"] }
  ];

  const allowedMenuItems = allMenuItems.filter(link => !user || link.allowedRoles.includes(user.role));

  return (
    <>
      <nav className="fixed bottom-0 left-0 right-0 z-40 flex h-[72px] items-center justify-around border-t border-white/5 bg-[#0a0a0a]/95 pb-safe pt-1 backdrop-blur-xl xl:hidden">
        {primaryNavLinks.map((link) => {
          const Icon = link.icon;
          const isActive = link.href === "/home" ? pathname === link.href : pathname.startsWith(link.href);
          
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
                  layoutId="activeTabMobile"
                  className="absolute bottom-0 w-12 h-0.5 bg-accent rounded-full"
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                />
              )}
            </Link>
          );
        })}

        {/* More Menu Toggle */}
        <button
          onClick={() => setIsMenuOpen(true)}
          className={cn(
            "relative flex flex-col items-center justify-center w-full h-full gap-1.5 transition-colors active:scale-95",
            isMenuOpen ? "text-white" : "text-[#888]"
          )}
        >
          <div className="relative">
            <Menu className="h-5 w-5" strokeWidth={isMenuOpen ? 2.5 : 1.8} />
          </div>
          <span className={cn("text-[10px] leading-none", isMenuOpen ? "font-bold" : "font-medium")}>More</span>
        </button>
      </nav>

      {/* Drawer Overlay */}
      <AnimatePresence>
        {isMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMenuOpen(false)}
              className="fixed inset-0 z-[45] bg-black/60 backdrop-blur-sm xl:hidden"
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed bottom-0 left-0 right-0 z-[50] rounded-t-[32px] bg-[#0a0a0a] border-t border-white/10 pb-safe shadow-[0_-20px_40px_rgba(0,0,0,0.5)] xl:hidden flex flex-col max-h-[85vh]"
            >
              <div className="sticky top-0 z-10 flex items-center justify-between border-b border-white/5 bg-[#0a0a0a]/90 backdrop-blur-md px-6 py-5">
                <h2 className="text-sm font-black uppercase tracking-widest text-[#666]">More Options</h2>
                <button 
                  onClick={() => setIsMenuOpen(false)}
                  className="rounded-full bg-white/5 p-2 text-white hover:bg-white/10 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              
              <div className="overflow-y-auto px-4 py-4 grid grid-cols-2 gap-3 mb-[72px]">
                {allowedMenuItems.map((item) => {
                  const ItemIcon = item.icon;
                  const isItemActive = pathname.startsWith(item.href);
                  
                  return (
                    <Link
                      key={item.label}
                      href={item.href}
                      className={cn(
                        "flex flex-col gap-3 rounded-2xl border p-4 transition-colors active:scale-95",
                        isItemActive 
                          ? "border-accent/20 bg-accent/5" 
                          : "border-white/5 bg-white/[0.02] hover:bg-white/[0.04]"
                      )}
                    >
                      <div className={cn(
                        "flex h-10 w-10 items-center justify-center rounded-xl",
                        isItemActive ? "bg-accent/20 text-accent" : "bg-white/5 text-muted-foreground"
                      )}>
                        <ItemIcon className="h-5 w-5" />
                      </div>
                      <div>
                        <p className={cn(
                          "text-sm font-bold uppercase tracking-tight",
                          isItemActive ? "text-accent" : "text-white"
                        )}>{item.label}</p>
                        <p className="mt-0.5 text-[10px] text-muted-foreground">{item.desc}</p>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
