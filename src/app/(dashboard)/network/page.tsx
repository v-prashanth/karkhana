"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Network, Activity, Package, Building2, ExternalLink, FileText, Plus, Send, ArrowRight, Loader2 } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { useStore } from "@/store/useStore";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { formatCurrency } from "@/lib/utils/currency";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/ui/Toaster";

type Tab = "overview" | "purchase-orders";

export default function SupplyNetworkPage() {
  const { user } = useStore();
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [showPOForm, setShowPOForm] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: networkData, isLoading } = useQuery({
    queryKey: ["supply-network", user?.id],
    enabled: Boolean(user?.id),
    queryFn: async () => {
      const res = await fetch("/api/network");
      if (!res.ok) throw new Error("Failed to load network sync");
      return res.json();
    },
  });

  const { data: issuedPOs = [] } = useQuery({
    queryKey: ["network-pos-issued"],
    enabled: activeTab === "purchase-orders",
    queryFn: async () => {
      const res = await fetch("/api/network/po?view=issued");
      if (!res.ok) throw new Error("Failed to load POs");
      return res.json();
    },
  });

  const tabs = [
    { id: "overview" as Tab, label: "Overview" },
    { id: "purchase-orders" as Tab, label: "Purchase Orders" },
  ];

  return (
    <main className="min-h-screen bg-background pb-20">
      <PageHeader
        title="Supply Network"
        subtitle="Your vendor connections"
        action={
          activeTab === "purchase-orders" && networkData?.vendors?.length > 0 ? (
            <button
              onClick={() => setShowPOForm(true)}
              className="flex items-center gap-2 rounded-full bg-accent px-4 py-2 text-sm font-bold text-white shadow-[0_0_20px_rgba(255,107,43,0.3)] hover:shadow-[0_0_30px_rgba(255,107,43,0.5)] transition-shadow"
            >
              <Plus className="h-4 w-4" />
              New PO
            </button>
          ) : undefined
        }
      />

      {/* Tabs */}
      <div className="flex gap-2 px-5 py-3 xl:px-8">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "rounded-full px-4 py-2 text-xs font-bold uppercase tracking-wider transition-colors",
              activeTab === tab.id
                ? "bg-accent text-white"
                : "bg-white/5 text-muted-foreground hover:bg-white/10"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="mx-auto max-w-7xl space-y-6 p-4 xl:px-8">
        {isLoading ? (
          <div className="grid gap-4 xl:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 animate-pulse rounded-2xl bg-white/5" />
            ))}
          </div>
        ) : activeTab === "overview" ? (
          <OverviewTab networkData={networkData} />
        ) : (
          <PurchaseOrdersTab
            issuedPOs={issuedPOs}
            vendors={networkData?.vendors || []}
            showForm={showPOForm}
            onCloseForm={() => setShowPOForm(false)}
            toast={toast}
            queryClient={queryClient}
          />
        )}
      </div>
    </main>
  );
}

/* ========== OVERVIEW TAB ========== */
interface NetworkData {
  stats: {
    activeVendors: number;
    totalIncomingShipments: number;
    totalPayable: number;
  };
  incomingGoods: any[];
  payables: any[];
  vendors: any[];
}

function OverviewTab({ networkData }: { networkData: NetworkData }) {
  return (
    <>
      <section className="grid gap-4 sm:grid-cols-3">
        <Card className="border-border/60 bg-white/[0.02] transition-colors hover:bg-white/[0.05]">
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-500/10 text-orange-400">
                <Activity className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-[#888]">Active Vendors</p>
                <p className="text-2xl font-black italic tracking-tighter text-white">
                  {networkData?.stats.activeVendors || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60 bg-white/[0.02] transition-colors hover:bg-white/[0.05]">
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400">
                <Package className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-[#888]">Inward Shipments</p>
                <p className="text-2xl font-black italic tracking-tighter text-white">
                  {networkData?.stats.totalIncomingShipments || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60 bg-accent/5">
          <CardContent className="p-5 relative overflow-hidden">
            <div className="absolute right-0 top-0 opacity-10 p-2"><Network className="h-12 w-12 text-accent" /></div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-accent">Total Payables</p>
            <p className="text-3xl font-black italic tracking-tighter text-white mt-1">
              {formatCurrency(networkData?.stats.totalPayable || 0)}
            </p>
          </CardContent>
        </Card>
      </section>

      <div className="grid gap-6 xl:grid-cols-[1fr_400px]">
        <div className="space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-widest text-[#888]">Incoming Deliveries (DCs)</h3>
          {!networkData?.incomingGoods?.length ? (
            <div className="rounded-2xl border border-white/5 bg-background/50 p-8 text-center text-muted-foreground">
              <Package className="mx-auto h-8 w-8 opacity-50 mb-3" />
              <p className="text-sm">No recent incoming deliveries linked to your phone.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {networkData.incomingGoods.map((dc) => (
                <Card key={dc.id} className="border-border/50 bg-background/50 p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-xs font-bold text-accent tracking-wider uppercase mb-1">
                        {dc.organization?.name}
                      </p>
                      <p className="font-semibold">{dc.notes || "Material Delivered"}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Ref: {dc.reference_number || "N/A"} • DC: {dc.document_number}
                      </p>
                    </div>
                    <span className="text-xs font-mono text-muted-foreground">
                      {format(new Date(dc.date), "dd MMM")}
                    </span>
                  </div>
                </Card>
              ))}
            </div>
          )}

          <h3 className="text-xs font-bold uppercase tracking-widest text-[#888] pt-4">Your Open Invoices</h3>
          {!networkData?.payables?.length ? (
            <div className="rounded-2xl border border-white/5 bg-background/50 p-8 text-center text-muted-foreground">
              <Activity className="mx-auto h-8 w-8 opacity-50 mb-3" />
              <p className="text-sm">No unpaid invoices linked to your account.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {networkData.payables.map((inv) => (
                <Card key={inv.id} className="border-border/50 bg-background/50 p-4 flex justify-between items-center">
                  <div>
                    <p className="text-xs font-bold text-muted-foreground tracking-wider uppercase mb-0.5">
                      {inv.organization?.name}
                    </p>
                    <p className="font-semibold font-mono">{inv.invoice_number}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-black text-white italic">{formatCurrency(inv.amount_due)}</p>
                    <p className="text-[10px] text-red-400 font-bold uppercase tracking-wide mt-0.5">Due: {format(new Date(inv.due_date), "dd MMM")}</p>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-widest text-[#888]">Verified Vendors</h3>
          <Card className="border-white/5 bg-white/[0.01]">
            <CardContent className="p-0">
              {!networkData?.vendors?.length ? (
                <p className="p-6 text-center text-sm text-muted-foreground">Network empty.</p>
              ) : (
                <div className="divide-y divide-white/5">
                  {networkData.vendors.map((vendor) => (
                    <div key={vendor.id} className="p-4 flex items-center justify-between hover:bg-white/[0.02] transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-accent/20 flex items-center justify-center border border-accent/30">
                          <Building2 className="h-4 w-4 text-accent" />
                        </div>
                        <p className="font-bold text-sm">{vendor.name}</p>
                      </div>
                      <ExternalLink className="h-4 w-4 text-muted-foreground opacity-50" />
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}

/* ========== PURCHASE ORDERS TAB ========== */
function PurchaseOrdersTab({
  issuedPOs,
  vendors,
  showForm,
  onCloseForm,
  toast,
  queryClient,
}: {
  issuedPOs: any[];
  vendors: any[];
  showForm: boolean;
  onCloseForm: () => void;
  toast: (message: string, type?: "success" | "error" | "info") => void;
  queryClient: any;
}) {
  const [selectedVendor, setSelectedVendor] = useState("");
  const [description, setDescription] = useState("");
  const [total, setTotal] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [notes, setNotes] = useState("");

  const createPO = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/network/po", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          supplier_org_id: selectedVendor,
          description,
          total: parseFloat(total) || 0,
          due_date: dueDate || null,
          notes,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to create PO");
      }
      return res.json();
    },
    onSuccess: (data) => {
      toast(`${data.po_number} sent to vendor.`, "success");
      queryClient.invalidateQueries({ queryKey: ["network-pos-issued"] });
      onCloseForm();
      setSelectedVendor("");
      setDescription("");
      setTotal("");
      setDueDate("");
      setNotes("");
    },
    onError: (err: Error) => {
      toast(err.message, "error");
    },
  });

  const statusColors: Record<string, string> = {
    sent: "bg-blue-500/10 text-blue-400",
    acknowledged: "bg-yellow-500/10 text-yellow-400",
    in_progress: "bg-orange-500/10 text-orange-400",
    completed: "bg-green-500/10 text-green-400",
    cancelled: "bg-red-500/10 text-red-400",
  };

  return (
    <div className="space-y-6">
      {/* PO Creation Form */}
      {showForm && (
        <Card className="border-accent/20 bg-accent/5">
          <CardContent className="p-6 space-y-4">
            <h3 className="text-sm font-black uppercase tracking-widest text-accent">Issue Purchase Order</h3>

            <div>
              <label className="text-[10px] font-bold uppercase tracking-widest text-[#888] mb-1 block">Select Vendor</label>
              <select
                value={selectedVendor}
                onChange={(e) => setSelectedVendor(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-background/80 px-4 py-3 text-sm text-white outline-none focus:border-accent"
              >
                <option value="">Choose a vendor...</option>
                {vendors.map((v) => (
                  <option key={v.id} value={v.id}>{v.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[10px] font-bold uppercase tracking-widest text-[#888] mb-1 block">Description</label>
              <Input
                placeholder="e.g. CNC machining of 50 shaft assemblies"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-[#888] mb-1 block">Total Amount (₹)</label>
                <Input
                  type="number"
                  placeholder="0"
                  value={total}
                  onChange={(e) => setTotal(e.target.value)}
                />
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-[#888] mb-1 block">Due Date</label>
                <Input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] font-bold uppercase tracking-widest text-[#888] mb-1 block">Notes</label>
              <Input
                placeholder="Special instructions..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => createPO.mutate()}
                disabled={!selectedVendor || !description || createPO.isPending}
                className="flex items-center gap-2 rounded-xl bg-accent px-6 py-3 text-sm font-bold text-white disabled:opacity-50 hover:brightness-110 transition-all"
              >
                {createPO.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
                Send PO
              </button>
              <button
                onClick={onCloseForm}
                className="rounded-xl px-6 py-3 text-sm font-medium text-muted-foreground hover:bg-white/5 transition-colors"
              >
                Cancel
              </button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Issued POs List */}
      <h3 className="text-xs font-bold uppercase tracking-widest text-[#888]">Your Issued Purchase Orders</h3>
      {!issuedPOs.length ? (
        <div className="rounded-2xl border border-white/5 bg-background/50 p-8 text-center text-muted-foreground">
          <FileText className="mx-auto h-8 w-8 opacity-50 mb-3" />
          <p className="text-sm">No purchase orders issued yet.</p>
          {vendors.length > 0 && (
            <button
              onClick={() => onCloseForm()}
              className="mt-4 inline-flex items-center gap-2 text-xs font-black text-accent uppercase tracking-widest italic"
            >
              Issue your first PO <ArrowRight className="h-3 w-3" />
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {issuedPOs.map((po) => (
            <Card key={po.id} className="border-border/50 bg-background/50">
              <CardContent className="p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-xs font-bold text-muted-foreground tracking-wider uppercase mb-0.5">
                      To: {po.supplier?.name}
                    </p>
                    <p className="font-semibold font-mono">{po.po_number}</p>
                    <p className="text-sm text-muted-foreground mt-1">{po.description}</p>
                  </div>
                  <div className="text-right space-y-1">
                    <p className="font-black text-white italic">{formatCurrency(po.total)}</p>
                    <span className={cn("text-[10px] font-bold uppercase px-2 py-0.5 rounded-full", statusColors[po.status] || "bg-white/5 text-white/50")}>
                      {po.status?.replace("_", " ")}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
