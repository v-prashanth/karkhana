"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CalendarClock, PlusCircle, Users } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { EmptyState } from "@/components/shared/EmptyState";
import { staffApi } from "@/lib/api/staff";
import { useToast } from "@/components/ui/Toaster";
import { useStore } from "@/store/useStore";
import { formatCurrency } from "@/lib/utils/currency";
import type { Attendance, Staff } from "@/types/database";

type StaffForm = {
  name: string;
  phone: string;
  role: string;
  pay_type: "daily" | "monthly";
  pay_rate: string;
  joined_at: string;
};

export default function StaffPage() {
  const organization = useStore((state) => state.organization);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<StaffForm>({
    name: "",
    phone: "",
    role: "",
    pay_type: "daily",
    pay_rate: "",
    joined_at: new Date().toISOString().split("T")[0],
  });

  const { data: staff = [] } = useQuery<Staff[]>({
    queryKey: ["staff", organization?.id],
    enabled: Boolean(organization?.id),
    queryFn: () => staffApi.list(),
  });

  const { data: attendance = [] } = useQuery<Attendance[]>({
    queryKey: ["attendance", organization?.id],
    enabled: Boolean(organization?.id),
    queryFn: () => staffApi.listAttendance(),
  });

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
      await queryClient.invalidateQueries({ queryKey: ["staff", organization?.id] });
      setShowForm(false);
      setForm({
        name: "",
        phone: "",
        role: "",
        pay_type: "daily",
        pay_rate: "",
        joined_at: new Date().toISOString().split("T")[0],
      });
      toast("Staff member added", "success");
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

  const today = new Date().toISOString().split("T")[0];
  const todayAttendance = new Map(attendance.filter((entry) => entry.date === today).map((entry) => [entry.staff_id, entry.status]));

  return (
    <main className="min-h-screen bg-background pb-24">
      <PageHeader
        title="Staff"
        subtitle="Employees, attendance, pay"
        action={
          <button
            onClick={() => setShowForm((value) => !value)}
            className="flex h-9 items-center gap-2 rounded-full bg-accent px-4 text-sm font-semibold text-white"
          >
            <PlusCircle className="h-4 w-4" />
            Add
          </button>
        }
      />

      <div className="space-y-5 p-5 xl:px-8">
        <Card className="glass-panel">
          <CardContent className="space-y-2 p-5">
            <h2 className="text-base font-semibold text-foreground">Manage the people who help run the business</h2>
            <p className="text-sm leading-6 text-muted-foreground">
              Add staff, mark attendance, and build a simple employee portal so team members can see only their own details.
            </p>
          </CardContent>
        </Card>

        {showForm ? (
          <Card className="glass-panel">
            <CardContent className="space-y-4 p-5">
              <p className="text-sm font-semibold text-foreground">Add employee</p>
              <div className="grid gap-3 md:grid-cols-2">
                <Input placeholder="Employee name" value={form.name} onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))} />
                <Input placeholder="Phone number" value={form.phone} onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value }))} />
                <Input placeholder="Role" value={form.role} onChange={(e) => setForm((prev) => ({ ...prev, role: e.target.value }))} />
                <select
                  value={form.pay_type}
                  onChange={(e) => setForm((prev) => ({ ...prev, pay_type: e.target.value as "daily" | "monthly" }))}
                  className="h-12 rounded-xl border border-white/10 bg-black/40 px-3 text-sm text-foreground"
                >
                  <option value="daily">Daily wage</option>
                  <option value="monthly">Monthly salary</option>
                </select>
                <Input placeholder="Pay rate" type="number" value={form.pay_rate} onChange={(e) => setForm((prev) => ({ ...prev, pay_rate: e.target.value }))} />
                <Input type="date" value={form.joined_at} onChange={(e) => setForm((prev) => ({ ...prev, joined_at: e.target.value }))} />
              </div>
              <Button onClick={() => createStaff.mutate()} disabled={!form.name || createStaff.isPending} className="w-full">
                {createStaff.isPending ? "Saving..." : "Save employee"}
              </Button>
            </CardContent>
          </Card>
        ) : null}

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
            <Card className="glass-panel">
              <CardContent className="grid gap-3 p-4 md:grid-cols-3">
                <div className="rounded-2xl border border-border/60 bg-background/55 p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Headcount</p>
                  <p className="mt-2 text-2xl font-bold text-foreground">{staff.length}</p>
                </div>
                <div className="rounded-2xl border border-border/60 bg-background/55 p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Present Today</p>
                  <p className="mt-2 text-2xl font-bold text-foreground">
                    {Array.from(todayAttendance.values()).filter((status) => status === "present" || status === "overtime").length}
                  </p>
                </div>
                <div className="rounded-2xl border border-border/60 bg-background/55 p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Estimated Payroll</p>
                  <p className="mt-2 text-2xl font-bold text-foreground">
                    {formatCurrency(staff.reduce((sum, member) => sum + Number(member.pay_rate || 0), 0))}
                  </p>
                </div>
              </CardContent>
            </Card>

            {staff.map((member) => (
              <Card key={member.id} className="glass-panel">
                <CardContent className="space-y-4 p-5">
                  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="text-lg font-semibold text-foreground">{member.name}</p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {member.role || "Team member"} • {member.phone || "No phone"} • {member.pay_type === "monthly" ? "Monthly" : "Daily"} {formatCurrency(Number(member.pay_rate || 0))}
                      </p>
                    </div>
                    <div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-background/55 px-3 py-1.5 text-xs text-muted-foreground">
                      <CalendarClock className="h-3.5 w-3.5" />
                      Joined {new Date(member.joined_at).toLocaleDateString("en-IN")}
                    </div>
                  </div>

                  <div className="grid gap-2 sm:grid-cols-4">
                    {(["present", "half_day", "absent", "overtime"] as const).map((status) => (
                      <button
                        key={status}
                        onClick={() => markAttendance.mutate({ staffId: member.id, status })}
                        className={`rounded-xl border px-3 py-2 text-xs font-semibold capitalize transition-all ${
                          todayAttendance.get(member.id) === status
                            ? "border-accent bg-accent/10 text-accent"
                            : "border-border/60 bg-background/55 text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        {status.replace("_", " ")}
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Today: {todayAttendance.get(member.id)?.replace("_", " ") || "not marked"}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
