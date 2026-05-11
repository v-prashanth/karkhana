"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  CalendarClock,
  Edit3,
  Phone,
  PlusCircle,
  Power,
  PowerOff,
  Trash2,
  Users,
  X,
  ChevronDown,
  ChevronUp,
  IndianRupee,
} from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { EmptyState } from "@/components/shared/EmptyState";
import { staffApi } from "@/lib/api/staff";
import { useToast } from "@/components/ui/Toaster";
import { useStore } from "@/store/useStore";
import { formatCurrency } from "@/lib/utils/currency";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import type { Attendance, Staff } from "@/types/database";

type StaffForm = {
  name: string;
  phone: string;
  role: string;
  pay_type: "daily" | "monthly";
  pay_rate: string;
  joined_at: string;
};

const emptyForm: StaffForm = {
  name: "",
  phone: "",
  role: "",
  pay_type: "daily",
  pay_rate: "",
  joined_at: new Date().toISOString().split("T")[0],
};

export default function StaffPage() {
  const organization = useStore((state) => state.organization);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [showInactive, setShowInactive] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [form, setForm] = useState<StaffForm>(emptyForm);

  const { data: staff = [] } = useQuery<Staff[]>({
    queryKey: ["staff", organization?.id, showInactive],
    enabled: Boolean(organization?.id),
    queryFn: () => staffApi.list(showInactive),
  });

  const { data: attendance = [] } = useQuery<Attendance[]>({
    queryKey: ["attendance", organization?.id],
    enabled: Boolean(organization?.id),
    queryFn: () => staffApi.listAttendance(),
  });

  const invalidateStaff = async () => {
    await queryClient.invalidateQueries({ queryKey: ["staff", organization?.id] });
  };

  const createStaff = useMutation({
    mutationFn: () =>
      staffApi.create({
        name: form.name,
        phone: form.phone || null,
        role: form.role || null,
        pay_type: form.pay_type,
        pay_rate: Number(form.pay_rate || 0),
        is_active: true,
        joined_at: form.joined_at,
      }),
    onSuccess: async () => {
      await invalidateStaff();
      setShowForm(false);
      setForm(emptyForm);
      toast("Staff member added", "success");
    },
    onError: (error: Error) => toast(error.message, "error"),
  });

  const updateStaff = useMutation({
    mutationFn: (data: { id: string; updates: Partial<Staff> }) =>
      staffApi.update(data.id, data.updates),
    onSuccess: async () => {
      await invalidateStaff();
      setEditingId(null);
      setForm(emptyForm);
      toast("Staff updated", "success");
    },
    onError: (error: Error) => toast(error.message, "error"),
  });

  const toggleActive = useMutation({
    mutationFn: (data: { id: string; isActive: boolean }) =>
      staffApi.update(data.id, { is_active: !data.isActive }),
    onSuccess: async (_data, variables) => {
      await invalidateStaff();
      toast(variables.isActive ? "Staff deactivated" : "Staff reactivated", "success");
    },
    onError: (error: Error) => toast(error.message, "error"),
  });

  const deleteStaff = useMutation({
    mutationFn: (id: string) => staffApi.remove(id),
    onSuccess: async (result) => {
      await invalidateStaff();
      if (result.deactivated) {
        toast("Staff had attendance records and was deactivated instead", "success");
      } else {
        toast("Staff member removed", "success");
      }
    },
    onError: (error: Error) => toast(error.message, "error"),
  });

  const markAttendance = useMutation({
    mutationFn: ({ staffId, status }: { staffId: string; status: Attendance["status"] }) =>
      staffApi.markAttendance({ staff_id: staffId, status }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["attendance", organization?.id] });
      toast("Attendance updated", "success");
    },
    onError: (error: Error) => toast(error.message, "error"),
  });

  const startEditing = (member: Staff) => {
    setEditingId(member.id);
    setForm({
      name: member.name,
      phone: member.phone || "",
      role: member.role || "",
      pay_type: member.pay_type,
      pay_rate: String(member.pay_rate || 0),
      joined_at: member.joined_at,
    });
    setShowForm(false);
  };

  const handleSaveEdit = () => {
    if (!editingId || !form.name) return;
    updateStaff.mutate({
      id: editingId,
      updates: {
        name: form.name,
        phone: form.phone || null,
        role: form.role || null,
        pay_type: form.pay_type,
        pay_rate: Number(form.pay_rate || 0),
        joined_at: form.joined_at,
      },
    });
  };

  const handleDelete = (member: Staff) => {
    const message = `Delete ${member.name}? This cannot be undone.`;
    if (window.confirm(message)) {
      deleteStaff.mutate(member.id);
    }
  };

  const today = new Date().toISOString().split("T")[0];
  const todayAttendance = new Map(
    attendance.filter((entry) => entry.date === today).map((entry) => [entry.staff_id, entry.status])
  );

  // Calculate attendance stats for each staff member (last 30 days)
  const getAttendanceStats = (staffId: string) => {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recentAttendance = attendance.filter(
      (entry) => entry.staff_id === staffId && new Date(entry.date) >= thirtyDaysAgo
    );
    const present = recentAttendance.filter((e) => e.status === "present" || e.status === "overtime").length;
    const halfDays = recentAttendance.filter((e) => e.status === "half_day").length;
    const absent = recentAttendance.filter((e) => e.status === "absent").length;
    return { present, halfDays, absent, total: recentAttendance.length };
  };

  // Calculate estimated monthly pay
  const getEstimatedPay = (member: Staff) => {
    if (member.pay_type === "monthly") return Number(member.pay_rate || 0);
    // For daily wage: estimate based on 26 working days
    const stats = getAttendanceStats(member.id);
    if (stats.total === 0) return Number(member.pay_rate || 0) * 26;
    const effectiveDays = stats.present + stats.halfDays * 0.5;
    const dailyRate = Number(member.pay_rate || 0);
    return effectiveDays * dailyRate;
  };

  const activeStaff = staff.filter((s) => s.is_active);
  const inactiveStaff = staff.filter((s) => !s.is_active);
  const totalMonthlyPayroll = activeStaff.reduce((sum, member) => sum + getEstimatedPay(member), 0);

  return (
    <main className="min-h-screen bg-background pb-24">
      <PageHeader
        title="Staff"
        subtitle="Employees, attendance, pay"
        action={
          <button
            onClick={() => {
              setShowForm((value) => !value);
              setEditingId(null);
              setForm(emptyForm);
            }}
            className="flex h-9 items-center gap-2 rounded-full bg-accent px-4 text-sm font-semibold text-white active:scale-95 transition-transform"
          >
            <PlusCircle className="h-4 w-4" />
            Add
          </button>
        }
      />

      <div className="space-y-5 p-5 xl:px-8">
        {/* Summary Cards */}
        <Card className="glass-panel">
          <CardContent className="grid gap-3 p-4 md:grid-cols-3">
            <div className="rounded-2xl border border-border/60 bg-background/55 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Headcount</p>
              <p className="mt-2 text-2xl font-bold text-foreground">{activeStaff.length}</p>
              {inactiveStaff.length > 0 && (
                <p className="mt-1 text-[10px] text-muted-foreground">
                  +{inactiveStaff.length} inactive
                </p>
              )}
            </div>
            <div className="rounded-2xl border border-border/60 bg-background/55 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Present Today</p>
              <p className="mt-2 text-2xl font-bold text-foreground">
                {Array.from(todayAttendance.values()).filter(
                  (status) => status === "present" || status === "overtime"
                ).length}
              </p>
              <p className="mt-1 text-[10px] text-muted-foreground">
                of {activeStaff.length} active
              </p>
            </div>
            <div className="rounded-2xl border border-border/60 bg-background/55 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Est. Monthly Payroll</p>
              <p className="mt-2 text-2xl font-bold text-foreground">
                {formatCurrency(totalMonthlyPayroll)}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Add / Edit Form */}
        <AnimatePresence>
          {(showForm || editingId) && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <Card className="glass-panel">
                <CardContent className="space-y-4 p-5">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-foreground">
                      {editingId ? "Edit employee" : "Add employee"}
                    </p>
                    <button
                      onClick={() => {
                        setShowForm(false);
                        setEditingId(null);
                        setForm(emptyForm);
                      }}
                      className="rounded-full p-1.5 text-muted-foreground hover:text-foreground hover:bg-white/10 transition-colors"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="grid gap-3 md:grid-cols-2">
                    <Input
                      placeholder="Employee name *"
                      value={form.name}
                      onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                    />
                    <Input
                      placeholder="Phone number"
                      type="tel"
                      value={form.phone}
                      onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value }))}
                    />
                    <Input
                      placeholder="Role (e.g. CNC Operator)"
                      value={form.role}
                      onChange={(e) => setForm((prev) => ({ ...prev, role: e.target.value }))}
                    />
                    <select
                      value={form.pay_type}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          pay_type: e.target.value as "daily" | "monthly",
                        }))
                      }
                      className="h-12 rounded-xl border border-white/10 bg-black/40 px-3 text-sm text-foreground"
                    >
                      <option value="daily">Daily wage</option>
                      <option value="monthly">Monthly salary</option>
                    </select>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">₹</span>
                      <Input
                        placeholder="Pay rate"
                        type="number"
                        value={form.pay_rate}
                        onChange={(e) => setForm((prev) => ({ ...prev, pay_rate: e.target.value }))}
                        className="pl-7"
                      />
                    </div>
                    <Input
                      type="date"
                      value={form.joined_at}
                      onChange={(e) => setForm((prev) => ({ ...prev, joined_at: e.target.value }))}
                    />
                  </div>
                  <Button
                    onClick={() => (editingId ? handleSaveEdit() : createStaff.mutate())}
                    disabled={!form.name || createStaff.isPending || updateStaff.isPending}
                    className="w-full"
                  >
                    {createStaff.isPending || updateStaff.isPending
                      ? "Saving..."
                      : editingId
                      ? "Update employee"
                      : "Save employee"}
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Staff List */}
        {staff.length === 0 ? (
          <EmptyState
            type="contacts"
            icon={<Users className="h-10 w-10" />}
            title="No staff yet"
            description="Add employees, track attendance, and build the employee portal from one place."
            action={<Button onClick={() => setShowForm(true)}>Add first employee</Button>}
          />
        ) : (
          <div className="space-y-4">
            {/* Active Staff */}
            {activeStaff.map((member) => {
              const stats = getAttendanceStats(member.id);
              const isExpanded = expandedId === member.id;
              const estimatedPay = getEstimatedPay(member);

              return (
                <Card
                  key={member.id}
                  className={cn("glass-panel transition-colors", !member.is_active && "opacity-50")}
                >
                  <CardContent className="space-y-4 p-5">
                    {/* Header row */}
                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-lg font-semibold text-foreground truncate">{member.name}</p>
                          {!member.is_active && (
                            <span className="shrink-0 rounded-md bg-red-500/10 px-2 py-0.5 text-[10px] font-bold text-red-400 uppercase">
                              Inactive
                            </span>
                          )}
                        </div>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {member.role || "Team member"}
                          {member.phone && (
                            <>
                              {" • "}
                              <a
                                href={`tel:${member.phone}`}
                                className="inline-flex items-center gap-1 text-accent hover:underline"
                              >
                                <Phone className="h-3 w-3" />
                                {member.phone}
                              </a>
                            </>
                          )}
                          {!member.phone && " • No phone"}
                          {" • "}
                          {member.pay_type === "monthly" ? "Monthly" : "Daily"}{" "}
                          {formatCurrency(Number(member.pay_rate || 0))}
                        </p>
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => startEditing(member)}
                          className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-muted-foreground hover:text-foreground hover:bg-white/10 transition-colors"
                          title="Edit"
                        >
                          <Edit3 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() =>
                            toggleActive.mutate({ id: member.id, isActive: member.is_active })
                          }
                          className={cn(
                            "flex h-8 w-8 items-center justify-center rounded-lg border transition-colors",
                            member.is_active
                              ? "border-amber-500/20 bg-amber-500/5 text-amber-400 hover:bg-amber-500/15"
                              : "border-green-500/20 bg-green-500/5 text-green-400 hover:bg-green-500/15"
                          )}
                          title={member.is_active ? "Deactivate" : "Reactivate"}
                        >
                          {member.is_active ? (
                            <PowerOff className="h-3.5 w-3.5" />
                          ) : (
                            <Power className="h-3.5 w-3.5" />
                          )}
                        </button>
                        <button
                          onClick={() => handleDelete(member)}
                          className="flex h-8 w-8 items-center justify-center rounded-lg border border-red-500/20 bg-red-500/5 text-red-400 hover:bg-red-500/15 transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => setExpandedId(isExpanded ? null : member.id)}
                          className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-muted-foreground hover:text-foreground hover:bg-white/10 transition-colors"
                          title="Details"
                        >
                          {isExpanded ? (
                            <ChevronUp className="h-3.5 w-3.5" />
                          ) : (
                            <ChevronDown className="h-3.5 w-3.5" />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Today's Attendance */}
                    {member.is_active && (
                      <div className="space-y-2">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                          Today&apos;s Attendance
                        </p>
                        <div className="grid gap-2 sm:grid-cols-4">
                          {(["present", "half_day", "absent", "overtime"] as const).map((status) => (
                            <button
                              key={status}
                              onClick={() =>
                                markAttendance.mutate({ staffId: member.id, status })
                              }
                              className={cn(
                                "rounded-xl border px-3 py-2 text-xs font-semibold capitalize transition-all active:scale-95",
                                todayAttendance.get(member.id) === status
                                  ? "border-accent bg-accent/10 text-accent"
                                  : "border-border/60 bg-background/55 text-muted-foreground hover:text-foreground"
                              )}
                            >
                              {status.replace("_", " ")}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Expanded Details */}
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden"
                        >
                          <div className="mt-2 space-y-3 rounded-2xl border border-white/5 bg-white/[0.02] p-4">
                            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                              Last 30 Days Summary
                            </p>
                            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                              <div className="rounded-xl border border-green-500/10 bg-green-500/5 p-3 text-center">
                                <p className="text-lg font-bold text-green-400">{stats.present}</p>
                                <p className="text-[10px] font-bold uppercase text-green-400/60">Present</p>
                              </div>
                              <div className="rounded-xl border border-amber-500/10 bg-amber-500/5 p-3 text-center">
                                <p className="text-lg font-bold text-amber-400">{stats.halfDays}</p>
                                <p className="text-[10px] font-bold uppercase text-amber-400/60">Half Day</p>
                              </div>
                              <div className="rounded-xl border border-red-500/10 bg-red-500/5 p-3 text-center">
                                <p className="text-lg font-bold text-red-400">{stats.absent}</p>
                                <p className="text-[10px] font-bold uppercase text-red-400/60">Absent</p>
                              </div>
                              <div className="rounded-xl border border-accent/10 bg-accent/5 p-3 text-center">
                                <div className="flex items-center justify-center gap-1">
                                  <IndianRupee className="h-3.5 w-3.5 text-accent" />
                                  <p className="text-lg font-bold text-accent">
                                    {Math.round(estimatedPay).toLocaleString("en-IN")}
                                  </p>
                                </div>
                                <p className="text-[10px] font-bold uppercase text-accent/60">Est. Pay</p>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 text-xs text-muted-foreground pt-1">
                              <CalendarClock className="h-3.5 w-3.5" />
                              Joined {new Date(member.joined_at).toLocaleDateString("en-IN", {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              })}
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </CardContent>
                </Card>
              );
            })}

            {/* Inactive Staff Toggle */}
            {inactiveStaff.length > 0 && (
              <div className="pt-2">
                <button
                  onClick={() => setShowInactive(!showInactive)}
                  className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors"
                >
                  <PowerOff className="h-3.5 w-3.5" />
                  {showInactive ? "Hide" : "Show"} {inactiveStaff.length} inactive{" "}
                  {inactiveStaff.length === 1 ? "employee" : "employees"}
                </button>
              </div>
            )}

            {/* Inactive Staff (shown when toggled) */}
            {showInactive &&
              inactiveStaff.map((member) => (
                <Card key={member.id} className="glass-panel opacity-50">
                  <CardContent className="space-y-3 p-5">
                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-lg font-semibold text-foreground">{member.name}</p>
                          <span className="rounded-md bg-red-500/10 px-2 py-0.5 text-[10px] font-bold text-red-400 uppercase">
                            Inactive
                          </span>
                        </div>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {member.role || "Team member"} •{" "}
                          {member.pay_type === "monthly" ? "Monthly" : "Daily"}{" "}
                          {formatCurrency(Number(member.pay_rate || 0))}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() =>
                            toggleActive.mutate({ id: member.id, isActive: member.is_active })
                          }
                          className="flex h-8 items-center gap-1.5 rounded-lg border border-green-500/20 bg-green-500/5 px-3 text-[10px] font-bold text-green-400 uppercase hover:bg-green-500/15 transition-colors"
                        >
                          <Power className="h-3.5 w-3.5" />
                          Reactivate
                        </button>
                        <button
                          onClick={() => handleDelete(member)}
                          className="flex h-8 w-8 items-center justify-center rounded-lg border border-red-500/20 bg-red-500/5 text-red-400 hover:bg-red-500/15 transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
          </div>
        )}
      </div>
    </main>
  );
}
