"use client";

import { Clock, CheckCircle2, Package, Truck, FileText, IndianRupee, User, ShieldCheck } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export interface ActivityItem {
  id: string;
  type: "movement_in" | "movement_out" | "job_status" | "invoice_created" | "payment_received" | "staff_action";
  actorName: string;
  description: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

interface ActivityFeedProps {
  activities?: ActivityItem[];
  isLoading?: boolean;
}

const mockActivities: ActivityItem[] = [
  {
    id: "act-1",
    type: "movement_in",
    actorName: "Rahul",
    description: "received 100 Aluminium Components from EPE",
    timestamp: new Date(Date.now() - 1000 * 60 * 24).toISOString(), // 24 mins ago
  },
  {
    id: "act-2",
    type: "job_status",
    actorName: "Suresh",
    description: "moved Job #JOB-102 to Processing",
    timestamp: new Date(Date.now() - 1000 * 60 * 180).toISOString(), // 3 hours ago
  },
  {
    id: "act-3",
    type: "invoice_created",
    actorName: "System",
    description: "generated Invoice #INV-2026-04 for ₹45,000",
    timestamp: new Date(Date.now() - 1000 * 60 * 600).toISOString(), // 10 hours ago
  },
  {
    id: "act-4",
    type: "payment_received",
    actorName: "Accounts",
    description: "recorded payment of ₹30,000 from Ashalube",
    timestamp: new Date(Date.now() - 1000 * 60 * 1440).toISOString(), // 1 day ago
  },
];

function getIcon(type: ActivityItem["type"]) {
  switch (type) {
    case "movement_in":
      return Package;
    case "movement_out":
      return Truck;
    case "job_status":
      return CheckCircle2;
    case "invoice_created":
      return FileText;
    case "payment_received":
      return IndianRupee;
    default:
      return Clock;
  }
}

export function ActivityFeed({ activities = mockActivities, isLoading = false }: ActivityFeedProps) {
  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-16 animate-pulse rounded-2xl bg-white/5" />
        ))}
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-6 text-center text-xs text-muted-foreground">
        No recent activity recorded yet.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {activities.map((item) => {
        const Icon = getIcon(item.type);
        const timeAgo = formatDistanceToNow(new Date(item.timestamp), { addSuffix: true });

        return (
          <div
            key={item.id}
            className="flex items-center gap-3.5 rounded-2xl border border-white/5 bg-gradient-to-r from-white/[0.03] to-transparent p-3.5 transition-colors hover:border-white/10"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent/10 text-accent border border-accent/15">
              <Icon className="h-4.5 w-4.5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-white/90 leading-snug">
                <span className="font-semibold text-white">{item.actorName}</span> {item.description}
              </p>
              <p className="mt-0.5 text-[10px] text-muted-foreground/70">{timeAgo}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
