"use client";
import { useState } from "react";
import Link from "next/link";
import { Plus, Search, Building2, Phone, IndianRupee } from "lucide-react";
import { Card, CardContent } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";

const mockClients = [
  { id: "c1", name: "EPE Process Filters", outstanding: 5200, jobsActive: 1, phone: "+91 9876543210" },
  { id: "c2", name: "AJ Packaging Limited", outstanding: 10970, jobsActive: 2, phone: "+91 9876543211" },
  { id: "c3", name: "Ashalube Solutions Pvt. Ltd.", outstanding: 20900, jobsActive: 0, phone: "+91 9876543212" },
];

export default function ClientsPage() {
  const [search, setSearch] = useState("");
  
  const filtered = mockClients.filter(c => c.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <main className="min-h-screen pb-24 bg-background flex flex-col">
      <header className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b border-border px-4 py-3 shrink-0">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-foreground">Clients</h1>
          <button className="h-8 w-8 rounded-full bg-accent text-accent-foreground flex items-center justify-center">
            <Plus className="h-5 w-5" />
          </button>
        </div>
        <div className="mt-4 relative">
          <Search className="absolute left-3 top-2.5 h-5 w-5 text-muted" />
          <Input 
            placeholder="Search clients..." 
            value={search} 
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 h-10 bg-card/60"
          />
        </div>
      </header>

      <div className="flex-1 p-4 space-y-3 overflow-y-auto">
        {filtered.map(client => (
          <Link key={client.id} href={`/clients/${client.id}`}>
            <Card className="border-border hover:border-accent/50 transition-colors bg-card/50">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="h-10 w-10 rounded-full bg-border/50 text-muted flex items-center justify-center shrink-0">
                    <Building2 className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-foreground truncate">{client.name}</h3>
                    <p className="text-xs text-muted flex items-center gap-1 mt-1">
                      <Phone className="h-3 w-3" /> {client.phone}
                    </p>
                    
                    <div className="flex items-center gap-4 mt-3">
                      <div className="flex flex-col">
                        <span className="text-[10px] uppercase tracking-wider text-muted font-semibold">Active Jobs</span>
                        <span className="font-mono text-sm text-foreground">{client.jobsActive}</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[10px] uppercase tracking-wider text-muted font-semibold">Outstanding</span>
                        <span className={client.outstanding > 0 ? "text-error font-mono text-sm font-semibold flex items-center" : "text-success font-mono text-sm font-semibold flex items-center"}>
                           <IndianRupee className="h-3 w-3 mr-px"/>{client.outstanding.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
        {filtered.length === 0 && (
          <div className="text-center py-10 text-muted text-sm">
            No clients found.
          </div>
        )}
      </div>
    </main>
  );
}
