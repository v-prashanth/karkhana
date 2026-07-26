"use client";

import { useEffect, useState, useCallback } from "react";
import { 
  MessageSquare, 
  Search, 
  Phone, 
  Mail, 
  MapPin, 
  Clock, 
  Calendar, 
  Home, 
  Droplet, 
  ExternalLink, 
  Loader2, 
  MessageCircle,
  FileText
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { PageHeader } from "@/components/shared/PageHeader";
import { useToast } from "@/components/ui/Toaster";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

interface ExternalLead {
  id: string;
  org_id: string;
  source: string;
  name: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  product_interest: string | null;
  property_type: string | null;
  bathrooms: string | null;
  preferred_date: string | null;
  notes: string | null;
  status: "new" | "contacted" | "site_visit_scheduled" | "quotation_sent" | "installation_done" | "completed" | "closed";
  external_ref: string | null;
  synced_at: string;
  created_at: string;
  updated_at: string;
}

const statusOptions: { value: ExternalLead["status"]; label: string; color: string }[] = [
  { value: "new", label: "New", color: "bg-blue-500/10 text-blue-400 border border-blue-500/20" },
  { value: "contacted", label: "Contacted", color: "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20" },
  { value: "site_visit_scheduled", label: "Site Visit Scheduled", color: "bg-amber-500/10 text-amber-400 border border-amber-500/20" },
  { value: "quotation_sent", label: "Quotation Sent", color: "bg-purple-500/10 text-purple-400 border border-purple-500/20" },
  { value: "installation_done", label: "Installation Done", color: "bg-teal-500/10 text-teal-400 border border-teal-500/20" },
  { value: "completed", label: "Completed", color: "bg-green-500/10 text-green-400 border border-green-500/20" },
  { value: "closed", label: "Closed", color: "bg-white/10 text-white/40 border border-white/5" }
];

export default function LeadsPage() {
  const supabase = createClient();
  const { toast } = useToast();

  // State
  const [leads, setLeads] = useState<ExternalLead[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<string>("all");
  const [updatingIds, setUpdatingIds] = useState<Record<string, boolean>>({});

  // Fetch leads
  const fetchLeads = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("external_leads")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setLeads(data || []);
    } catch (err: any) {
      toast(err.message || "Failed to load enquiries", "error");
    } finally {
      setIsLoading(false);
    }
  }, [supabase, toast]);

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  // Real-time listener
  useEffect(() => {
    const channel = supabase
      .channel("external-leads-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "external_leads" },
        () => {
          fetchLeads();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, fetchLeads]);

  // Status updates (with optimistic updates)
  const handleStatusChange = async (leadId: string, newStatus: ExternalLead["status"]) => {
    const previousLeads = [...leads];
    
    // Optimistic Update
    setLeads(prev => 
      prev.map(l => l.id === leadId ? { ...l, status: newStatus } : l)
    );
    setUpdatingIds(prev => ({ ...prev, [leadId]: true }));

    try {
      const { error } = await supabase
        .from("external_leads")
        .update({ status: newStatus })
        .eq("id", leadId);

      if (error) throw error;
      toast("Lead status updated successfully", "success");
    } catch (err: any) {
      // Revert state on error
      setLeads(previousLeads);
      toast(err.message || "Failed to update lead status", "error");
    } finally {
      setUpdatingIds(prev => ({ ...prev, [leadId]: false }));
    }
  };

  // Search Logic
  const searchedLeads = leads.filter(l => 
    l.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    (l.phone && l.phone.includes(searchQuery))
  );

  // Tab Filtering counts
  const tabCounts: Record<string, number> = { all: searchedLeads.length };
  statusOptions.forEach(opt => {
    tabCounts[opt.value] = searchedLeads.filter(l => l.status === opt.value).length;
  });

  // Filter Leads by active tab
  const filteredLeads = searchedLeads.filter(l => 
    activeTab === "all" || l.status === activeTab
  );

  // Capitalize word helper
  const capitalize = (word: string | null) => {
    if (!word) return "";
    return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
  };

  // WhatsApp link generator
  const getWhatsAppLink = (phone: string, name: string) => {
    const cleanPhone = phone.replace(/[^0-9]/g, "");
    const formattedPhone = cleanPhone.startsWith("91") ? cleanPhone : `91${cleanPhone}`;
    const text = encodeURIComponent(
      `Hi ${name}, thank you for your enquiry with Aqua Elite Solutions. How can we help you today?`
    );
    return `https://wa.me/${formattedPhone}?text=${text}`;
  };

  return (
    <main className="min-h-screen bg-background pb-24 text-foreground">
      <PageHeader 
        title="Website Leads" 
        subtitle="Enquiries from connected websites" 
        backHref="/home"
      />

      <div className="px-5 space-y-8 max-w-5xl mx-auto py-6">
        
        {/* Search Bar controls */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            type="text" 
            placeholder="Search leads by customer name or phone..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-11 border-white/5 bg-white/[0.01]"
          />
        </div>

        {/* Dynamic Status Tabs (Horizontal Scroll) */}
        {!isLoading && (
          <div className="flex gap-2 py-1 overflow-x-auto no-scrollbar scroll-smooth">
            {/* "All" Tab (always shows) */}
            <button
              onClick={() => setActiveTab("all")}
              className={cn(
                "flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap border border-white/5",
                activeTab === "all"
                  ? "bg-white/10 text-white"
                  : "bg-white/[0.01] text-white/40 hover:text-white/60 hover:bg-white/[0.02]"
              )}
            >
              All ({tabCounts.all})
            </button>

            {/* Status Tabs (only show if count > 0) */}
            {statusOptions.map(opt => {
              const count = tabCounts[opt.value] || 0;
              if (count === 0) return null;

              return (
                <button
                  key={opt.value}
                  onClick={() => setActiveTab(opt.value)}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap border border-white/5",
                    activeTab === opt.value
                      ? "bg-white/10 text-white"
                      : "bg-white/[0.01] text-white/40 hover:text-white/60 hover:bg-white/[0.02]"
                  )}
                >
                  {opt.label} ({count})
                </button>
              );
            })}
          </div>
        )}

        {/* Lead Listing */}
        {isLoading ? (
          <div className="grid grid-cols-1 gap-4">
            {[1, 2, 3].map(i => (
              <Card key={i} className="glass border-white/5 bg-white/[0.005] animate-pulse">
                <div className="p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div className="space-y-3 flex-1">
                    <div className="h-5 w-48 bg-white/10 rounded-lg" />
                    <div className="h-4 w-72 bg-white/5 rounded-lg" />
                  </div>
                  <div className="h-10 w-24 bg-white/10 rounded-lg" />
                </div>
              </Card>
            ))}
          </div>
        ) : filteredLeads.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center border border-dashed border-white/5 rounded-3xl bg-white/[0.002]">
            <MessageSquare className="h-12 w-12 text-muted-foreground opacity-40 mb-3" />
            <p className="text-sm font-bold text-foreground">
              {activeTab === "all" 
                ? "No leads yet" 
                : `No leads with status "${statusOptions.find(o => o.value === activeTab)?.label}"`}
            </p>
            <p className="text-xs text-muted-foreground mt-1 max-w-sm">
              {activeTab === "all" 
                ? "Connect your website integration to start receiving lead enquiries automatically." 
                : `There are currently no synchronized enquiries matching this filter status.`}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {filteredLeads.map((lead) => {
              const statusConfig = statusOptions.find(opt => opt.value === lead.status);
              const isUpdating = updatingIds[lead.id];

              return (
                <Card 
                  key={lead.id} 
                  className="glass border-white/5 bg-white/[0.005] hover:border-white/10 transition-colors"
                >
                  <div className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    
                    {/* Lead Core Details */}
                    <div className="flex-1 space-y-4">
                      {/* Title Header */}
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-base font-bold text-white">{lead.name}</h3>
                        <span className={cn("px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider", statusConfig?.color)}>
                          {statusConfig?.label}
                        </span>
                        {lead.product_interest && (
                          <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black bg-blue-500/10 text-blue-400 border border-blue-500/20 uppercase tracking-wider">
                            {lead.product_interest}
                          </span>
                        )}
                        <span className="text-[9px] bg-white/5 text-muted-foreground/60 border border-white/5 px-2 py-0.5 rounded-full uppercase tracking-widest font-black">
                          via {lead.source}
                        </span>
                      </div>

                      {/* Specs Grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-y-2 gap-x-4 text-xs">
                        {lead.phone && (
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Phone className="h-3.5 w-3.5 text-white/30" />
                            <span className="font-mono text-white/80">{lead.phone}</span>
                          </div>
                        )}
                        {lead.email && (
                          <div className="flex items-center gap-2 text-muted-foreground truncate">
                            <Mail className="h-3.5 w-3.5 text-white/30" />
                            <span className="truncate text-white/80">{lead.email}</span>
                          </div>
                        )}
                        {(lead.property_type || lead.bathrooms) && (
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Home className="h-3.5 w-3.5 text-white/30" />
                            <span className="text-white/80">
                              {capitalize(lead.property_type)} {lead.bathrooms ? `• ${lead.bathrooms} Bath` : ""}
                            </span>
                          </div>
                        )}
                        {lead.preferred_date && (
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Calendar className="h-3.5 w-3.5 text-white/30" />
                            <span className="text-white/80">Date: {lead.preferred_date}</span>
                          </div>
                        )}
                        {lead.address && (
                          <div className="flex items-start gap-2 text-muted-foreground sm:col-span-2">
                            <MapPin className="h-3.5 w-3.5 text-white/30 mt-0.5 shrink-0" />
                            <span className="text-white/80 line-clamp-1">{lead.address}</span>
                          </div>
                        )}
                      </div>

                      {/* Notes Box */}
                      {lead.notes && (
                        <div className="p-3 rounded-xl bg-white/[0.01] border border-white/5 text-xs text-muted-foreground max-w-2xl leading-relaxed">
                          <p className="text-[9px] font-black uppercase tracking-widest text-[#777] mb-1">Customer Enquiry Notes</p>
                          <span className="text-white/70 italic">"{lead.notes}"</span>
                        </div>
                      )}

                      {/* Created Timestamp footer */}
                      <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground/60 font-semibold uppercase tracking-wider">
                        <Clock className="h-3 w-3" />
                        <span>Synced {new Date(lead.created_at).toLocaleString()}</span>
                      </div>
                    </div>

                    {/* Actions Side panel */}
                    <div className="flex flex-row md:flex-col items-center gap-3 w-full md:w-auto shrink-0 border-t md:border-t-0 border-white/5 pt-4 md:pt-0">
                      <div className="relative w-full md:w-44">
                        <select
                          disabled={isUpdating}
                          value={lead.status}
                          onChange={(e) => handleStatusChange(lead.id, e.target.value as ExternalLead["status"])}
                          className="h-12 w-full rounded-xl border border-white/5 bg-[#121212] px-4 text-xs font-bold uppercase tracking-wider text-foreground focus:border-accent focus:outline-none appearance-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {statusOptions.map(opt => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label.toUpperCase()}
                            </option>
                          ))}
                        </select>
                        {isUpdating && (
                          <div className="absolute right-4 top-1/2 -translate-y-1/2">
                            <Loader2 className="h-4 w-4 animate-spin text-accent" />
                          </div>
                        )}
                      </div>

                      <div className="flex gap-2 w-full md:w-auto">
                        {lead.phone && (
                          <>
                            {/* WhatsApp Button */}
                            <a
                              href={getWhatsAppLink(lead.phone, lead.name)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex-1 md:flex-none flex h-12 w-full md:w-12 items-center justify-center rounded-xl bg-green-500/10 text-green-400 border border-green-500/20 hover:bg-green-500/20 active:scale-95 transition-all"
                              title="Chat on WhatsApp"
                            >
                              <MessageCircle className="h-5 w-5" />
                            </a>
                            {/* Call Button */}
                            <a
                              href={`tel:${lead.phone}`}
                              className="flex-1 md:flex-none flex h-12 w-full md:w-12 items-center justify-center rounded-xl bg-white/5 text-muted-foreground border border-white/5 hover:bg-white/10 hover:text-white active:scale-95 transition-all"
                              title="Call Client"
                            >
                              <Phone className="h-5 w-5" />
                            </a>
                          </>
                        )}
                      </div>
                    </div>

                  </div>
                </Card>
              );
            })}
          </div>
        )}

      </div>
    </main>
  );
}
