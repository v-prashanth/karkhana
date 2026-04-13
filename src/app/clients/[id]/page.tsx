"use client";
import { ArrowLeft, Phone, MessageSquare, Hammer, Receipt, History } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

// Assuming mock data corresponds to ID
const mockClientData = {
  id: "c1",
  name: "EPE Process Filters",
  contactPerson: "Ram Pulker",
  phone: "8019315750",
  address: "Plot 12, Phase 4, Balanagar",
  outstanding: 5200,
  avgPaymentDays: 42,
  totalBusiness: 245000,
  recentActivity: [
    { type: "inv", title: "Invoice #233", amount: 5200, status: "overdue" },
    { type: "pay", title: "Payment Recd", amount: 12000, status: "paid" },
    { type: "job", title: "Machining End Cap", amount: 0, status: "in_progress" }
  ]
};

export default function ClientProfilePage() {
  const router = useRouter();
  const c = mockClientData;

  const handleCall = () => window.open(`tel:${c.phone}`, "_self");
  const handleWA = () => window.open(`https://wa.me/91${c.phone}`, "_blank");

  return (
    <main className="min-h-screen pb-24 bg-background">
      <header className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b border-border px-4 py-3">
        <div className="flex items-center">
          <button onClick={() => router.back()} className="p-2 -ml-2 text-muted hover:text-foreground">
            <ArrowLeft className="h-6 w-6" />
          </button>
          <h1 className="text-lg font-semibold ml-2 text-foreground truncate">{c.name}</h1>
        </div>
      </header>

      <div className="p-4 space-y-6">
        {/* Profile Card */}
        <div className="text-center space-y-3 mt-4">
          <div className="h-20 w-20 mx-auto rounded-full bg-border text-2xl font-bold flex items-center justify-center text-muted">
            {c.name.charAt(0)}
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground">{c.name}</h2>
            <p className="text-sm text-muted mt-1">{c.contactPerson} • {c.address}</p>
          </div>
          
          <div className="flex justify-center gap-3 pt-2">
            <Button variant="outline" size="sm" className="h-10 rounded-full w-32 border-border gap-2" onClick={handleCall}>
              <Phone className="h-4 w-4" /> Call
            </Button>
            <Button variant="outline" size="sm" className="h-10 rounded-full w-32 border-[#25D366] text-[#25D366] hover:bg-[#25D366]/10 gap-2" onClick={handleWA}>
              <MessageSquare className="h-4 w-4" /> WhatsApp
            </Button>
          </div>
        </div>

        {/* Business Summary */}
        <div className="grid grid-cols-2 gap-3 mt-8">
          <Card className="border-error/20 bg-error/5">
            <CardContent className="p-4">
              <p className="text-xs font-semibold text-error uppercase">Outstanding</p>
              <p className="text-2xl font-mono font-bold text-error mt-1">₹{c.outstanding.toLocaleString()}</p>
            </CardContent>
          </Card>
          <Card className="border-border/50 bg-card/30">
            <CardContent className="p-4">
              <p className="text-xs font-semibold text-muted uppercase">Avg Pay Days</p>
              <p className="text-2xl font-mono font-bold text-foreground mt-1">{c.avgPaymentDays}d</p>
            </CardContent>
          </Card>
          <Card className="border-border/50 bg-card/30 col-span-2">
            <CardContent className="p-4 flex items-center justify-between">
              <span className="text-sm font-semibold text-muted uppercase">Lifetime Value</span>
              <span className="text-xl font-mono font-bold text-success flex items-center tracking-tight">
                ₹{c.totalBusiness.toLocaleString()}
              </span>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <section>
          <h3 className="text-xs font-semibold text-muted uppercase tracking-wider mb-3">Quick Actions</h3>
          <div className="flex gap-3">
            <Link href={`/jobs/new?client=${c.id}`} className="flex-1 flex flex-col items-center justify-center p-4 rounded-xl bg-card border border-border shadow-sm active:scale-95 transition-transform gap-2">
              <Hammer className="h-6 w-6 text-accent" />
              <span className="text-sm font-medium">New Job</span>
            </Link>
            <Link href={`/invoices/new?client=${c.id}`} className="flex-1 flex flex-col items-center justify-center p-4 rounded-xl bg-card border border-border shadow-sm active:scale-95 transition-transform gap-2">
              <Receipt className="h-6 w-6 text-foreground" />
              <span className="text-sm font-medium">Create Bill</span>
            </Link>
          </div>
        </section>

        {/* History */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-semibold text-muted uppercase tracking-wider">Recent History</h3>
            <button className="text-xs text-accent font-medium hover:underline">View All</button>
          </div>
          <div className="space-y-3">
            {c.recentActivity.map((act, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-lg border border-border bg-card/30">
                <div className="flex items-center gap-3">
                  {act.type === 'inv' && <Receipt className="h-4 w-4 text-muted" />}
                  {act.type === 'pay' && <History className="h-4 w-4 text-success" />}
                  {act.type === 'job' && <Hammer className="h-4 w-4 text-accent" />}
                  <span className="text-sm font-medium text-foreground">{act.title}</span>
                </div>
                {act.amount > 0 && <span className="text-sm font-mono font-medium">₹{act.amount.toLocaleString()}</span>}
              </div>
            ))}
          </div>
        </section>

      </div>
    </main>
  );
}
