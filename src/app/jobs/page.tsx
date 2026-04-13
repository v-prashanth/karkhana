"use client";
import { useState } from "react";
import { Plus, Clock, AlertCircle } from "lucide-react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/Card";
import { cn } from "@/lib/utils";

type JobStatus = "pending" | "in_progress" | "complete" | "delivered";

type MockJob = {
  id: string;
  client: string;
  description: string;
  qtyComplete: number;
  qtyTotal: number;
  status: JobStatus;
  daysOld: number;
  isOverdue: boolean;
};

const mockJobs: MockJob[] = [
  { id: "J01", client: "EPE Process Filters", description: "Machining End Cap", qtyComplete: 0, qtyTotal: 20, status: "pending", daysOld: 2, isOverdue: false },
  { id: "J02", client: "AJ Packaging", description: "Aluminium Suckers 25x42x130", qtyComplete: 15, qtyTotal: 50, status: "in_progress", daysOld: 5, isOverdue: true },
  { id: "J03", client: "Ashalube Solutions", description: "Body Maker M/C", qtyComplete: 10, qtyTotal: 10, status: "complete", daysOld: 1, isOverdue: false },
];

export default function JobsPage() {
  const [activeTab, setActiveTab] = useState<JobStatus>("in_progress");

  const tabs: { id: JobStatus; label: string }[] = [
    { id: "pending", label: "Pending" },
    { id: "in_progress", label: "In Prog" },
    { id: "complete", label: "Done" },
    { id: "delivered", label: "Delivered" },
  ];

  const filteredJobs = mockJobs.filter(j => j.status === activeTab);

  return (
    <main className="min-h-screen pb-24 bg-background flex flex-col">
      <header className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b border-border px-4 py-3 shrink-0">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-foreground">Job Tracker</h1>
          <Link href="/jobs/new" className="h-8 w-8 rounded-full bg-accent text-accent-foreground flex items-center justify-center">
            <Plus className="h-5 w-5" />
          </Link>
        </div>

        {/* Mobile Kanban Tabs */}
        <div className="flex gap-2 mt-4 overflow-x-auto pb-1 no-scrollbar">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors",
                activeTab === tab.id ? "bg-foreground text-background" : "bg-card border border-border text-muted"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </header>

      <div className="flex-1 p-4 space-y-3 overflow-y-auto">
        {filteredJobs.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 text-muted">
            <p>No jobs in this column.</p>
          </div>
        ) : (
          filteredJobs.map(job => (
            <Card key={job.id} className={cn("border-border/60", job.isOverdue && "border-error/50")}>
              <CardContent className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-xs font-semibold uppercase tracking-wider text-accent">{job.client}</span>
                  {job.isOverdue && <AlertCircle className="h-4 w-4 text-error" />}
                </div>
                <h3 className="font-medium text-foreground mb-3">{job.description}</h3>
                
                <div className="flex items-end justify-between">
                  <div className="space-y-1">
                    <p className="text-xs text-muted flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" />
                      {job.daysOld} days old
                    </p>
                    <div className="text-sm font-medium">
                      Qty: <span className={job.qtyComplete === job.qtyTotal ? "text-success" : "text-foreground"}>{job.qtyComplete}</span> <span className="text-muted">/ {job.qtyTotal}</span>
                    </div>
                  </div>
                  
                  {job.status === "complete" ? (
                    <Link href={`/dc/outward/new?job=${job.id}`} className="px-3 py-1.5 bg-success/10 text-success text-xs font-semibold rounded-md active:scale-95 transition-transform">
                      Create DC
                    </Link>
                  ) : (
                    <button className="px-3 py-1.5 bg-card border border-border text-xs font-semibold rounded-md active:scale-95 transition-transform">
                      Update
                    </button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </main>
  );
}
