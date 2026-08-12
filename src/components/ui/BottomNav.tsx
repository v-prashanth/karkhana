"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  BriefcaseBusiness, IndianRupee, LayoutDashboard, Users, Network, 
  Menu, X, FileText, Settings, ShieldCheck, Inbox, Truck, Package,
  BarChart3, Shield, MessageSquare
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { useStore } from "@/store/useStore";
import { getBusinessTemplate } from "@/lib/config/templates";

export function BottomNav() {
  const pathname = usePathname();
  const organization = useStore((state) => state.organization);
  const user = useStore((state) => state.user);
  
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const template = getBusinessTemplate(organization?.business_type);

  // Close menu on route change
  useEffect(() => {
    setIsMenuOpen(false);
  }, [pathname]);

  // Don't show bottom nav on login or onboarding screens
  if (pathname === "/" || pathname.startsWith("/onboarding") || pathname.startsWith("/employee")) {
    return null;
  }

  const workLabel = template.orderLabel ? `${template.orderLabel}s` : "Work";

  const mainLinks = [
    { href: "/home", icon: LayoutDashboard, label: "Home", allowedRoles: ["owner", "accountant", "manager", "viewer"] },
    { href: "/clients", icon: Users, label: "Contacts", allowedRoles: ["owner", "manager", "viewer"] },
    { href: "/jobs", icon: template.hasPhysicalMovement ? Network : BriefcaseBusiness, label: workLabel, allowedRoles: ["owner", "manager", "viewer"] }
  ];

  const primaryNavLinks = mainLinks.filter(link => !user || link.allowedRoles.includes(user.role));

  const allMenuItems = [
    { href: "/finance", icon: IndianRupee, label: "Money", desc: "Invoices & Payments", allowedRoles: ["owner", "accountant", "viewer"] },
    ...(template.hasPhysicalMovement ? [
      { href: "/dc/inward", icon: Package, label: template.receiveLabel || "Receive Material", desc: "Inward movement record", allowedRoles: ["owner", "manager", "viewer"] },
      { href: "/dc/outward", icon: Truck, label: template.dispatchLabel || "Return Material", desc: "Outward movement dispatch", allowedRoles: ["owner", "manager", "viewer"] }
    ] : []),
    { href: "/invoices/new", icon: FileText, label: "New Bill", desc: "Generate a Tax Invoice", allowedRoles: ["owner", "accountant"] },
    { href: "/costing", icon: BarChart3, label: "Costing & Margins", desc: "Production costs & margins", allowedRoles: ["owner", "manager", "accountant"] },
    { href: "/leads", icon: MessageSquare, label: "Leads", desc: "Website lead enquiries", allowedRoles: ["owner", "manager", "viewer"] },
    { href: "/warranty", icon: Shield, label: "Warranty Register", desc: "Manage client product warranties", allowedRoles: ["owner", "manager", "accountant", "viewer"] },
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
            isMenuOpen ? "text-accent" : "text-[#888]"
          )}
        >
          <Menu className="h-5 w-5" />
          <span className="text-[10px] font-medium leading-none">More</span>
        </button>
      </nav>

      {/* Fullscreen Mobile Drawer Menu */}
      <AnimatePresence>
        {isMenuOpen && (
          <div className="fixed inset-0 z-50 xl:hidden">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMenuOpen(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
            />
            
            <motion.div 
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="absolute bottom-0 left-0 right-0 max-h-[85vh] rounded-t-3xl border-t border-white/10 bg-[#121212] p-6 pb-24 overflow-y-auto"
            >
              <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-white">All Navigation</h3>
                  <p className="text-xs text-accent">Where Business Grows</p>
                </div>
                <button 
                  onClick={() => setIsMenuOpen(false)}
                  className="rounded-full bg-white/5 p-2 text-white/70 hover:text-white"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="grid grid-cols-1 gap-2">
                {allowedMenuItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname.startsWith(item.href);

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        "flex items-center gap-4 rounded-2xl p-3.5 transition-all",
                        isActive ? "bg-accent/15 border border-accent/30 text-white" : "bg-white/5 hover:bg-white/10 text-white/80"
                      )}
                    >
                      <div className={cn(
                        "flex h-10 w-10 items-center justify-center rounded-xl",
                        isActive ? "bg-accent text-white" : "bg-white/10 text-white/60"
                      )}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white truncate">{item.label}</p>
                        <p className="text-xs text-white/50 truncate">{item.desc}</p>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
