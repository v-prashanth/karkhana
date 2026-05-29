"use client";

import React, { useState, useEffect } from "react";
import { X, Check, Landmark, Users, Hammer, Plus, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ordersApi } from "@/lib/api/orders";
import { staffApi } from "@/lib/api/staff";
import { contactsApi } from "@/lib/api/contacts";
import { costsApi } from "@/lib/api/costs";
import { motion, AnimatePresence } from "framer-motion";

interface QuickCostLogModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultOrderId?: string;
  onSuccess: () => void;
}

export function QuickCostLogModal({
  isOpen,
  onClose,
  defaultOrderId,
  onSuccess,
}: QuickCostLogModalProps) {
  const queryClient = useQueryClient();
  const [orderId, setOrderId] = useState<string>("");
  const [costCategory, setCostCategory] = useState<"material" | "labor" | "outsourcing" | "other">("material");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [staffId, setStaffId] = useState("");
  const [supplierId, setSupplierId] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Labor specific helper state
  const [laborHours, setLaborHours] = useState("");
  const [laborDays, setLaborDays] = useState("");

  // 1. Fetch orders, staff, suppliers for dropdowns
  const { data: orders = [] } = useQuery({
    queryKey: ["orders-dropdown"],
    queryFn: () => ordersApi.list(),
    enabled: isOpen,
  });

  const { data: staffList = [] } = useQuery({
    queryKey: ["staff-dropdown"],
    queryFn: () => staffApi.list(),
    enabled: isOpen && costCategory === "labor",
  });

  const { data: suppliers = [] } = useQuery({
    queryKey: ["suppliers-dropdown"],
    queryFn: () => contactsApi.list("supplier"),
    enabled: isOpen && costCategory === "outsourcing",
  });

  // Pre-fill states
  useEffect(() => {
    if (isOpen) {
      setOrderId(defaultOrderId || (orders[0]?.id ? String(orders[0].id) : ""));
      setCostCategory("material");
      setDescription("");
      setAmount("");
      setStaffId("");
      setSupplierId("");
      setLaborHours("");
      setLaborDays("");
      setErrorMsg(null);
    }
  }, [isOpen, defaultOrderId, orders]);

  // Handle staff selection to auto-fill labor wage rate
  useEffect(() => {
    if (!staffId || costCategory !== "labor") return;
    const staff = staffList.find((s: any) => String(s.id) === staffId);
    if (!staff) return;

    if (staff.pay_type === "daily") {
      setLaborDays("1");
      setLaborHours("");
      setAmount(String(staff.pay_rate || 0));
      setDescription(`Labor cost: ${staff.name} (1 Day)`);
    } else {
      setLaborHours("8");
      setLaborDays("");
      // Assume pay rate is per hour or calculate relative rate
      setAmount(String((staff.pay_rate || 0) * 8));
      setDescription(`Labor cost: ${staff.name} (8 Hours)`);
    }
  }, [staffId, staffList, costCategory]);

  // Dynamically calculate labor cost based on changes to hours/days
  const handleLaborCostRecalc = (days: string, hours: string) => {
    const staff = staffList.find((s: any) => String(s.id) === staffId);
    if (!staff) return;

    if (staff.pay_type === "daily") {
      const d = Number(days) || 0;
      setAmount(String(d * (staff.pay_rate || 0)));
      setDescription(`Labor cost: ${staff.name} (${d} Day${d !== 1 ? "s" : ""})`);
    } else {
      const h = Number(hours) || 0;
      setAmount(String(h * (staff.pay_rate || 0)));
      setDescription(`Labor cost: ${staff.name} (${h} Hour${h !== 1 ? "s" : ""})`);
    }
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      const numAmount = Number(amount) || 0;
      if (!orderId) throw new Error("Please select a job/order");
      if (!description.trim()) throw new Error("Description is required");
      if (numAmount <= 0) throw new Error("Amount must be greater than zero");

      return costsApi.create({
        order_id: orderId,
        cost_category: costCategory,
        description,
        amount: numAmount,
        staff_id: costCategory === "labor" ? staffId : undefined,
        supplier_id: costCategory === "outsourcing" ? supplierId : undefined,
      });
    },
    onSuccess: () => {
      onSuccess();
      onClose();
    },
    onError: (err: any) => {
      setErrorMsg(err.message || "Failed to log cost");
    },
  });

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/85 backdrop-blur-md"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            className="w-full max-w-md bg-[#0d0d0d] border border-white/5 rounded-3xl p-6 relative overflow-hidden shadow-[0_24px_64px_rgba(0,0,0,0.8)] z-10"
          >
            {/* Ambient Gold glow */}
            <div className="absolute -top-32 -left-32 w-64 h-64 bg-accent/5 rounded-full blur-[100px] pointer-events-none" />

            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-white/5 mb-5">
              <div className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-accent" />
                <h3 className="text-sm font-black uppercase tracking-widest text-white italic">
                  Log Production Cost
                </h3>
              </div>
              <button
                onClick={onClose}
                className="h-8 w-8 rounded-full bg-white/5 border border-white/5 flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {errorMsg && (
              <div className="mb-4 p-3 rounded-xl bg-error/10 border border-error/20 text-xs text-error font-semibold">
                {errorMsg}
              </div>
            )}

            {/* Form */}
            <div className="space-y-4">
              {/* Job Selector */}
              <div>
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block mb-2">
                  Select Job / Order
                </label>
                <select
                  value={orderId}
                  onChange={(e) => setOrderId(e.target.value)}
                  className="flex h-12 w-full rounded-xl border border-white/5 bg-[#030303] px-4 py-2 text-sm text-white focus:outline-none focus:border-accent"
                >
                  <option value="" disabled>Select Job</option>
                  {orders.map((o: any) => (
                    <option key={o.id} value={o.id}>
                      {o.description} {o.order_number ? `(${o.order_number})` : ""}
                    </option>
                  ))}
                </select>
              </div>

              {/* Category selector pills */}
              <div>
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block mb-2">
                  Cost Category
                </label>
                <div className="grid grid-cols-4 gap-1.5 p-1 rounded-xl bg-[#030303] border border-white/5">
                  {(["material", "labor", "outsourcing", "other"] as const).map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => {
                        setCostCategory(cat);
                        setDescription("");
                        setAmount("");
                        setStaffId("");
                        setSupplierId("");
                      }}
                      className={`py-2 rounded-lg text-[9px] font-bold uppercase tracking-wider text-center transition-all ${
                        costCategory === cat
                          ? "bg-accent/15 text-accent shadow-[0_0_12px_rgba(212,175,55,0.15)] border border-accent/20"
                          : "text-white/40 hover:text-white/70"
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Smart fields based on Category */}
              {costCategory === "labor" && (
                <div className="space-y-3 p-3 rounded-2xl bg-white/[0.01] border border-white/5">
                  <div>
                    <label className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest block mb-1">
                      Attribute Worker
                    </label>
                    <select
                      value={staffId}
                      onChange={(e) => setStaffId(e.target.value)}
                      className="flex h-10 w-full rounded-lg border border-white/5 bg-[#030303] px-3 py-1.5 text-xs text-white focus:outline-none focus:border-accent"
                    >
                      <option value="">Select Worker (Wages)</option>
                      {staffList.map((s: any) => (
                        <option key={s.id} value={s.id}>
                          {s.name} ({s.pay_type === "daily" ? `₹${s.pay_rate}/day` : `₹${s.pay_rate}/hr`})
                        </option>
                      ))}
                    </select>
                  </div>

                  {staffId && (
                    <div className="grid grid-cols-2 gap-3">
                      {staffList.find((s: any) => String(s.id) === staffId)?.pay_type === "daily" ? (
                        <div>
                          <label className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest block mb-1">
                            Days Worked
                          </label>
                          <Input
                            type="number"
                            placeholder="Days"
                            value={laborDays}
                            onChange={(e) => {
                              setLaborDays(e.target.value);
                              handleLaborCostRecalc(e.target.value, "");
                            }}
                            className="cred-inset h-9 text-xs"
                          />
                        </div>
                      ) : (
                        <div>
                          <label className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest block mb-1">
                            Hours Worked
                          </label>
                          <Input
                            type="number"
                            placeholder="Hours"
                            value={laborHours}
                            onChange={(e) => {
                              setLaborHours(e.target.value);
                              handleLaborCostRecalc("", e.target.value);
                            }}
                            className="cred-inset h-9 text-xs"
                          />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {costCategory === "outsourcing" && (
                <div className="space-y-3 p-3 rounded-2xl bg-white/[0.01] border border-white/5">
                  <div>
                    <label className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest block mb-1">
                      Link Subcontractor / Supplier
                    </label>
                    <select
                      value={supplierId}
                      onChange={(e) => setSupplierId(e.target.value)}
                      className="flex h-10 w-full rounded-lg border border-white/5 bg-[#030303] px-3 py-1.5 text-xs text-white focus:outline-none focus:border-accent"
                    >
                      <option value="">Select Supplier</option>
                      {suppliers.map((s: any) => (
                        <option key={s.id} value={s.id}>
                          {s.name} {s.contact_person ? `(${s.contact_person})` : ""}
                        </option>
                      ))}
                    </select>
                  </div>
                  <p className="text-[9px] text-muted-foreground italic">
                    💡 Tagging a supplier will automatically log an expense record to your outstandings ledger.
                  </p>
                </div>
              )}

              {/* Description */}
              <div>
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block mb-2">
                  Cost Description
                </label>
                <Input
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder={
                    costCategory === "material"
                      ? "e.g. Mild Steel Sheet 4mm - 45 kg"
                      : costCategory === "outsourcing"
                      ? "e.g. Laser Cutting and Bending"
                      : "e.g. Shipping / Transportation charges"
                  }
                  className="cred-inset"
                />
              </div>

              {/* Amount */}
              <div>
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block mb-2">
                  Cost Amount
                </label>
                <div className="relative">
                  <Input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="Enter cost amount"
                    className="cred-inset pr-12 font-bold text-white text-base"
                  />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[9px] font-black uppercase text-muted-foreground">
                    INR
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="mt-8 flex items-center justify-end gap-3 pt-4 border-t border-white/5">
              <Button
                variant="ghost"
                onClick={onClose}
                className="h-12 rounded-xl px-4 text-xs font-bold uppercase tracking-wider text-muted-foreground hover:text-white"
                disabled={saveMutation.isPending}
              >
                Cancel
              </Button>

              <Button
                onClick={() => saveMutation.mutate()}
                className="cred-btn-gold h-12 px-6 rounded-xl font-bold uppercase tracking-wider text-xs gap-1.5"
                disabled={saveMutation.isPending}
              >
                <Check className="h-4 w-4" />
                {saveMutation.isPending ? "Logging..." : "Log Cost"}
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
