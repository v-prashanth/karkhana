"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { ArrowLeft, Camera, Check, FileText, User } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

type InwardDCForm = {
  clientId: string;
  orderType: "verbal" | "written";
  clientDcNumber?: string;
  clientPoNumber?: string;
  verbalContactName?: string;
  materialDescription: string;
  quantityReceived: number;
  unit: string;
  notes?: string;
};

export default function NewInwardDCPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const { register, handleSubmit, watch, setValue } = useForm<InwardDCForm>({
    defaultValues: {
      orderType: "verbal",
      unit: "Nos",
    }
  });

  const orderType = watch("orderType");

  const onSubmit = async () => {
    setLoading(true);
    // Mock save
    setTimeout(() => {
      setLoading(false);
      router.push("/dashboard");
    }, 1000);
  };

  return (
    <main className="min-h-screen pb-24 bg-background">
      <header className="sticky top-0 z-10 flex items-center h-16 px-4 bg-background/95 backdrop-blur border-b border-border">
        <Link href="/dashboard" className="p-2 -ml-2 text-muted hover:text-foreground">
          <ArrowLeft className="h-6 w-6" />
        </Link>
        <h1 className="text-lg font-semibold ml-2 text-foreground">New Inward DC</h1>
      </header>

      <form onSubmit={handleSubmit(onSubmit)} className="p-4 space-y-6">
        
        {/* Client Selection (Mock) */}
        <section className="space-y-2">
          <label className="text-xs font-semibold text-muted uppercase tracking-wider">Client Details</label>
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <User className="absolute left-3 top-3.5 h-5 w-5 text-muted" />
              <Input placeholder="Select or type client name..." className="pl-10" {...register("clientId", { required: true })} />
            </div>
          </div>
        </section>

        {/* Order Type */}
        <section className="space-y-3">
          <label className="text-xs font-semibold text-muted uppercase tracking-wider">Order Type</label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setValue("orderType", "verbal")}
              className={`p-3 rounded-lg border text-sm font-medium transition-colors flex items-center justify-center gap-2 ${orderType === "verbal" ? "bg-accent/10 border-accent text-accent" : "bg-card border-border text-muted"}`}
            >
              Verbal Order
              {orderType === "verbal" && <Check className="h-4 w-4" />}
            </button>
            <button
              type="button"
              onClick={() => setValue("orderType", "written")}
              className={`p-3 rounded-lg border text-sm font-medium transition-colors flex items-center justify-center gap-2 ${orderType === "written" ? "bg-accent/10 border-accent text-accent" : "bg-card border-border text-muted"}`}
            >
              Written PO
              {orderType === "written" && <Check className="h-4 w-4" />}
            </button>
          </div>

          <div className="animate-in fade-in slide-in-from-top-2 duration-300">
            {orderType === "verbal" ? (
              <Input placeholder="Contact Person Name (e.g. Mr. Ram Pulker Sir)" {...register("verbalContactName")} className="mt-3" />
            ) : (
              <div className="grid grid-cols-2 gap-3 mt-3">
                <Input placeholder="Client DC Number" {...register("clientDcNumber")} />
                <Input placeholder="Client PO Number" {...register("clientPoNumber")} />
              </div>
            )}
          </div>
        </section>

        {/* Material Details */}
        <section className="space-y-3">
          <label className="text-xs font-semibold text-muted uppercase tracking-wider">Material</label>
          <textarea
            placeholder="Material Description (e.g. Aluminium Suckers 25x42x130mm)"
            className="w-full min-h-[100px] p-3 rounded-md border border-border bg-card text-base placeholder:text-muted focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            {...register("materialDescription", { required: true })}
          />
          <div className="grid grid-cols-[2fr_1fr] gap-3">
            <Input type="number" step="0.01" placeholder="Quantity" {...register("quantityReceived", { required: true })} />
            <select
              className="h-12 rounded-md border border-border bg-card px-3 text-base text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              {...register("unit")}
            >
              <option value="Nos">Nos</option>
              <option value="Kg">Kg</option>
              <option value="Meter">Meter</option>
              <option value="Set">Set</option>
            </select>
          </div>
        </section>

        {/* Photos */}
        <section className="space-y-3">
          <label className="text-xs font-semibold text-muted uppercase tracking-wider">Attachments</label>
          <div className="flex gap-3">
            <button type="button" className="flex-1 flex flex-col items-center justify-center h-24 rounded-lg border border-dashed border-border/60 bg-card/50 hover:bg-card hover:border-accent transition-colors text-muted hover:text-accent">
              <Camera className="h-6 w-6 mb-2" />
              <span className="text-xs font-medium">Capture DC</span>
            </button>
            <button type="button" className="flex-1 flex flex-col items-center justify-center h-24 rounded-lg border border-dashed border-border/60 bg-card/50 hover:bg-card hover:border-accent transition-colors text-muted hover:text-accent">
              <FileText className="h-6 w-6 mb-2" />
              <span className="text-xs font-medium">Add Sketch</span>
            </button>
          </div>
        </section>

        <Button type="submit" size="lg" className="w-full text-base" disabled={loading}>
          {loading ? "Saving Document..." : "Save Inward DC"}
        </Button>
      </form>
    </main>
  );
}
