"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Save, CheckCircle2, Phone, Mail, MapPin, Building2, Globe, UserPlus, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardContent } from "@/components/ui/Card";
import { PageHeader } from "@/components/shared/PageHeader";
import { UpgradeModal } from "@/components/shared/UpgradeModal";
import { useToast } from "@/components/ui/Toaster";
import { contactsApi } from "@/lib/api/contacts";
import { connectionsApi } from "@/lib/api/connections";
import { motion, AnimatePresence } from "framer-motion";
import type { Organization } from "@/types/database";

type ContactForm = {
  name: string;
  type: "client" | "supplier" | "both";
  contactPerson: string;
  phone: string;
  email: string;
  address: string;
  gstin: string;
  notes: string;
  openingBalance: string;
};

export default function NewContactPage() {
  const router = useRouter();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [saved, setSaved] = useState(false);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [limitMessage, setLimitMessage] = useState("");
  const [matchedBiz, setMatchedBiz] = useState<Partial<Organization> | null>(null);
  const [searchingBiz, setSearchingBiz] = useState(false);
  const [requestSent, setRequestSent] = useState(false);

  const { register, handleSubmit, watch } = useForm<ContactForm>({
    defaultValues: {
      name: "",
      type: "client",
      contactPerson: "",
      phone: "",
      email: "",
      address: "",
      gstin: "",
      notes: "",
      openingBalance: "0",
    },
  });

  const phoneValue = watch("phone");

  // Debounced Phone Search
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (phoneValue?.length >= 10) {
        setSearchingBiz(true);
        try {
          const results = await connectionsApi.discover(phoneValue.replace(/\D/g, ""));
          if (results && results.length > 0) {
            setMatchedBiz(results[0]);
          } else {
            setMatchedBiz(null);
          }
        } catch {
          setMatchedBiz(null);
        } finally {
          setSearchingBiz(false);
        }
      } else {
        setMatchedBiz(null);
      }
    }, 800);
    return () => clearTimeout(timer);
  }, [phoneValue]);

  const connectMutation = useMutation({
    mutationFn: (targetId: string) => connectionsApi.sendRequest(targetId),
    onSuccess: () => {
      setRequestSent(true);
      toast("Connection Request Sent!", "success");
    },
    onError: (error: Error) => toast(error.message, "error")
  });

  const createContact = useMutation({
    mutationFn: (data: ContactForm) =>
      contactsApi.create({
        type: data.type,
        name: data.name,
        contact_person: data.contactPerson || null,
        phone: data.phone || null,
        email: data.email || null,
        address: data.address || null,
        gstin: data.gstin || null,
        notes: data.notes || null,
        total_outstanding: parseFloat(data.openingBalance) || 0,
        tags: [],
        is_active: true,
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["contacts"] });
      setSaved(true);
      toast("Contact added successfully!", "success");
      setTimeout(() => router.push("/contacts"), 1200);
    },
    onError: (error: Error) => {
      if (error.message.includes("PLAN_LIMIT_REACHED")) {
        setLimitMessage("Your Free plan is limited to 3 clients. Upgrade to Pro for unlimited contacts.");
        setShowUpgrade(true);
      } else {
        toast(error.message, "error");
      }
    },
  });

  const onSubmit = (data: ContactForm) => {
    createContact.mutate(data);
  };

  if (saved) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-background p-6">
        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="space-y-4 text-center">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-green-500/10">
            <CheckCircle2 className="h-10 w-10 text-green-400" />
          </div>
          <h2 className="text-2xl font-bold text-foreground">Contact Added!</h2>
          <p className="text-muted-foreground">Redirecting...</p>
        </motion.div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background pb-24">
      <PageHeader title="New Contact" backHref="/contacts" />

      <motion.form initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} onSubmit={handleSubmit(onSubmit)} className="space-y-5 p-5">
        <Card className="glass-panel">
          <CardContent className="space-y-2 p-5">
            <h2 className="text-base font-semibold text-foreground">Save a person or business once</h2>
            <p className="text-sm leading-6 text-muted-foreground">
              Later you can create work, bills, and payment records for this contact without typing everything again.
            </p>
          </CardContent>
        </Card>

        <Card className="glass-panel">
          <CardContent className="space-y-4 p-5">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Who is this?</h2>
            <div className="grid grid-cols-3 gap-2">
              {(["client", "supplier", "both"] as const).map((type) => (
                <label key={type} className="flex h-11 cursor-pointer items-center justify-center rounded-xl border border-white/10 bg-black/40 transition-all has-[:checked]:border-accent has-[:checked]:bg-accent/10">
                  <input type="radio" value={type} {...register("type")} className="sr-only" defaultChecked={type === "client"} />
                  <span className="text-xs font-semibold capitalize text-foreground">{type}</span>
                </label>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="glass-panel">
          <CardContent className="space-y-4 p-5">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Main Details</h2>
            <div>
              <label className="mb-1.5 flex items-center gap-1.5 text-sm text-muted-foreground">
                <Building2 className="h-3.5 w-3.5" /> Business / Company Name
              </label>
              <Input placeholder="E.g. EPE Process Filters" {...register("name", { required: true })} autoFocus />
            </div>
            <div>
              <label className="mb-1.5 block text-sm text-muted-foreground">Contact Person</label>
              <Input placeholder="Owner, manager, or main person" {...register("contactPerson")} />
            </div>
            <div>
              <label className="mb-1.5 block text-sm text-muted-foreground">GSTIN (Optional)</label>
              <Input placeholder="E.g. 36AABCU9603R1ZM" {...register("gstin")} className="uppercase" />
            </div>
          </CardContent>
        </Card>

        <Card className="glass-panel">
          <CardContent className="space-y-4 p-5">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">How to reach them</h2>
            <div>
              <label className="mb-1.5 flex items-center gap-1.5 text-sm text-muted-foreground">
                <Phone className="h-3.5 w-3.5" /> Phone
              </label>
              <Input type="tel" placeholder="+91 98765 43210" {...register("phone")} />
              
              <AnimatePresence>
                {searchingBiz && (
                   <div className="pt-2 text-[10px] font-black uppercase tracking-widest text-accent/50 animate-pulse italic">Searching Karkhana...</div>
                )}
                {matchedBiz && (
                  <motion.div 
                    initial={{ height: 0, opacity: 0 }} 
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden mt-3"
                  >
                    <div className="rounded-2xl border border-accent/20 bg-accent/5 p-4 flex items-center justify-between">
                       <div className="flex items-center gap-3">
                         <div className="h-10 w-10 rounded-xl bg-accent/10 flex items-center justify-center text-accent">
                            <Globe className="h-5 w-5" />
                         </div>
                         <div>
                            <div className="flex items-center gap-1.5">
                               <p className="text-sm font-black text-white uppercase italic tracking-tight">{matchedBiz.name}</p>
                               {matchedBiz.is_verified && <ShieldCheck className="h-3.5 w-3.5 text-accent" />}
                            </div>
                            <p className="text-[10px] font-bold text-muted-foreground uppercase">Business on Karkhana</p>
                         </div>
                       </div>
                       {requestSent ? (
                         <div className="text-[10px] font-black text-green-400 uppercase italic">Request Sent</div>
                       ) : (
                         <Button 
                           type="button"
                           variant="outline" 
                           size="sm" 
                           onClick={() => matchedBiz.id && connectMutation.mutate(matchedBiz.id)}
                           className="h-10 rounded-xl border-accent/20 bg-accent/10 text-accent hover:bg-accent/20 text-[10px] font-black uppercase tracking-widest italic"
                         >
                           <UserPlus className="mr-1.5 h-3.5 w-3.5" /> Connect
                         </Button>
                       )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            <div>
              <label className="mb-1.5 flex items-center gap-1.5 text-sm text-muted-foreground">
                <Mail className="h-3.5 w-3.5" /> Email (Optional)
              </label>
              <Input type="email" placeholder="business@example.com" {...register("email")} />
            </div>
            <div>
              <label className="mb-1.5 flex items-center gap-1.5 text-sm text-muted-foreground">
                <MapPin className="h-3.5 w-3.5" /> Address
              </label>
              <textarea
                placeholder="Full address..."
                className="w-full min-h-[80px] resize-none rounded-xl border border-white/10 bg-black/40 p-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-accent"
                {...register("address")}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm text-muted-foreground">Opening Balance (From your old books)</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">₹</span>
                <Input type="number" placeholder="0.00" {...register("openingBalance")} className="pl-8" />
              </div>
              <p className="mt-2 text-[10px] text-muted-foreground italic">Positive if they owe you, negative if you owe them.</p>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-panel">
          <CardContent className="space-y-4 p-5">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Extra Info</h2>
            <div>
              <label className="mb-1.5 block text-sm text-muted-foreground">Notes (Optional)</label>
              <textarea
                placeholder="Anything useful to remember about this contact"
                className="w-full min-h-[80px] resize-none rounded-xl border border-white/10 bg-black/40 p-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-accent"
                {...register("notes")}
              />
            </div>
          </CardContent>
        </Card>

        <Button type="submit" size="lg" className="w-full text-sm font-semibold" disabled={createContact.isPending}>
          <Save className="mr-2 h-4 w-4" /> {createContact.isPending ? "Saving..." : "Save contact"}
        </Button>
      </motion.form>

      <UpgradeModal 
        isOpen={showUpgrade} 
        onClose={() => setShowUpgrade(false)} 
        title="Scale Your Business"
        message={limitMessage}
      />
    </main>
  );
}
