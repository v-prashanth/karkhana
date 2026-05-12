"use client";

import { useEffect, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import {
  Building2, FileText, ImageIcon, Save, Users, ShieldCheck,
  CreditCard, Bell, Globe, Lock, Trash2, ChevronRight,
  Palette, Hash, Receipt, Banknote, QrCode, Pen,
  Mail, Phone, MapPin, Award, Factory, Calendar
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { PageHeader } from "@/components/shared/PageHeader";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { useStore } from "@/store/useStore";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/Toaster";
import { organizationApi } from "@/lib/api/organization";
import { cn } from "@/lib/utils";

type Tab = "general" | "branding" | "billing" | "security";

const tabs: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: "general", label: "General", icon: Building2 },
  { id: "branding", label: "Branding", icon: Palette },
  { id: "billing", label: "Billing", icon: Receipt },
  { id: "security", label: "Security", icon: Lock },
];

const templateOptions = [
  { id: "modern", label: "Modern", desc: "Clean lines, bold colors" },
  { id: "classic", label: "Classic", desc: "Traditional, formal layout" },
  { id: "compact", label: "Compact", desc: "Space-efficient, dense" },
  { id: "industrial", label: "Industrial", desc: "Heavy-duty, workshop style" },
];

export default function SettingsPage() {
  const router = useRouter();
  const { organization, logout, setOrganization, user } = useStore();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<Tab>("general");
  const [form, setForm] = useState({
    name: "", owner_name: "", address: "", phone: "", email: "",
    gstin: "", logo_url: "", tagline: "",
    capabilities: [] as string[], year_established: "", employee_count: "",
    brand_primary_color: "#ff7a1a", brand_secondary_color: "#171717",
    document_template: "modern",
    footer_text: "Managed with Karkhana | karkhana.app",
    signature_name: "", bank_details: "", upi_id: "",
    invoice_prefix: "INV", invoice_counter: 1,
    dc_prefix: "DC", dc_counter: 1,
  });

  useEffect(() => {
    if (!organization) return;
    setForm({
      name: organization.name || "",
      owner_name: organization.owner_name || "",
      address: organization.address || "",
      phone: organization.phone || "",
      email: organization.email || "",
      gstin: organization.gstin || "",
      logo_url: organization.logo_url || "",
      tagline: organization.tagline || "",
      capabilities: organization.capabilities || [],
      year_established: organization.year_established?.toString() || "",
      employee_count: organization.employee_count || "",
      brand_primary_color: organization.brand_primary_color || "#ff7a1a",
      brand_secondary_color: organization.brand_secondary_color || "#171717",
      document_template: organization.document_template || "modern",
      footer_text: organization.footer_text || "Managed with Karkhana | karkhana.app",
      signature_name: organization.signature_name || "",
      bank_details: organization.bank_details || "",
      upi_id: organization.upi_id || "",
      invoice_prefix: organization.invoice_prefix || "INV",
      invoice_counter: organization.invoice_counter || 1,
      dc_prefix: organization.dc_prefix || "DC",
      dc_counter: organization.dc_counter || 1,
    });
  }, [organization]);

  const saveSettings = useMutation({
    mutationFn: () => organizationApi.update({
      ...form,
      year_established: form.year_established ? parseInt(form.year_established) : null,
    }),
    onSuccess: (next) => { setOrganization(next); toast("Settings saved", "success"); },
    onError: (e: Error) => toast(e.message, "error"),
  });

  const set = (key: string, val: string | number | string[]) =>
    setForm((p) => ({ ...p, [key]: val }));

  return (
    <main className="min-h-screen bg-background pb-24">
      <PageHeader title="Settings" subtitle="Manage your workspace" />

      {/* Tab Bar */}
      <div className="sticky top-0 z-20 bg-background/95 backdrop-blur-xl border-b border-white/5">
        <div className="flex gap-1 px-5 xl:px-8 py-2 overflow-x-auto no-scrollbar">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap",
                activeTab === tab.id
                  ? "bg-white/10 text-white"
                  : "text-white/40 hover:text-white/70 hover:bg-white/5"
              )}
            >
              <tab.icon className="h-3.5 w-3.5" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-5 xl:px-8 py-6 space-y-8">
        {/* ═══ GENERAL TAB ═══ */}
        {activeTab === "general" && (
          <>
            <SettingsSection
              icon={Building2} title="Business Information"
              description="Your legal business details. These appear on invoices and documents."
            >
              <FieldGroup label="Business Name" required>
                <Input value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="e.g. Sri Vigneshwara Engineering" />
              </FieldGroup>
              <FieldGroup label="Owner / Proprietor">
                <Input value={form.owner_name} onChange={(e) => set("owner_name", e.target.value)} placeholder="e.g. Rajesh Kumar" />
              </FieldGroup>
              <div className="grid grid-cols-2 gap-4">
                <FieldGroup label="Phone" icon={Phone}>
                  <Input value={form.phone} onChange={(e) => set("phone", e.target.value)} placeholder="9876543210" />
                </FieldGroup>
                <FieldGroup label="Email" icon={Mail}>
                  <Input value={form.email} onChange={(e) => set("email", e.target.value)} placeholder="info@business.com" />
                </FieldGroup>
              </div>
              <FieldGroup label="Address" icon={MapPin}>
                <textarea
                  className="w-full rounded-xl border border-white/10 bg-white/[0.02] p-3 text-sm text-foreground placeholder:text-white/20 focus:border-accent focus:outline-none resize-none"
                  rows={3} value={form.address}
                  onChange={(e) => set("address", e.target.value)}
                  placeholder="Full business address"
                />
              </FieldGroup>
              <FieldGroup label="GSTIN">
                <Input value={form.gstin} onChange={(e) => set("gstin", e.target.value.toUpperCase())} placeholder="27AAACR1234A1Z1" className="font-mono uppercase" />
              </FieldGroup>
            </SettingsSection>

            <SettingsSection
              icon={Factory} title="Industry Profile"
              description="Help customers and the Karkhana network understand your capabilities."
            >
              <div className="grid grid-cols-2 gap-4">
                <FieldGroup label="Year Established" icon={Calendar}>
                  <Input type="number" value={form.year_established} onChange={(e) => set("year_established", e.target.value)} placeholder="e.g. 1998" />
                </FieldGroup>
                <FieldGroup label="Team Size" icon={Users}>
                  <Input value={form.employee_count} onChange={(e) => set("employee_count", e.target.value)} placeholder="e.g. 6-15" />
                </FieldGroup>
              </div>
              <FieldGroup label="Tagline">
                <Input value={form.tagline} onChange={(e) => set("tagline", e.target.value)} placeholder="e.g. Precision machining for 25 years" />
              </FieldGroup>
              <FieldGroup label="Capabilities">
                <Input
                  value={form.capabilities.join(", ")}
                  onChange={(e) => set("capabilities", e.target.value.split(",").map(s => s.trim()).filter(Boolean))}
                  placeholder="CNC, Fabrication, Turning (comma separated)"
                />
              </FieldGroup>
            </SettingsSection>

            <SettingsSection icon={Globe} title="Appearance" description="Switch between light and dark modes.">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-foreground">Theme</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Light mode for daytime, dark for focused work</p>
                </div>
                <ThemeToggle />
              </div>
            </SettingsSection>
          </>
        )}

        {/* ═══ BRANDING TAB ═══ */}
        {activeTab === "branding" && (
          <>
            <SettingsSection
              icon={Palette} title="Brand Colors"
              description="These colors appear on your invoices, DCs, and shared documents."
            >
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 block">Primary Color</label>
                  <div className="flex gap-3 items-center">
                    <input type="color" value={form.brand_primary_color}
                      onChange={(e) => set("brand_primary_color", e.target.value)}
                      className="h-12 w-14 rounded-xl border border-white/10 bg-transparent cursor-pointer" />
                    <Input value={form.brand_primary_color} onChange={(e) => set("brand_primary_color", e.target.value)} className="font-mono text-xs" />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 block">Secondary Color</label>
                  <div className="flex gap-3 items-center">
                    <input type="color" value={form.brand_secondary_color}
                      onChange={(e) => set("brand_secondary_color", e.target.value)}
                      className="h-12 w-14 rounded-xl border border-white/10 bg-transparent cursor-pointer" />
                    <Input value={form.brand_secondary_color} onChange={(e) => set("brand_secondary_color", e.target.value)} className="font-mono text-xs" />
                  </div>
                </div>
              </div>
            </SettingsSection>

            <SettingsSection
              icon={FileText} title="Document Template"
              description="Choose how your invoices and challans look."
            >
              <div className="grid grid-cols-2 gap-3">
                {templateOptions.map((opt) => (
                  <button key={opt.id} type="button"
                    onClick={() => set("document_template", opt.id)}
                    className={cn(
                      "rounded-2xl border p-4 text-left transition-all",
                      form.document_template === opt.id
                        ? "border-accent bg-accent/10 ring-1 ring-accent/30"
                        : "border-white/5 bg-white/[0.01] hover:bg-white/[0.03]"
                    )}
                  >
                    <p className={cn("text-sm font-bold", form.document_template === opt.id ? "text-accent" : "text-foreground")}>{opt.label}</p>
                    <p className="text-[10px] text-muted-foreground mt-1">{opt.desc}</p>
                  </button>
                ))}
              </div>
            </SettingsSection>

            <SettingsSection
              icon={ImageIcon} title="Document Details"
              description="Additional details that appear on your generated documents."
            >
              <FieldGroup label="Logo URL">
                <Input value={form.logo_url} onChange={(e) => set("logo_url", e.target.value)} placeholder="https://your-logo-url.com/logo.png" />
              </FieldGroup>
              <FieldGroup label="Authorized Signatory" icon={Pen}>
                <Input value={form.signature_name} onChange={(e) => set("signature_name", e.target.value)} placeholder="Name that appears on documents" />
              </FieldGroup>
              <FieldGroup label="Document Footer">
                <Input value={form.footer_text} onChange={(e) => set("footer_text", e.target.value)} placeholder="Footer text on invoices" />
              </FieldGroup>
            </SettingsSection>

            {/* Live Preview */}
            <SettingsSection icon={Award} title="Brand Preview" description="How your documents will look.">
              <div className="overflow-hidden rounded-2xl border border-white/10">
                <div className="p-5" style={{ background: `linear-gradient(135deg, ${form.brand_secondary_color}, ${form.brand_primary_color})` }}>
                  <div className="flex items-center gap-4">
                    {form.logo_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={form.logo_url} alt="Logo" className="h-12 w-12 rounded-2xl bg-white/90 object-cover p-1" />
                    ) : (
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 text-white">
                        <Building2 className="h-6 w-6" />
                      </div>
                    )}
                    <div>
                      <p className="text-lg font-bold text-white">{form.name || "Your Business"}</p>
                      <p className="text-xs text-white/80">{form.address || "Business address"}</p>
                    </div>
                  </div>
                </div>
                <div className="bg-background p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[10px] uppercase tracking-widest text-muted-foreground">{form.document_template} template</p>
                      <p className="mt-1 text-lg font-semibold text-foreground">Invoice Preview</p>
                    </div>
                    <div className="rounded-xl px-4 py-2 text-sm font-semibold text-white" style={{ backgroundColor: form.brand_primary_color }}>
                      {form.invoice_prefix}/{String(form.invoice_counter).padStart(3, "0")}
                    </div>
                  </div>
                  <p className="mt-4 text-xs text-muted-foreground">{form.footer_text}</p>
                </div>
              </div>
            </SettingsSection>
          </>
        )}

        {/* ═══ BILLING TAB ═══ */}
        {activeTab === "billing" && (
          <>
            <SettingsSection
              icon={Hash} title="Numbering Sequences"
              description="Auto-incrementing numbers for your invoices and delivery challans."
            >
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-3">
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Invoices</p>
                  <FieldGroup label="Prefix">
                    <Input value={form.invoice_prefix} onChange={(e) => set("invoice_prefix", e.target.value)} className="font-mono" />
                  </FieldGroup>
                  <FieldGroup label="Next Number">
                    <Input type="number" value={form.invoice_counter} onChange={(e) => set("invoice_counter", Number(e.target.value || 1))} className="font-mono text-center" />
                  </FieldGroup>
                  <p className="text-[10px] text-muted-foreground">Next: <span className="font-mono text-foreground">{form.invoice_prefix}/{String(form.invoice_counter).padStart(3, "0")}</span></p>
                </div>
                <div className="space-y-3">
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Delivery Challans</p>
                  <FieldGroup label="Prefix">
                    <Input value={form.dc_prefix} onChange={(e) => set("dc_prefix", e.target.value)} className="font-mono" />
                  </FieldGroup>
                  <FieldGroup label="Next Number">
                    <Input type="number" value={form.dc_counter} onChange={(e) => set("dc_counter", Number(e.target.value || 1))} className="font-mono text-center" />
                  </FieldGroup>
                  <p className="text-[10px] text-muted-foreground">Next: <span className="font-mono text-foreground">{form.dc_prefix}/{String(form.dc_counter).padStart(3, "0")}</span></p>
                </div>
              </div>
            </SettingsSection>

            <SettingsSection
              icon={Banknote} title="Payment Information"
              description="Bank details and UPI ID appear on your invoices for easy payment collection."
            >
              <FieldGroup label="UPI ID" icon={QrCode}>
                <Input value={form.upi_id} onChange={(e) => set("upi_id", e.target.value)} placeholder="business@upi" />
              </FieldGroup>
              <FieldGroup label="Bank Account Details">
                <textarea
                  className="w-full rounded-xl border border-white/10 bg-white/[0.02] p-3 text-sm text-foreground placeholder:text-white/20 focus:border-accent focus:outline-none resize-none"
                  rows={3} value={form.bank_details}
                  onChange={(e) => set("bank_details", e.target.value)}
                  placeholder="Bank Name, A/C No, IFSC Code"
                />
              </FieldGroup>
            </SettingsSection>

            <SettingsSection
              icon={CreditCard} title="Subscription"
              description="Your current plan and usage."
            >
              <div className="flex items-center justify-between p-4 rounded-2xl border border-white/5 bg-white/[0.02]">
                <div>
                  <p className="text-sm font-bold text-foreground capitalize">{organization?.plan || "Free"} Plan</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {organization?.plan === "pro" ? "Unlimited documents & features" : "20 documents/month"}
                  </p>
                </div>
                <Button variant="outline" size="sm" onClick={() => router.push("/settings/billing")}
                  className="border-accent/30 text-accent hover:bg-accent/10">
                  {organization?.plan === "pro" ? "Manage" : "Upgrade"}
                </Button>
              </div>
            </SettingsSection>
          </>
        )}

        {/* ═══ SECURITY TAB ═══ */}
        {activeTab === "security" && (
          <>
            <SettingsSection
              icon={ShieldCheck} title="Verification"
              description="Verify your business to appear as trusted on the Karkhana network."
            >
              <div className="flex items-center justify-between p-4 rounded-2xl border border-white/5 bg-white/[0.02]">
                <div className="flex items-center gap-3">
                  <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center",
                    organization?.is_verified ? "bg-green-500/10 text-green-400" : "bg-amber-500/10 text-amber-400"
                  )}>
                    <ShieldCheck className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-foreground">
                      {organization?.is_verified ? "Verified Business" : "Unverified"}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {organization?.is_verified ? "Your business is verified on the network" : "Get verified to build trust"}
                    </p>
                  </div>
                </div>
                {!organization?.is_verified && (
                  <Button variant="outline" size="sm" onClick={() => router.push("/settings/verification")}
                    className="border-blue-500/30 text-blue-400 hover:bg-blue-500/10">
                    Get Verified
                  </Button>
                )}
              </div>
            </SettingsSection>

            <SettingsSection
              icon={FileText} title="Audit Logs"
              description="Track all actions performed in your workspace."
            >
              <button onClick={() => router.push("/settings/audit-logs")}
                className="w-full flex items-center justify-between p-4 rounded-2xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.04] transition-colors group">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-accent/10 flex items-center justify-center text-accent">
                    <ShieldCheck className="h-5 w-5" />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-bold text-foreground">Enterprise Audit Center</p>
                    <p className="text-xs text-muted-foreground mt-0.5">View login history, document changes, and more</p>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-0.5 transition-transform" />
              </button>
            </SettingsSection>

            <SettingsSection
              icon={Bell} title="Account"
              description="Manage your account and session."
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between p-4 rounded-2xl border border-white/5 bg-white/[0.02]">
                  <div>
                    <p className="text-sm font-semibold text-foreground">{user?.email || user?.phone || "Account"}</p>
                    <p className="text-xs text-muted-foreground mt-0.5 capitalize">{user?.role || "owner"} • {organization?.name}</p>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => router.push("/profile")}
                    className="border-white/10 hover:bg-white/5">
                    Manage Profile
                  </Button>
                </div>
              </div>
            </SettingsSection>

            {/* Danger Zone */}
            <div className="rounded-2xl border border-red-500/20 bg-red-500/[0.03] p-6 space-y-4">
              <div className="flex items-center gap-2">
                <Trash2 className="h-4 w-4 text-red-400" />
                <h3 className="text-sm font-bold text-red-400 uppercase tracking-wider">Danger Zone</h3>
              </div>
              <p className="text-xs text-muted-foreground">These actions are irreversible. Proceed with caution.</p>
              <Button variant="outline"
                className="w-full border-red-500/30 text-red-400 hover:bg-red-500/10 hover:text-red-300"
                onClick={() => { logout(); router.push("/"); }}
              >
                Log Out from this Device
              </Button>
            </div>
          </>
        )}

        {/* Save Button — fixed at bottom */}
        {activeTab !== "security" && (
          <div className="sticky bottom-6 z-30">
            <Button className="w-full h-14 rounded-2xl bg-white text-black font-black uppercase tracking-widest text-xs shadow-[0_8px_32px_rgba(255,255,255,0.1)] hover:bg-white/90"
              onClick={() => saveSettings.mutate()} disabled={saveSettings.isPending}>
              <Save className="mr-2 h-4 w-4" />
              {saveSettings.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        )}
      </div>
    </main>
  );
}

/* ═══ Reusable Components ═══ */

function SettingsSection({ icon: Icon, title, description, children }: {
  icon: React.ElementType; title: string; description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-5">
      <div className="flex items-start gap-3">
        <div className="h-9 w-9 rounded-xl bg-white/5 flex items-center justify-center text-muted-foreground shrink-0 mt-0.5">
          <Icon className="h-4 w-4" />
        </div>
        <div>
          <h2 className="text-sm font-bold text-foreground">{title}</h2>
          <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
        </div>
      </div>
      <Card className="border-white/5 bg-white/[0.01]">
        <CardContent className="p-5 space-y-5">{children}</CardContent>
      </Card>
    </section>
  );
}

function FieldGroup({ label, icon: Icon, required, children }: {
  label: string; icon?: React.ElementType; required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="flex items-center gap-1.5 text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2">
        {Icon && <Icon className="h-3 w-3" />}
        {label}
        {required && <span className="text-accent">*</span>}
      </label>
      {children}
    </div>
  );
}
