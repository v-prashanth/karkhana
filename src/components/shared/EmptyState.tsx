"use client";
import { motion } from "framer-motion";
import { type ReactNode } from "react";
import { Package, FileText, Users, IndianRupee, Hammer } from "lucide-react";

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description: string;
  action?: ReactNode;
  type?: "orders" | "contacts" | "invoices" | "payments" | "expenses" | "generic";
}

const defaultIcons = {
  orders: <Hammer className="h-10 w-10" />,
  contacts: <Users className="h-10 w-10" />,
  invoices: <FileText className="h-10 w-10" />,
  payments: <IndianRupee className="h-10 w-10" />,
  expenses: <IndianRupee className="h-10 w-10" />,
  generic: <Package className="h-10 w-10" />,
};

export function EmptyState({ icon, title, description, action, type = "generic" }: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-16 px-6 text-center"
    >
      <div className="h-20 w-20 rounded-3xl glass flex items-center justify-center text-muted-foreground mb-6">
        {icon || defaultIcons[type]}
      </div>
      <h3 className="text-lg font-semibold text-foreground mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground max-w-[280px] leading-relaxed">{description}</p>
      {action && <div className="mt-6">{action}</div>}
    </motion.div>
  );
}
