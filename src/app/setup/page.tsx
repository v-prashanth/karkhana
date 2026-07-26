"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  Building2,
  MapPin,
  Phone,
  Mail,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Wrench,
  Factory,
  Truck,
  Store,
  Printer,
  Briefcase,
  Sparkles,
  Loader2
} from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { useStore } from "@/store/useStore";
import { useToast } from "@/components/ui/Toaster";
import { organizationApi } from "@/lib/api/organization";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { BUSINESS_TYPES as SPECIALIZED_BUSINESS_TYPES, getBusinessType } from "@/lib/business-types";

const BUSINESS_TYPES = [
  { id: "manufacturing", label: "Manufacturing", icon: Factory, desc: "CNC, Fabrication, Job Shop" },
  { id: "trading", label: "Trading", icon: Store, desc: "Wholesale, Distribution" },
  { id: "auto_repair", label: "Auto / Repair", icon: Wrench, desc: "Garage, Service Center" },
  { id: "printing", label: "Printing", icon: Printer, desc: "Press, Packaging" },
  { id: "services", label: "Services", icon: Briefcase, desc: "Consulting, IT, Agency" },
  { id: "custom", label: "Other", icon: Truck, desc: "Transport, Logistics, etc." },
];

const CAPABILITY_SUGGESTIONS: Record<string, string[]> = {
  manufacturing: ["CNC Machining", "Fabrication", "Sheet Metal", "Casting", "Turning", "Milling", "Welding", "Heat Treatment", "Surface Grinding", "Assembly"],
  trading: ["Wholesale", "Distribution", "B2B Sales", "Import/Export", "Inventory Management"],
  auto_repair: ["Engine Repair", "Body Work", "Painting", "Electrical", "AC Service", "Diagnostics"],
  printing: ["Offset Printing", "Digital Printing", "Screen Printing", "Packaging", "Label Printing"],
  services: ["Consulting", "IT Services", "Design", "Installation", "Maintenance"],
  custom: ["Logistics", "Transport", "Warehousing", "Courier", "Cold Storage"],
  // Specialized business types
  water_heating: ["Geysers", "Heat Pumps", "Solar Heaters", "Plumbing", "Water Treatment", "Pressure Pumps", "Maintenance Services"],
  solar: ["Solar Panels", "Solar Inverters", "Battery Storage", "Net Metering", "Solar Pumps", "Annual Maintenance"],
  hvac: ["AC Installation", "Split AC", "Cassette AC", "Ducting", "VRF Systems", "Chillers", "Routine Service", "Gas Charging"],
  interior: ["Space Planning", "Modular Kitchen", "Wardrobes", "Civil Work", "False Ceiling", "Electrical Work", "Painting", "Woodwork"],
  machine_shop: ["CNC Turning", "Milling", "VMC Machining", "Sheet Metal", "Welding", "Fabrication", "Surface Grinding", "Quality Inspection"],
  electrical: ["House Wiring", "Industrial Wiring", "LT Panels", "Earthing", "Lighting Control", "UPS Systems", "DB Dressing"],
  generic_service: ["Installation", "Maintenance", "Consulting", "Repair", "Fabrication", "Assembly"],
};

const EMPLOYEE_RANGES = ["1-5", "6-15", "16-50", "51-200", "200+"];

export default function SetupWizardPage() {
  const router = useRouter();
  const { organization, setOrganization } = useStore();
  const { toast } = useToast();
  const supabase = createClient();

  const [step, setStep] = useState(1);
  const [selectedSpecType, setSelectedSpecType] = useState<string>("generic_service");
  const [isSavingStep1, setIsSavingStep1] = useState(false);

  const [form, setForm] = useState({
    name: "",
    owner_name: "",
    phone: "",
    email: "",
    address: "",
    gstin: "",
    business_type: "generic_service",
    tagline: "",
    capabilities: [] as string[],
    year_established: "",
    employee_count: "",
  });

  // Pre-fill from existing org data
  useEffect(() => {
    if (!organization) return;
    const dbType = organization.business_type || "generic_service";
    setSelectedSpecType(dbType);
    setForm((prev) => ({
      ...prev,
      name: organization.name === "My Business" ? "" : organization.name || "",
      owner_name: organization.owner_name || "",
      phone: organization.phone || "",
      email: organization.email || "",
      address: organization.address || "",
      gstin: organization.gstin || "",
      business_type: dbType,
      tagline: organization.tagline || "",
      capabilities: organization.capabilities || [],
      year_established: organization.year_established?.toString() || "",
      employee_count: organization.employee_count || "",
    }));
  }, [organization]);

  const saveProfile = useMutation({
    mutationFn: () =>
      organizationApi.update({
        ...form,
        business_type: form.business_type as any, // Temporary cast until types fully merged
        year_established: form.year_established ? parseInt(form.year_established as string) : null,
        profile_complete: true,
      }),
    onSuccess: (nextOrg) => {
      setOrganization(nextOrg);
      toast("Profile saved! You're on the network.", "success");
      router.push("/home");
    },
    onError: (err: Error) => toast(err.message, "error"),
  });

  const toggleCapability = (cap: string) => {
    setForm((prev) => ({
      ...prev,
      capabilities: prev.capabilities.includes(cap)
        ? prev.capabilities.filter((c) => c !== cap)
        : [...prev.capabilities, cap],
    }));
  };

  // Step 1 Submit (Save specialized business type)
  const handleStep1Submit = async () => {
    if (!organization?.id) {
      toast("Workspace session missing", "error");
      return;
    }
    setIsSavingStep1(true);
    try {
      const { error } = await supabase
        .from("organizations")
        .update({ business_type: selectedSpecType })
        .eq("id", organization.id);

      if (error) throw error;
      
      // Sync local form state and Zustand organization store
      setForm(prev => ({ ...prev, business_type: selectedSpecType }));
      setOrganization({ ...organization, business_type: selectedSpecType as any });

      setStep(2);
    } catch (err: any) {
      toast(err.message || "Failed to save business category", "error");
    } finally {
      setIsSavingStep1(false);
    }
  };

  const totalSteps = 4;
  const progress = (step / totalSteps) * 100;

  return (
    <main className="min-h-screen bg-background relative overflow-hidden">
      {/* Background */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[400px] bg-gradient-to-b from-accent/8 to-transparent pointer-events-none" />

      {/* Progress Bar */}
      <div className="fixed top-0 left-0 right-0 h-1 bg-white/5 z-50">
        <motion.div
          className="h-full bg-accent"
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>

      <div className="max-w-2xl mx-auto px-5 pt-16 pb-24 relative z-10">
        {/* Header */}
        <div className="text-center mb-10">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="h-16 w-16 rounded-3xl bg-accent/10 flex items-center justify-center mx-auto mb-4 border border-accent/20"
          >
            <Sparkles className="h-8 w-8 text-accent" />
          </motion.div>
          <h1 className="text-3xl font-black text-white uppercase italic tracking-tight">
            Set Up Your Business
          </h1>
          <p className="text-sm text-muted-foreground mt-2">
            Step {step} of {totalSteps} — {step === 1 ? "Business Type" : step === 2 ? "Identity" : step === 3 ? "Industry" : "Finish"}
          </p>
        </div>

        <AnimatePresence mode="wait">
          {/* STEP 1: Specialized Business Type Grid */}
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              className="space-y-5"
            >
              <Card className="border-white/5 bg-white/[0.02]">
                <CardContent className="p-6 space-y-6">
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-[#888] mb-3 block">
                      What kind of business are you?
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {SPECIALIZED_BUSINESS_TYPES.map((bt) => (
                        <button
                          type="button"
                          key={bt.id}
                          onClick={() => setSelectedSpecType(bt.id)}
                          className={cn(
                            "p-4 rounded-2xl border text-left transition-all flex items-start gap-3",
                            selectedSpecType === bt.id
                              ? "border-accent bg-accent/10 text-accent"
                              : "border-white/5 bg-white/[0.01] text-muted-foreground hover:bg-white/[0.03]"
                          )}
                        >
                          <span className="text-2xl mt-0.5">{bt.icon}</span>
                          <div>
                            <p className="text-sm font-bold text-white">{bt.label}</p>
                            <p className="text-[10px] opacity-60 mt-0.5">{bt.description}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Modules listing */}
                  {selectedSpecType && (
                    <div className="p-4 rounded-2xl border border-accent/20 bg-accent/[0.02] space-y-3">
                      <p className="text-[10px] font-black uppercase tracking-widest text-accent">Your workspace will include:</p>
                      <div className="flex flex-wrap gap-1.5">
                        {getBusinessType(selectedSpecType as any).modules.map((mod) => (
                          <span key={mod} className="px-2 py-0.5 rounded-full bg-accent/10 text-[9px] font-black uppercase tracking-wider text-accent border border-accent/20">
                            {mod.replace("_", " ")}
                          </span>
                        ))}
                      </div>
                      <div className="pt-2 border-t border-white/5 text-[10px] text-muted-foreground">
                        <span className="font-bold text-white uppercase tracking-wider">Workflow:</span> {getBusinessType(selectedSpecType as any).primaryWorkflow}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Button
                onClick={handleStep1Submit}
                disabled={isSavingStep1 || !selectedSpecType}
                className="w-full h-14 rounded-2xl bg-accent text-white font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2"
              >
                {isSavingStep1 ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    Continue <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </Button>
            </motion.div>
          )}

          {/* STEP 2: Business Identity (Old Step 1) */}
          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              className="space-y-5"
            >
              <Card className="border-white/5 bg-white/[0.02]">
                <CardContent className="p-6 space-y-5">
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-[#888] mb-2 block">
                      <Building2 className="h-3 w-3 inline mr-1.5 -mt-0.5" />
                      Business / Company Name
                    </label>
                    <Input
                      placeholder="e.g. Sri Vigneshwara Engineering Works"
                      value={form.name}
                      onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                      className="h-14 text-base"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-[#888] mb-2 block">
                      Owner / Proprietor Name
                    </label>
                    <Input
                      placeholder="e.g. Rajesh Kumar"
                      value={form.owner_name}
                      onChange={(e) => setForm((p) => ({ ...p, owner_name: e.target.value }))}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-black uppercase tracking-widest text-[#888] mb-2 block">
                        <Phone className="h-3 w-3 inline mr-1.5 -mt-0.5" />
                        Phone
                      </label>
                      <Input
                        placeholder="9876543210"
                        value={form.phone}
                        onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-black uppercase tracking-widest text-[#888] mb-2 block">
                        <Mail className="h-3 w-3 inline mr-1.5 -mt-0.5" />
                        Email
                      </label>
                      <Input
                        placeholder="info@business.com"
                        value={form.email}
                        onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-[#888] mb-2 block">
                      <MapPin className="h-3 w-3 inline mr-1.5 -mt-0.5" />
                      Address
                    </label>
                    <textarea
                      className="w-full rounded-xl border border-white/10 bg-background/80 px-4 py-3 text-sm text-foreground outline-none focus:border-accent"
                      rows={3}
                      placeholder="Full business address"
                      value={form.address}
                      onChange={(e) => setForm((p) => ({ ...p, address: e.target.value }))}
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-[#888] mb-2 block">
                      GSTIN (optional)
                    </label>
                    <Input
                      placeholder="27AAACR1234A1Z1"
                      value={form.gstin}
                      onChange={(e) => setForm((p) => ({ ...p, gstin: e.target.value.toUpperCase() }))}
                      className="font-mono uppercase"
                    />
                  </div>
                </CardContent>
              </Card>

              <div className="flex gap-3">
                <Button
                  onClick={() => setStep(1)}
                  variant="outline"
                  className="flex-1 h-14 rounded-2xl border-white/10 uppercase text-xs font-black tracking-widest"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" /> Back
                </Button>
                <Button
                  onClick={() => setStep(3)}
                  disabled={!form.name || !form.owner_name}
                  className="flex-[2] h-14 rounded-2xl bg-accent text-white font-black uppercase tracking-widest text-xs"
                >
                  Next: Your Industry <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </motion.div>
          )}

          {/* STEP 3: Industry & Capabilities (Old Step 2) */}
          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              className="space-y-5"
            >
              <Card className="border-white/5 bg-white/[0.02]">
                <CardContent className="p-6 space-y-6">
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-[#888] mb-3 block">
                      What kind of business?
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      {BUSINESS_TYPES.map((bt) => (
                        <button
                          type="button"
                          key={bt.id}
                          onClick={() => setForm((p) => ({ ...p, business_type: bt.id, capabilities: [] }))}
                          className={cn(
                            "p-4 rounded-2xl border text-left transition-all",
                            form.business_type === bt.id
                              ? "border-accent bg-accent/10 text-accent"
                              : "border-white/5 bg-white/[0.01] text-muted-foreground hover:bg-white/[0.03]"
                          )}
                        >
                          <bt.icon className="h-5 w-5 mb-2" />
                          <p className="text-sm font-bold">{bt.label}</p>
                          <p className="text-[10px] opacity-60">{bt.desc}</p>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-[#888] mb-3 block">
                      Your Capabilities (select all that apply)
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {(CAPABILITY_SUGGESTIONS[form.business_type] || []).map((cap) => (
                        <button
                          type="button"
                          key={cap}
                          onClick={() => toggleCapability(cap)}
                          className={cn(
                            "px-3 py-1.5 rounded-full text-xs font-bold transition-all border",
                            form.capabilities.includes(cap)
                              ? "bg-accent/10 text-accent border-accent/30"
                              : "bg-white/[0.02] text-muted-foreground border-white/5 hover:border-white/10"
                          )}
                        >
                          {form.capabilities.includes(cap) && <CheckCircle2 className="h-3 w-3 inline mr-1 -mt-0.5" />}
                          {cap}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-[#888] mb-2 block">
                      Tagline (optional)
                    </label>
                    <Input
                      placeholder="e.g. Precision machining for 25 years"
                      value={form.tagline}
                      onChange={(e) => setForm((p) => ({ ...p, tagline: e.target.value }))}
                    />
                  </div>
                </CardContent>
              </Card>

              <div className="flex gap-3">
                <Button
                  onClick={() => setStep(2)}
                  variant="outline"
                  className="flex-1 h-14 rounded-2xl border-white/10 uppercase text-xs font-black tracking-widest"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" /> Back
                </Button>
                <Button
                  onClick={() => setStep(4)}
                  className="flex-[2] h-14 rounded-2xl bg-accent text-white font-black uppercase tracking-widest text-xs"
                >
                  Next: Final Details <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </motion.div>
          )}

          {/* STEP 4: Final Details & Save (Old Step 3) */}
          {step === 4 && (
            <motion.div
              key="step4"
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              className="space-y-5"
            >
              <Card className="border-white/5 bg-white/[0.02]">
                <CardContent className="p-6 space-y-5">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-black uppercase tracking-widest text-[#888] mb-2 block">
                        Year Established
                      </label>
                      <Input
                        type="number"
                        placeholder="e.g. 1998"
                        value={form.year_established}
                        onChange={(e) => setForm((p) => ({ ...p, year_established: e.target.value }))}
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-black uppercase tracking-widest text-[#888] mb-2 block">
                        Team Size
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {EMPLOYEE_RANGES.map((range) => (
                          <button
                            type="button"
                            key={range}
                            onClick={() => setForm((p) => ({ ...p, employee_count: range }))}
                            className={cn(
                              "px-3 py-2 rounded-xl text-xs font-bold border transition-all",
                              form.employee_count === range
                                ? "bg-accent/10 text-accent border-accent/30"
                                : "bg-white/[0.02] text-muted-foreground border-white/5"
                            )}
                          >
                            {range}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Preview Card */}
              <Card className="border-accent/20 bg-accent/5 overflow-hidden">
                <CardContent className="p-6">
                  <p className="text-[10px] font-black uppercase tracking-widest text-accent mb-4">Profile Preview</p>
                  <div className="flex items-center gap-4 mb-4">
                    <div className="h-14 w-14 rounded-2xl bg-accent/20 flex items-center justify-center border border-accent/30">
                      <Building2 className="h-7 w-7 text-accent" />
                    </div>
                    <div>
                      <p className="text-lg font-black text-white uppercase italic tracking-tight">{form.name || "Your Business"}</p>
                      <p className="text-xs text-muted-foreground italic">{form.tagline || form.business_type}</p>
                    </div>
                  </div>
                  {form.capabilities.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-3">
                      {form.capabilities.slice(0, 5).map((c) => (
                        <span key={c} className="px-2 py-0.5 rounded-full bg-white/5 text-[10px] font-bold text-accent/80 border border-white/5">
                          {c}
                        </span>
                      ))}
                      {form.capabilities.length > 5 && (
                        <span className="px-2 py-0.5 text-[10px] text-muted-foreground">+{form.capabilities.length - 5} more</span>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>

              <div className="flex gap-3">
                <Button
                  onClick={() => setStep(3)}
                  variant="outline"
                  className="flex-1 h-14 rounded-2xl border-white/10 uppercase text-xs font-black tracking-widest"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" /> Back
                </Button>
                <Button
                  onClick={() => saveProfile.mutate()}
                  disabled={saveProfile.isPending || !form.name}
                  className="flex-[2] h-14 rounded-2xl bg-white text-black font-black uppercase tracking-widest text-xs"
                >
                  {saveProfile.isPending ? "Saving..." : "Launch My Profile"} <CheckCircle2 className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Skip */}
        <div className="text-center mt-8">
          <button
            onClick={() => router.push("/home")}
            className="text-xs text-muted-foreground hover:text-white transition-colors uppercase tracking-widest font-bold"
          >
            Skip for now
          </button>
        </div>
      </div>
    </main>
  );
}
