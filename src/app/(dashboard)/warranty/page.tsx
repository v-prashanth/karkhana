"use client";

import { useEffect, useState, useCallback } from "react";
import { 
  Shield, 
  Plus, 
  Search, 
  Filter, 
  Calendar, 
  User, 
  Phone, 
  MapPin, 
  Tag, 
  Hash, 
  AlertCircle, 
  Clock, 
  Trash2, 
  Edit3, 
  X, 
  Loader2, 
  TrendingUp,
  SlidersHorizontal,
  ChevronRight,
  ClipboardList
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { PageHeader } from "@/components/shared/PageHeader";
import { useStore } from "@/store/useStore";
import { useToast } from "@/components/ui/Toaster";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";


interface Warranty {
  id: string;
  org_id: string;
  lead_ref: string | null;
  customer_name: string;
  customer_phone: string | null;
  customer_address: string | null;
  product_name: string;
  brand: string;
  model: string | null;
  serial_number: string | null;
  installation_date: string;
  warranty_months: number;
  warranty_expires: string;
  amc_due_date: string | null;
  amc_amount: number | null;
  status: "active" | "expired" | "amc_due" | "amc_completed";
  technician_name: string | null;
  notes: string | null;
  created_at: string;
}

export default function WarrantyPage() {
  const { organization } = useStore();
  const { toast } = useToast();
  const supabase = createClient();

  // States
  const [warranties, setWarranties] = useState<Warranty[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  
  // Drawer Slide-over Panel state
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingWarranty, setEditingWarranty] = useState<Warranty | null>(null);

  // Form Fields State
  const [form, setForm] = useState({
    customer_name: "",
    customer_phone: "",
    customer_address: "",
    product_name: "",
    brand: "Stiebel Eltron",
    model: "",
    serial_number: "",
    installation_date: new Date().toISOString().split("T")[0],
    warranty_months: 12,
    amc_due_date: "",
    amc_amount: "",
    technician_name: "",
    notes: "",
    status: "active" as Warranty["status"]
  });

  // Load warranties
  const loadWarranties = useCallback(async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from("warranties")
        .select("*");

      if (error) throw error;
      setWarranties(data || []);
    } catch (err: any) {
      toast(err.message || "Failed to load warranties", "error");
    } finally {
      setIsLoading(false);
    }
  }, [supabase, toast]);

  useEffect(() => {
    loadWarranties();
  }, [loadWarranties]);


  // Expiry Calculations
  const isExpiringSoon = (expiresDateStr: string, status: string) => {
    if (status !== "active") return false;
    const expires = new Date(expiresDateStr);
    const today = new Date();
    const diffTime = expires.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays >= 0 && diffDays <= 30;
  };

  const isAmcDueSoon = (amcDueDateStr: string | null, status: string) => {
    if (!amcDueDateStr || status === "amc_completed") return false;
    const amcDue = new Date(amcDueDateStr);
    const today = new Date();
    const diffTime = amcDue.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays >= 0 && diffDays <= 30;
  };

  // Open drawer for adding
  const handleOpenAdd = () => {
    setEditingWarranty(null);
    setForm({
      customer_name: "",
      customer_phone: "",
      customer_address: "",
      product_name: "",
      brand: "Stiebel Eltron",
      model: "",
      serial_number: "",
      installation_date: new Date().toISOString().split("T")[0],
      warranty_months: 12,
      amc_due_date: "",
      amc_amount: "",
      technician_name: "",
      notes: "",
      status: "active"
    });
    setIsDrawerOpen(true);
  };

  // Open drawer for editing
  const handleOpenEdit = (warranty: Warranty) => {
    setEditingWarranty(warranty);
    setForm({
      customer_name: warranty.customer_name || "",
      customer_phone: warranty.customer_phone || "",
      customer_address: warranty.customer_address || "",
      product_name: warranty.product_name || "",
      brand: warranty.brand || "Stiebel Eltron",
      model: warranty.model || "",
      serial_number: warranty.serial_number || "",
      installation_date: warranty.installation_date || "",
      warranty_months: warranty.warranty_months || 12,
      amc_due_date: warranty.amc_due_date || "",
      amc_amount: warranty.amc_amount?.toString() || "",
      technician_name: warranty.technician_name || "",
      notes: warranty.notes || "",
      status: warranty.status || "active"
    });
    setIsDrawerOpen(true);
  };

  // Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.customer_name.trim() || !form.product_name.trim() || !form.installation_date) {
      toast("Please fill in all required fields", "error");
      return;
    }
    if (!organization?.id) {
      toast("Workspace session missing", "error");
      return;
    }

    const payload = {
      org_id: organization.id,
      customer_name: form.customer_name.trim(),
      customer_phone: form.customer_phone.trim() || null,
      customer_address: form.customer_address.trim() || null,
      product_name: form.product_name.trim(),
      brand: form.brand.trim() || "Stiebel Eltron",
      model: form.model.trim() || null,
      serial_number: form.serial_number.trim() || null,
      installation_date: form.installation_date,
      warranty_months: Number(form.warranty_months || 12),
      amc_due_date: form.amc_due_date || null,
      amc_amount: form.amc_amount ? parseFloat(form.amc_amount) : null,
      technician_name: form.technician_name.trim() || null,
      notes: form.notes.trim() || null,
      status: form.status
    };

    try {
      if (editingWarranty) {
        // Edit flow
        const { error } = await supabase
          .from("warranties")
          .update(payload)
          .eq("id", editingWarranty.id);
        if (error) throw error;
        toast("Warranty record updated successfully", "success");
      } else {
        // Create flow
        const { error } = await supabase
          .from("warranties")
          .insert(payload);
        if (error) throw error;
        toast("Warranty record added successfully", "success");
      }
      setIsDrawerOpen(false);
      loadWarranties();
    } catch (err: any) {
      toast(err.message || "Failed to save warranty details", "error");
    }
  };

  // Filter & Search Logic
  const filteredWarranties = warranties.filter(w => {
    const matchesSearch = 
      w.customer_name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      (w.customer_phone && w.customer_phone.includes(searchQuery));
    const matchesStatus = statusFilter === "all" || w.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Sort Logic (soonest expiring first by default)
  const sortedWarranties = [...filteredWarranties].sort((a, b) => {
    const dateA = new Date(a.warranty_expires || "");
    const dateB = new Date(b.warranty_expires || "");
    return dateA.getTime() - dateB.getTime();
  });

  // Summary indicators count
  const expiringSoonCount = warranties.filter(w => isExpiringSoon(w.warranty_expires, w.status)).length;
  const amcDueSoonCount = warranties.filter(w => isAmcDueSoon(w.amc_due_date, w.status)).length;

  return (
    <main className="min-h-screen bg-background pb-24 text-foreground relative">
      <PageHeader 
        title="Warranty Register" 
        subtitle="Manage product warranties, repairs, and AMC renewal schedules" 
      />

      <div className="px-5 space-y-8 max-w-6xl mx-auto py-6">
        
        {/* Metric Alert Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <Card className="glass-panel border-white/5 bg-white/[0.01]">
            <CardContent className="p-5 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Total Registered</p>
                <h3 className="text-2xl font-black text-white mt-1">{warranties.length}</h3>
              </div>
              <div className="h-10 w-10 rounded-xl bg-accent/10 text-accent flex items-center justify-center">
                <ClipboardList className="h-5 w-5" />
              </div>
            </CardContent>
          </Card>

          {/* Expiring soon alert card */}
          <Card className={cn(
            "glass-panel transition-all",
            expiringSoonCount > 0 ? "border-amber-500/20 bg-amber-500/[0.02]" : "border-white/5 bg-white/[0.01]"
          )}>
            <CardContent className="p-5 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Expiring in 30 Days</p>
                <h3 className={cn("text-2xl font-black mt-1", expiringSoonCount > 0 ? "text-amber-400" : "text-white")}>
                  {expiringSoonCount}
                </h3>
              </div>
              <div className={cn(
                "h-10 w-10 rounded-xl flex items-center justify-center",
                expiringSoonCount > 0 ? "bg-amber-500/20 text-amber-400" : "bg-white/5 text-muted-foreground"
              )}>
                <AlertCircle className="h-5 w-5" />
              </div>
            </CardContent>
          </Card>

          {/* AMC due alert card */}
          <Card className={cn(
            "glass-panel transition-all",
            amcDueSoonCount > 0 ? "border-orange-500/20 bg-orange-500/[0.02]" : "border-white/5 bg-white/[0.01]"
          )}>
            <CardContent className="p-5 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">AMC Renewals Due</p>
                <h3 className={cn("text-2xl font-black mt-1", amcDueSoonCount > 0 ? "text-orange-400" : "text-white")}>
                  {amcDueSoonCount}
                </h3>
              </div>
              <div className={cn(
                "h-10 w-10 rounded-xl flex items-center justify-center",
                amcDueSoonCount > 0 ? "bg-orange-500/20 text-orange-400" : "bg-white/5 text-muted-foreground"
              )}>
                <Clock className="h-5 w-5" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filter Controls & Action Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex flex-col sm:flex-row gap-3 flex-1">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                type="text" 
                placeholder="Search by customer name or phone..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-11 border-white/5 bg-white/[0.01]"
              />
            </div>
            {/* Status Filter */}
            <div className="relative min-w-[180px]">
              <SlidersHorizontal className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <select 
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="h-12 w-full rounded-xl border border-white/5 bg-[#121212] pl-11 pr-4 text-sm text-foreground focus:border-accent focus:outline-none appearance-none"
              >
                <option value="all">All Statuses</option>
                <option value="active">Active</option>
                <option value="expired">Expired</option>
                <option value="amc_due">AMC Due</option>
                <option value="amc_completed">AMC Completed</option>
              </select>
            </div>
          </div>

          <Button 
            onClick={handleOpenAdd} 
            className="h-12 bg-accent text-white flex items-center justify-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Register Warranty
          </Button>
        </div>

        {/* List View Container */}
        <Card className="glass border-white/5 bg-white/[0.01]">
          <CardContent className="p-0 overflow-x-auto">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-20 space-y-3">
                <Loader2 className="h-8 w-8 animate-spin text-accent" />
                <p className="text-xs text-muted-foreground uppercase tracking-widest font-bold">Fetching warranty database...</p>
              </div>
            ) : sortedWarranties.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <Shield className="h-12 w-12 text-muted-foreground opacity-40 mb-3" />
                <p className="text-sm font-bold text-foreground">No warranty listings found</p>
                <p className="text-xs text-muted-foreground mt-1 max-w-sm">No matches found for your query. Register a product to begin tracking warranties.</p>
              </div>
            ) : (
              <table className="w-full border-collapse text-left text-xs">
                <thead>
                  <tr className="border-b border-white/5 bg-white/[0.02] text-muted-foreground uppercase font-black tracking-widest text-[9px]">
                    <th className="p-4">Customer</th>
                    <th className="p-4">Product Info</th>
                    <th className="p-4">Serial Number</th>
                    <th className="p-4">Installation</th>
                    <th className="p-4">Warranty Expiry</th>
                    <th className="p-4">AMC Due</th>
                    <th className="p-4">Status</th>
                    <th className="p-4">Technician</th>
                    <th className="p-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 font-medium">
                  {sortedWarranties.map((w) => {
                    const expiring = isExpiringSoon(w.warranty_expires, w.status);
                    const amcDue = isAmcDueSoon(w.amc_due_date, w.status);

                    return (
                      <tr 
                        key={w.id} 
                        className={cn(
                          "hover:bg-white/[0.01] transition-colors",
                          expiring && "bg-amber-500/[0.01]",
                          amcDue && "bg-orange-500/[0.01]"
                        )}
                      >
                        {/* Customer details */}
                        <td className="p-4">
                          <p className="font-bold text-foreground">{w.customer_name}</p>
                          {w.customer_phone && (
                            <p className="text-[10px] text-muted-foreground font-mono mt-0.5">{w.customer_phone}</p>
                          )}
                        </td>
                        
                        {/* Product details */}
                        <td className="p-4">
                          <p className="font-bold text-foreground">{w.product_name}</p>
                          <p className="text-[10px] text-muted-foreground mt-0.5">{w.brand} {w.model ? `• ${w.model}` : ""}</p>
                        </td>

                        {/* Serial number */}
                        <td className="p-4 font-mono text-white/60">
                          {w.serial_number || "—"}
                        </td>

                        {/* Installation Date */}
                        <td className="p-4 whitespace-nowrap">
                          {new Date(w.installation_date).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                        </td>

                        {/* Warranty Expiration */}
                        <td className="p-4 whitespace-nowrap">
                          <div className="flex items-center gap-1.5">
                            <span>
                              {new Date(w.warranty_expires).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                            </span>
                            {expiring && (
                              <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" title="Expiring soon!" />
                            )}
                          </div>
                          <p className="text-[10px] text-muted-foreground mt-0.5">{w.warranty_months} Months</p>
                        </td>

                        {/* AMC due */}
                        <td className="p-4 whitespace-nowrap">
                          {w.amc_due_date ? (
                            <div className="flex items-center gap-1.5">
                              <span>
                                {new Date(w.amc_due_date).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                              </span>
                              {amcDue && (
                                <span className="h-2 w-2 rounded-full bg-orange-500 animate-pulse" title="AMC Renewal Due!" />
                              )}
                            </div>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </td>

                        {/* Status Badge */}
                        <td className="p-4 whitespace-nowrap">
                          <span className={cn(
                            "px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider",
                            {
                              "bg-green-500/10 text-green-400 border border-green-500/20": w.status === "active",
                              "bg-red-500/10 text-red-400 border border-red-500/20": w.status === "expired",
                              "bg-orange-500/10 text-orange-400 border border-orange-500/20": w.status === "amc_due",
                              "bg-white/10 text-white/40 border border-white/5": w.status === "amc_completed"
                            }
                          )}>
                            {w.status.replace("_", " ")}
                          </span>
                        </td>

                        {/* Technician */}
                        <td className="p-4 text-muted-foreground whitespace-nowrap">
                          {w.technician_name || "—"}
                        </td>

                        {/* Edit Action */}
                        <td className="p-4 text-center">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => handleOpenEdit(w)}
                            className="h-8 w-8 p-0 border-white/5 hover:bg-white/5 hover:text-accent rounded-lg"
                          >
                            <Edit3 className="h-3.5 w-3.5" />
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* SLIDE OVER PANEL DRAWER SHEET */}
      {isDrawerOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden bg-black/45 backdrop-blur-sm flex justify-end">
          <div 
            className="fixed inset-0" 
            onClick={() => setIsDrawerOpen(false)} 
          />
          
          <div className="relative w-full max-w-lg bg-[#0e0e0e] border-l border-white/10 h-full shadow-2xl flex flex-col justify-between overflow-y-auto animate-in slide-in-from-right duration-300">
            {/* Drawer Header */}
            <div className="p-6 border-b border-white/5 flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-foreground">
                  {editingWarranty ? "Edit Warranty Details" : "Register Product Warranty"}
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {editingWarranty ? "Update client status and dates" : "Fill in setup details to save"}
                </p>
              </div>
              <button 
                onClick={() => setIsDrawerOpen(false)}
                className="rounded-full bg-white/5 p-2 text-white hover:bg-white/10 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Drawer Form Body */}
            <form onSubmit={handleSubmit} className="flex-1 p-6 space-y-5 overflow-y-auto">
              
              {/* Customer Section */}
              <div className="space-y-4">
                <h3 className="text-[10px] font-black uppercase tracking-widest text-accent">Customer Information</h3>
                <div className="space-y-3">
                  <div>
                    <label className="flex items-center gap-1.5 text-[9px] font-bold text-muted-foreground uppercase tracking-widest mb-1.5">
                      <User className="h-3 w-3" /> Customer Name <span className="text-red-500">*</span>
                    </label>
                    <Input 
                      required 
                      value={form.customer_name} 
                      onChange={(e) => setForm(prev => ({ ...prev, customer_name: e.target.value }))}
                      placeholder="e.g. Ramesh Kumar"
                      className="border-white/5 bg-white/[0.01] text-sm"
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="flex items-center gap-1.5 text-[9px] font-bold text-muted-foreground uppercase tracking-widest mb-1.5">
                        <Phone className="h-3 w-3" /> Contact Phone
                      </label>
                      <Input 
                        value={form.customer_phone} 
                        onChange={(e) => setForm(prev => ({ ...prev, customer_phone: e.target.value }))}
                        placeholder="9876543210"
                        className="border-white/5 bg-white/[0.01] text-sm font-mono"
                      />
                    </div>
                    <div>
                      <label className="flex items-center gap-1.5 text-[9px] font-bold text-muted-foreground uppercase tracking-widest mb-1.5">
                        <MapPin className="h-3 w-3" /> Address Location
                      </label>
                      <Input 
                        value={form.customer_address} 
                        onChange={(e) => setForm(prev => ({ ...prev, customer_address: e.target.value }))}
                        placeholder="Phase 1, Bangalore"
                        className="border-white/5 bg-white/[0.01] text-sm"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Product Section */}
              <div className="space-y-4 border-t border-white/5 pt-4">
                <h3 className="text-[10px] font-black uppercase tracking-widest text-accent">Product & Device Specs</h3>
                <div className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="flex items-center gap-1.5 text-[9px] font-bold text-muted-foreground uppercase tracking-widest mb-1.5">
                        <Tag className="h-3 w-3" /> Product Name <span className="text-red-500">*</span>
                      </label>
                      <Input 
                        required 
                        value={form.product_name} 
                        onChange={(e) => setForm(prev => ({ ...prev, product_name: e.target.value }))}
                        placeholder="e.g. Stiebel Eltron Heater"
                        className="border-white/5 bg-white/[0.01] text-sm"
                      />
                    </div>
                    <div>
                      <label className="flex items-center gap-1.5 text-[9px] font-bold text-muted-foreground uppercase tracking-widest mb-1.5">
                        Brand Manufacturer
                      </label>
                      <Input 
                        value={form.brand} 
                        onChange={(e) => setForm(prev => ({ ...prev, brand: e.target.value }))}
                        placeholder="Stiebel Eltron"
                        className="border-white/5 bg-white/[0.01] text-sm"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="flex items-center gap-1.5 text-[9px] font-bold text-muted-foreground uppercase tracking-widest mb-1.5">
                        Model / Variant Name
                      </label>
                      <Input 
                        value={form.model} 
                        onChange={(e) => setForm(prev => ({ ...prev, model: e.target.value }))}
                        placeholder="e.g. DHX 12"
                        className="border-white/5 bg-white/[0.01] text-sm"
                      />
                    </div>
                    <div>
                      <label className="flex items-center gap-1.5 text-[9px] font-bold text-muted-foreground uppercase tracking-widest mb-1.5">
                        <Hash className="h-3 w-3" /> Serial Number
                      </label>
                      <Input 
                        value={form.serial_number} 
                        onChange={(e) => setForm(prev => ({ ...prev, serial_number: e.target.value }))}
                        placeholder="SN-1234567890"
                        className="border-white/5 bg-white/[0.01] text-sm font-mono"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Warranty & Service Dates Section */}
              <div className="space-y-4 border-t border-white/5 pt-4">
                <h3 className="text-[10px] font-black uppercase tracking-widest text-accent">Warranty & Service Dates</h3>
                <div className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="flex items-center gap-1.5 text-[9px] font-bold text-muted-foreground uppercase tracking-widest mb-1.5">
                        <Calendar className="h-3 w-3" /> Installation Date <span className="text-red-500">*</span>
                      </label>
                      <Input 
                        type="date" 
                        required
                        value={form.installation_date} 
                        onChange={(e) => setForm(prev => ({ ...prev, installation_date: e.target.value }))}
                        className="border-white/5 bg-[#121212] text-sm"
                      />
                    </div>
                    <div>
                      <label className="flex items-center gap-1.5 text-[9px] font-bold text-muted-foreground uppercase tracking-widest mb-1.5">
                        Warranty Duration (Months)
                      </label>
                      <Input 
                        type="number" 
                        value={form.warranty_months} 
                        onChange={(e) => setForm(prev => ({ ...prev, warranty_months: parseInt(e.target.value) || 12 }))}
                        className="border-white/5 bg-white/[0.01] text-sm"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="flex items-center gap-1.5 text-[9px] font-bold text-muted-foreground uppercase tracking-widest mb-1.5">
                        AMC Next Due Date
                      </label>
                      <Input 
                        type="date" 
                        value={form.amc_due_date} 
                        onChange={(e) => setForm(prev => ({ ...prev, amc_due_date: e.target.value }))}
                        className="border-white/5 bg-[#121212] text-sm"
                      />
                    </div>
                    <div>
                      <label className="flex items-center gap-1.5 text-[9px] font-bold text-muted-foreground uppercase tracking-widest mb-1.5">
                        AMC Valuation (₹)
                      </label>
                      <Input 
                        type="number" 
                        placeholder="₹ amc amount"
                        value={form.amc_amount} 
                        onChange={(e) => setForm(prev => ({ ...prev, amc_amount: e.target.value }))}
                        className="border-white/5 bg-white/[0.01] text-sm"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="flex items-center gap-1.5 text-[9px] font-bold text-muted-foreground uppercase tracking-widest mb-1.5">
                        Assigned Technician
                      </label>
                      <Input 
                        value={form.technician_name} 
                        onChange={(e) => setForm(prev => ({ ...prev, technician_name: e.target.value }))}
                        placeholder="Technician Name"
                        className="border-white/5 bg-white/[0.01] text-sm"
                      />
                    </div>
                    <div>
                      <label className="flex items-center gap-1.5 text-[9px] font-bold text-muted-foreground uppercase tracking-widest mb-1.5">
                        Warranty status
                      </label>
                      <select 
                        value={form.status}
                        onChange={(e) => setForm(prev => ({ ...prev, status: e.target.value as Warranty["status"] }))}
                        className="h-12 w-full rounded-xl border border-white/5 bg-[#121212] px-4 text-sm text-foreground focus:border-accent focus:outline-none appearance-none"
                      >
                        <option value="active">Active</option>
                        <option value="expired">Expired</option>
                        <option value="amc_due">AMC Due</option>
                        <option value="amc_completed">AMC Completed</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="flex items-center gap-1.5 text-[9px] font-bold text-muted-foreground uppercase tracking-widest mb-1.5">
                      Notes & Comments
                    </label>
                    <textarea 
                      className="w-full rounded-xl border border-white/5 bg-white/[0.01] p-3 text-sm text-foreground placeholder:text-white/20 focus:border-accent focus:outline-none resize-none"
                      rows={3}
                      value={form.notes}
                      onChange={(e) => setForm(prev => ({ ...prev, notes: e.target.value }))}
                      placeholder="Special instructions or service notes..."
                    />
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 flex gap-3">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsDrawerOpen(false)}
                  className="flex-1 border-white/5 text-muted-foreground hover:bg-white/5"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  className="flex-1 bg-accent text-white"
                >
                  {editingWarranty ? "Save Changes" : "Register Product"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
