"use client";

import { useEffect, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Building2, FileText, ImageIcon, MoonStar, Save, SunMedium, Users } from "lucide-react";
import { Card, CardContent } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { PageHeader } from "@/components/shared/PageHeader";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { useStore } from "@/store/useStore";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/Toaster";
import { organizationApi } from "@/lib/api/organization";

const templateOptions = [
  { id: "modern", label: "Modern" },
  { id: "classic", label: "Classic" },
  { id: "compact", label: "Compact" },
  { id: "industrial", label: "Industrial" },
];

export default function SettingsPage() {
  const router = useRouter();
  const { organization, logout, setOrganization, theme } = useStore();
  const { toast } = useToast();
  const [form, setForm] = useState({
    name: "",
    owner_name: "",
    address: "",
    phone: "",
    email: "",
    gstin: "",
    logo_url: "",
    brand_primary_color: "#ff7a1a",
    brand_secondary_color: "#171717",
    document_template: "modern",
    footer_text: "Managed with Karkhana | karkhana.app",
    signature_name: "",
    bank_details: "",
    upi_id: "",
    invoice_prefix: "INV",
    invoice_counter: 1,
    dc_prefix: "DC",
    dc_counter: 1,
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
    mutationFn: () => organizationApi.update(form),
    onSuccess: (nextOrganization) => {
      setOrganization(nextOrganization);
      toast("Branding and workspace settings saved", "success");
    },
    onError: (error: Error) => toast(error.message, "error"),
  });

  const handleLogout = async () => {
    logout();
    router.push("/");
  };

  return (
    <main className="min-h-screen bg-background pb-24">
      <PageHeader title="Settings" subtitle="Workspace preferences" />

      <div className="space-y-6 p-4">
        <section className="space-y-3">
          <h2 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {theme === "dark" ? <MoonStar className="h-4 w-4" /> : <SunMedium className="h-4 w-4" />} Theme
          </h2>
          <Card className="border-border">
            <CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-semibold text-foreground">Mixed theme experience</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Light mode is best for daytime bookkeeping. Dark mode is great for focused late-hour work.
                </p>
              </div>
              <ThemeToggle />
            </CardContent>
          </Card>
        </section>

        <section className="space-y-3">
          <h2 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            <Building2 className="h-4 w-4" /> Business Profile
          </h2>
          <Card className="border-border">
            <CardContent className="space-y-4 p-4">
              <Input value={form.name} onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))} placeholder="Legal / Business name" />
              <Input value={form.owner_name} onChange={(e) => setForm((prev) => ({ ...prev, owner_name: e.target.value }))} placeholder="Owner / signatory name" />
              <textarea
                className="w-full rounded-md border border-border bg-background p-3 text-sm"
                rows={3}
                value={form.address}
                onChange={(e) => setForm((prev) => ({ ...prev, address: e.target.value }))}
                placeholder="Business address"
              />
              <div className="grid grid-cols-2 gap-4">
                <Input value={form.phone} onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value }))} placeholder="Phone" />
                <Input value={form.email} onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))} placeholder="Email" />
              </div>
              <Input value={form.gstin} onChange={(e) => setForm((prev) => ({ ...prev, gstin: e.target.value }))} placeholder="GSTIN" />
            </CardContent>
          </Card>
        </section>

        <section className="space-y-3">
          <h2 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            <ImageIcon className="h-4 w-4" /> Document Branding
          </h2>
          <Card className="border-border">
            <CardContent className="space-y-4 p-4">
              <Input value={form.logo_url} onChange={(e) => setForm((prev) => ({ ...prev, logo_url: e.target.value }))} placeholder="Logo URL" />
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-xs text-muted-foreground">Primary Color</label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={form.brand_primary_color}
                      onChange={(e) => setForm((prev) => ({ ...prev, brand_primary_color: e.target.value }))}
                      className="h-12 w-14 rounded-lg border border-border bg-background"
                    />
                    <Input value={form.brand_primary_color} onChange={(e) => setForm((prev) => ({ ...prev, brand_primary_color: e.target.value }))} />
                  </div>
                </div>
                <div>
                  <label className="mb-1 block text-xs text-muted-foreground">Secondary Color</label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={form.brand_secondary_color}
                      onChange={(e) => setForm((prev) => ({ ...prev, brand_secondary_color: e.target.value }))}
                      className="h-12 w-14 rounded-lg border border-border bg-background"
                    />
                    <Input value={form.brand_secondary_color} onChange={(e) => setForm((prev) => ({ ...prev, brand_secondary_color: e.target.value }))} />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {templateOptions.map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => setForm((prev) => ({ ...prev, document_template: option.id }))}
                    className={`rounded-xl border px-4 py-3 text-sm font-semibold ${
                      form.document_template === option.id
                        ? "border-accent bg-accent/10 text-accent"
                        : "border-border bg-background text-muted-foreground"
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>

              <Input value={form.signature_name} onChange={(e) => setForm((prev) => ({ ...prev, signature_name: e.target.value }))} placeholder="Signature / authorized signatory" />
              <Input value={form.upi_id} onChange={(e) => setForm((prev) => ({ ...prev, upi_id: e.target.value }))} placeholder="UPI ID (optional)" />
              <textarea
                className="w-full rounded-md border border-border bg-background p-3 text-sm"
                rows={3}
                value={form.bank_details}
                onChange={(e) => setForm((prev) => ({ ...prev, bank_details: e.target.value }))}
                placeholder="Bank details / account details"
              />
              <textarea
                className="w-full rounded-md border border-border bg-background p-3 text-sm"
                rows={2}
                value={form.footer_text}
                onChange={(e) => setForm((prev) => ({ ...prev, footer_text: e.target.value }))}
                placeholder="Document footer text"
              />

              <div className="overflow-hidden rounded-3xl border border-border/70">
                <div className="p-5" style={{ background: `linear-gradient(135deg, ${form.brand_secondary_color}, ${form.brand_primary_color})` }}>
                  <div className="flex items-center gap-4">
                    {form.logo_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={form.logo_url} alt="Logo preview" className="h-12 w-12 rounded-2xl bg-white/90 object-cover p-1" />
                    ) : (
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 text-white">
                        <Building2 className="h-6 w-6" />
                      </div>
                    )}
                    <div>
                      <p className="text-lg font-bold text-white">{form.name || "Your Business"}</p>
                      <p className="text-xs text-white/80">{form.address || "Your branded document preview"}</p>
                    </div>
                  </div>
                </div>
                <div className="bg-background p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">{form.document_template} template</p>
                      <p className="mt-2 text-xl font-semibold text-foreground">Invoice / DC preview</p>
                    </div>
                    <div className="rounded-2xl px-4 py-2 text-sm font-semibold text-white" style={{ backgroundColor: form.brand_primary_color }}>
                      {form.invoice_prefix}/001
                    </div>
                  </div>
                  <p className="mt-4 text-sm text-muted-foreground">{form.footer_text}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        <section className="space-y-3">
          <h2 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            <FileText className="h-4 w-4" /> Numbering Sequences
          </h2>
          <Card className="border-border">
            <CardContent className="space-y-4 p-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-xs text-muted-foreground">Invoice Prefix</label>
                  <Input value={form.invoice_prefix} onChange={(e) => setForm((prev) => ({ ...prev, invoice_prefix: e.target.value }))} />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-muted-foreground">Next Bill No.</label>
                  <Input type="number" value={form.invoice_counter} onChange={(e) => setForm((prev) => ({ ...prev, invoice_counter: Number(e.target.value || 1) }))} className="font-mono text-center" />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-muted-foreground">DC Prefix</label>
                  <Input value={form.dc_prefix} onChange={(e) => setForm((prev) => ({ ...prev, dc_prefix: e.target.value }))} />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-muted-foreground">Next DC No.</label>
                  <Input type="number" value={form.dc_counter} onChange={(e) => setForm((prev) => ({ ...prev, dc_counter: Number(e.target.value || 1) }))} className="font-mono text-center" />
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        <Button className="w-full" size="lg" onClick={() => saveSettings.mutate()} disabled={saveSettings.isPending}>
          <Save className="mr-2 h-5 w-5" /> {saveSettings.isPending ? "Saving..." : "Save Changes"}
        </Button>

        <div className="mt-8 space-y-4 border-t border-border pt-8">
          <Button variant="ghost" className="w-full text-error hover:bg-error/10 hover:text-error" onClick={handleLogout}>
            Log Out from this Device
          </Button>
        </div>
      </div>
    </main>
  );
}
