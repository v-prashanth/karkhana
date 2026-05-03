"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Search, Phone, IndianRupee, ChevronRight, Globe } from "lucide-react";
import { Card, CardContent } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { PageHeader } from "@/components/shared/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState";
import { cn } from "@/lib/utils";
import { contactsApi } from "@/lib/api/contacts";
import { invoicesApi } from "@/lib/api/invoices";
import { ordersApi } from "@/lib/api/orders";
import { motion } from "framer-motion";

export default function ContactsPage() {
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<string>("all");

  const contactsQuery = useQuery({
    queryKey: ["contacts"],
    queryFn: () => contactsApi.list(),
  });

  const invoicesQuery = useQuery({
    queryKey: ["invoices", "all"],
    queryFn: () => invoicesApi.list(),
  });

  const ordersQuery = useQuery({
    queryKey: ["orders", "all"],
    queryFn: () => ordersApi.list(),
  });

  const contacts = (contactsQuery.data || []).map((contact) => {
    const outstanding = (invoicesQuery.data || [])
      .filter((invoice) => invoice.contact_id === contact.id)
      .reduce((sum, invoice) => sum + Number(invoice.amount_due || 0), 0);

    const ordersCount = (ordersQuery.data || []).filter((order) => order.contact_id === contact.id).length;

    return {
      ...contact,
      outstanding,
      orders_count: ordersCount,
    };
  });

  const filtered = contacts
    .filter((contact) => filterType === "all" || contact.type === filterType)
    .filter((contact) => search === "" || contact.name.toLowerCase().includes(search.toLowerCase()));

  const totalOutstanding = contacts.reduce((sum, contact) => sum + contact.outstanding, 0);
  const clientCount = contacts.filter((contact) => contact.type === "client" || contact.type === "both").length;
  const supplierCount = contacts.filter((contact) => contact.type === "supplier" || contact.type === "both").length;
  const followUpCount = contacts.filter((contact) => contact.outstanding > 0).length;

  return (
    <main className="flex min-h-screen flex-col bg-background pb-24">
      <PageHeader title="Contacts" subtitle={`${contacts.length} contacts`} addHref="/contacts/new" />

      <div className="px-5 py-3">
        <div className="mb-3 rounded-2xl border border-border/60 bg-background/55 p-4">
          <p className="text-sm leading-6 text-muted-foreground">
            Save everyone you deal with here so their work, bills, payments, and history stay in one place.
          </p>
        </div>

        <div className="glass flex items-center justify-between rounded-2xl p-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Total Outstanding</p>
            <p className="flex items-center text-xl font-bold tracking-tight text-foreground">
              <IndianRupee className="mr-0.5 h-4 w-4" />
              {totalOutstanding.toLocaleString("en-IN")}
            </p>
          </div>
          <div className="flex gap-2">
            {["all", "client", "supplier"].map((type) => (
              <button
                key={type}
                onClick={() => setFilterType(type)}
                className={cn(
                  "rounded-lg px-3 py-1 text-[11px] font-semibold capitalize transition-all",
                  filterType === type ? "bg-accent/20 text-accent" : "text-muted-foreground hover:text-foreground"
                )}
              >
                {type === "all" ? "All" : `${type}s`}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 px-5 pb-3">
        <Card className="glass-panel">
          <CardContent className="p-4">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Clients</p>
            <p className="mt-2 text-xl font-bold text-foreground">{clientCount}</p>
          </CardContent>
        </Card>
        <Card className="glass-panel">
          <CardContent className="p-4">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Suppliers</p>
            <p className="mt-2 text-xl font-bold text-foreground">{supplierCount}</p>
          </CardContent>
        </Card>
        <Card className="glass-panel">
          <CardContent className="p-4">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Need Follow-up</p>
            <p className="mt-2 text-xl font-bold text-foreground">{followUpCount}</p>
          </CardContent>
        </Card>
      </div>

      <div className="px-5 pb-3">
        <div className="relative">
          <Search className="absolute left-3.5 top-3 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search by name or business..." value={search} onChange={(e) => setSearch(e.target.value)} className="h-10 pl-10" />
        </div>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto px-5 pb-4">
        {filtered.length === 0 ? (
          <EmptyState
            type="contacts"
            title="No contacts yet"
            description="Add your first client or supplier so bills, work, and collections can stay connected"
            action={
              <Link href="/contacts/new" className="rounded-xl bg-accent px-5 py-2.5 text-sm font-semibold text-white">
                + Add Contact
              </Link>
            }
          />
        ) : (
          filtered.map((contact, i) => (
            <motion.div key={contact.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
              <Link href={`/contacts/${contact.id}`}>
                <Card className="glass-panel group overflow-hidden transition-colors hover:bg-white/[0.03]">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/5 text-lg font-bold text-muted-foreground">
                        {contact.name.charAt(0)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between">
                          <h3 className="truncate pr-2 font-semibold text-foreground flex items-center gap-2">
                            {contact.name}
                            {contact.on_karkhana_org_id && (
                              <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-accent/10 text-accent text-[9px] font-black uppercase tracking-tighter italic border border-accent/20">
                                <Globe className="h-2.5 w-2.5" /> On Karkhana
                              </span>
                            )}
                          </h3>
                          <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground transition-all group-hover:translate-x-0.5 group-hover:text-foreground" />
                        </div>
                        <p className="mt-1 flex items-center gap-1 text-[11px] text-muted-foreground">
                          <Phone className="h-3 w-3" /> {contact.phone || "No phone"}
                        </p>
                        <p className="mt-1 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                          {contact.type === "both" ? "Client + Supplier" : contact.type}
                        </p>
                        <div className="mt-3 flex items-center gap-4">
                          <div className="flex flex-col">
                            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Work</span>
                            <span className="font-mono text-sm text-foreground">{contact.orders_count}</span>
                          </div>
                          <div className="flex flex-col">
                            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Outstanding</span>
                            <span className={cn("flex items-center font-mono text-sm font-semibold", contact.outstanding > 0 ? "text-red-400" : "text-green-400")}>
                              <IndianRupee className="mr-px h-3 w-3" />
                              {contact.outstanding.toLocaleString("en-IN")}
                            </span>
                          </div>
                          {contact.tags.length > 0 && (
                            <div className="ml-auto flex gap-1">
                              {contact.tags.map((tag) => (
                                <span key={tag} className="rounded-md bg-accent/10 px-2 py-0.5 text-[10px] font-semibold text-accent">
                                  {tag}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </motion.div>
          ))
        )}
      </div>
    </main>
  );
}
