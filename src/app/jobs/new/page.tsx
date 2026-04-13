"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { ArrowLeft, Save } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardContent } from "@/components/ui/Card";
import { motion } from "framer-motion";

type NewJobForm = {
  clientName: string;
  description: string;
  quantity: string;
  material: string;
  referenceNo: string;
  priority: "normal" | "urgent";
};

const mockClients = [
  "EPE Process Filters",
  "AJ Packaging Limited",
  "Ashalube Solutions Pvt. Ltd.",
];

export default function NewJobPage() {
  const router = useRouter();
  const [saved, setSaved] = useState(false);

  const { register, handleSubmit } = useForm<NewJobForm>({
    defaultValues: {
      clientName: "",
      description: "",
      quantity: "",
      material: "",
      referenceNo: "",
      priority: "normal",
    },
  });

  const onSubmit = (data: NewJobForm) => {
    // In production, this would save to Supabase
    console.log("New Job:", data);
    setSaved(true);
    setTimeout(() => router.push("/jobs"), 1500);
  };

  if (saved) {
    return (
      <main className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center space-y-4"
        >
          <div className="h-20 w-20 mx-auto rounded-full bg-success/20 flex items-center justify-center">
            <Save className="h-10 w-10 text-success" />
          </div>
          <h2 className="text-2xl font-bold text-foreground">Job Created!</h2>
          <p className="text-muted-foreground">Redirecting to Job Board...</p>
        </motion.div>
      </main>
    );
  }

  return (
    <main className="min-h-screen pb-24 bg-background">
      <header className="sticky top-0 z-10 flex items-center h-16 px-4 bg-background/80 backdrop-blur-3xl border-b border-border/50">
        <Link href="/jobs" className="p-2 -ml-2 text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-6 w-6" />
        </Link>
        <h1 className="text-lg font-semibold ml-2 text-foreground">New Job</h1>
      </header>

      <motion.form
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        onSubmit={handleSubmit(onSubmit)}
        className="p-4 space-y-6"
      >
        <Card>
          <CardContent className="p-5 space-y-4">
            <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">Client & Reference</h2>
            <div>
              <label className="text-sm text-muted-foreground mb-1 block">Client Name</label>
              <select
                {...register("clientName", { required: true })}
                className="w-full h-12 rounded-xl border border-white/10 bg-black/40 px-4 text-base focus:outline-none focus:ring-1 focus:ring-accent"
              >
                <option value="">Select Client</option>
                {mockClients.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm text-muted-foreground mb-1 block">PO / Reference No.</label>
              <Input placeholder="E.g. JO//2521268" {...register("referenceNo")} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5 space-y-4">
            <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">Job Details</h2>
            <div>
              <label className="text-sm text-muted-foreground mb-1 block">Description / Part Name</label>
              <textarea
                placeholder="E.g. Machining End Cap as per drawing..."
                className="w-full min-h-[100px] p-3 rounded-xl border border-white/10 bg-black/40 text-base focus:outline-none focus:ring-1 focus:ring-accent"
                {...register("description", { required: true })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-muted-foreground mb-1 block">Quantity</label>
                <Input type="number" placeholder="E.g. 50" {...register("quantity", { required: true })} />
              </div>
              <div>
                <label className="text-sm text-muted-foreground mb-1 block">Material</label>
                <Input placeholder="E.g. MS, SS, Aluminium" {...register("material")} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5 space-y-4">
            <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">Priority</h2>
            <div className="grid grid-cols-2 gap-3">
              <label className="flex items-center justify-center gap-2 h-14 rounded-xl border border-white/10 bg-black/40 cursor-pointer has-[:checked]:border-accent has-[:checked]:bg-accent/10 transition-all">
                <input type="radio" value="normal" {...register("priority")} className="sr-only" defaultChecked />
                <span className="font-semibold text-foreground">Normal</span>
              </label>
              <label className="flex items-center justify-center gap-2 h-14 rounded-xl border border-white/10 bg-black/40 cursor-pointer has-[:checked]:border-error has-[:checked]:bg-error/10 transition-all">
                <input type="radio" value="urgent" {...register("priority")} className="sr-only" />
                <span className="font-semibold text-foreground">🔴 Urgent</span>
              </label>
            </div>
          </CardContent>
        </Card>

        <Button type="submit" size="lg" className="w-full text-base">
          Create Job
        </Button>
      </motion.form>
    </main>
  );
}
