import { notFound } from "next/navigation";
import { format } from "date-fns";
import { createAdminClient } from "@/lib/supabase/admin";
import { formatCurrency } from "@/lib/utils/currency";

interface SharePageProps {
  params: { token: string };
}

export default async function SharedResourcePage({ params }: SharePageProps) {
  const admin = createAdminClient();

  const { data: shareLink } = await admin
    .from("share_links")
    .select("*")
    .eq("token", params.token)
    .eq("is_active", true)
    .single();

  if (!shareLink) {
    notFound();
  }

  if (shareLink.expires_at && new Date(shareLink.expires_at).getTime() < Date.now()) {
    notFound();
  }

  await admin.from("share_link_views").insert({
    share_link_id: shareLink.id,
  });

  if (shareLink.resource_type !== "invoice") {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f6f3ee] p-6 text-[#171717]">
        <div className="w-full max-w-lg rounded-[32px] border border-black/10 bg-white p-8 shadow-[0_30px_80px_-50px_rgba(0,0,0,0.35)]">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#e06b2f]">Karkhana Share Link</p>
          <h1 className="mt-4 text-2xl font-bold">Shared resource</h1>
          <p className="mt-3 text-sm leading-6 text-black/65">
            This link is valid, but the viewer for this resource type has not been added yet.
          </p>
        </div>
      </main>
    );
  }

  const { data: invoice } = await admin
    .from("invoices")
    .select("*, contact:contacts(*), organization:organizations(*)")
    .eq("id", shareLink.resource_id)
    .single();

  if (!invoice) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-[#f6f3ee] px-5 py-10 text-[#171717] xl:px-8">
      <div className="mx-auto max-w-4xl space-y-6">
        <section className="rounded-[32px] border border-black/10 bg-white p-6 shadow-[0_30px_80px_-50px_rgba(0,0,0,0.35)] xl:p-8">
          <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#e06b2f]">Shared via Karkhana</p>
              <div className="mt-3 flex items-center gap-4">
                {invoice.organization?.logo_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={invoice.organization.logo_url} alt="Business logo" className="h-14 w-14 rounded-2xl border border-black/10 bg-white object-cover p-1" />
                ) : null}
                <div>
                  <h1 className="text-3xl font-bold tracking-tight">{invoice.organization?.name || "Business Workspace"}</h1>
                  <p className="mt-1 text-sm text-black/65">{invoice.organization?.address || "Professional business document"}</p>
                </div>
              </div>
              <p className="mt-2 max-w-xl text-sm leading-6 text-black/65">
                Read-only bill view for clients, suppliers, and collaborators. Clean, simple, and easy to trust on mobile or desktop.
              </p>
            </div>
            <div className="rounded-3xl border border-black/10 bg-[#faf8f5] px-5 py-4 text-sm">
              <p className="font-semibold">Invoice {invoice.invoice_number}</p>
              <p className="mt-1 text-black/60">Date: {format(new Date(invoice.date), "dd MMM yyyy")}</p>
              <p className="mt-1 text-black/60">Due: {invoice.due_date ? format(new Date(invoice.due_date), "dd MMM yyyy") : "On receipt"}</p>
            </div>
          </div>
          <div className="mt-6 flex flex-wrap gap-3">
            <a
              href="/"
              className="inline-flex items-center rounded-full bg-[#171717] px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-black"
            >
              Join Karkhana free
            </a>
            <a
              href={`mailto:${invoice.organization?.email || ""}?subject=${encodeURIComponent(`Regarding invoice ${invoice.invoice_number}`)}`}
              className="inline-flex items-center rounded-full border border-black/10 px-5 py-3 text-sm font-semibold text-[#171717] transition-colors hover:bg-[#faf8f5]"
            >
              Contact business
            </a>
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(280px,0.8fr)]">
          <div className="rounded-[32px] border border-black/10 bg-white p-6 shadow-[0_30px_80px_-50px_rgba(0,0,0,0.35)] xl:p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-black/45">Bill To</p>
            <h2 className="mt-3 text-2xl font-bold">{invoice.contact?.name || "Client"}</h2>
            <div className="mt-3 space-y-1 text-sm text-black/65">
              {invoice.contact?.phone ? <p>{invoice.contact.phone}</p> : null}
              {invoice.contact?.email ? <p>{invoice.contact.email}</p> : null}
              {invoice.contact?.address ? <p>{invoice.contact.address}</p> : null}
            </div>
            {invoice.reference_number ? (
              <div className="mt-5 rounded-2xl border border-black/10 bg-[#faf8f5] p-4 text-sm text-black/65">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-black/45">Reference</p>
                <p className="mt-2 font-medium text-[#171717]">{invoice.reference_number}</p>
              </div>
            ) : null}
          </div>

          <div className="rounded-[32px] border border-black/10 bg-[#171717] p-6 text-white shadow-[0_30px_80px_-50px_rgba(0,0,0,0.55)] xl:p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-white/60">Outstanding</p>
            <p className="mt-3 text-4xl font-bold tracking-tight">{formatCurrency(Number(invoice.amount_due || 0))}</p>
            <p className="mt-2 text-sm text-white/70">
              Total invoice value: {formatCurrency(Number(invoice.total || 0))}
            </p>
            {invoice.organization?.upi_id || invoice.organization?.bank_details ? (
              <div className="mt-6 rounded-2xl bg-white/8 px-4 py-4 text-sm text-white/80">
                <p className="font-semibold text-white">Payment Details</p>
                {invoice.organization?.upi_id ? <p className="mt-2">UPI: {invoice.organization.upi_id}</p> : null}
                {invoice.organization?.bank_details ? <p className="mt-2 whitespace-pre-line">{invoice.organization.bank_details}</p> : null}
              </div>
            ) : null}
            <p className="mt-6 rounded-2xl bg-white/8 px-4 py-3 text-sm text-white/80">
              {invoice.organization?.footer_text || "Managed with Karkhana | karkhana.app"}
            </p>
          </div>
        </section>

        <section className="rounded-[32px] border border-black/10 bg-white p-6 shadow-[0_30px_80px_-50px_rgba(0,0,0,0.35)] xl:p-8">
          <div className="grid gap-4 xl:grid-cols-3">
            <div className="rounded-2xl border border-black/10 bg-[#faf8f5] p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-black/45">Business</p>
              <p className="mt-2 text-lg font-semibold">{invoice.organization?.name || "Business Workspace"}</p>
              <p className="mt-1 text-sm text-black/65">{invoice.organization?.phone || invoice.organization?.email || "Shared through Karkhana"}</p>
            </div>
            <div className="rounded-2xl border border-black/10 bg-[#faf8f5] p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-black/45">Invoice Total</p>
              <p className="mt-2 text-lg font-semibold">{formatCurrency(Number(invoice.total || 0))}</p>
              <p className="mt-1 text-sm text-black/65">Outstanding {formatCurrency(Number(invoice.amount_due || 0))}</p>
            </div>
            <div className="rounded-2xl border border-black/10 bg-[#faf8f5] p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-black/45">Why this page exists</p>
              <p className="mt-2 text-sm leading-6 text-black/65">
                Karkhana lets businesses share bills, records, and future documents through one clean link instead of chat confusion.
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
