import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";

try {
  const envPath = path.resolve(process.cwd(), ".env.local");
  if (fs.existsSync(envPath)) {
    const envConfig = fs.readFileSync(envPath, "utf8");
    envConfig.split("\n").forEach((line) => {
      const parts = line.split("=");
      if (parts.length >= 2 && !line.startsWith("#")) {
        const key = parts[0].trim();
        const value = parts.slice(1).join("=").trim();
        if (key && value && !process.env[key]) {
          process.env[key] = value;
        }
      }
    });
  }
} catch (e) {}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const admin = createClient(supabaseUrl, supabaseKey);

async function seedAllOrganizations() {
  console.log("🚀 Seeding invoices, contacts, jobs & challans into ALL registered organizations...");

  const { data: orgs } = await admin.from("organizations").select("id, name, email");
  
  if (!orgs || orgs.length === 0) {
    console.error("No organizations found!");
    return;
  }

  for (const org of orgs) {
    console.log(`\n----------------------------------------`);
    console.log(`Seeding Org: "${org.name}" [${org.id}] (${org.email || 'no email'})...`);

    // 1. Seed Contacts
    const { data: c1 } = await admin.from("contacts").upsert({
      organization_id: org.id,
      name: "EPE Process Filters & Accumulators Pvt. Ltd.",
      type: "client",
      phone: "040-23085750",
      email: "purchase@epe-india.com",
      address: "Plot 42, Phase 3, IDA Jeedimetla, Hyderabad"
    }, { onConflict: "phone,organization_id" }).select("id").single();

    const { data: c2 } = await admin.from("contacts").upsert({
      organization_id: org.id,
      name: "Asha Lube Solutions Pvt. Ltd.",
      type: "client",
      phone: "+91 9949073322",
      email: "krishna@ashalube.com",
      address: "Unit 12, Balanagar Industrial Estate, Hyderabad"
    }, { onConflict: "phone,organization_id" }).select("id").single();

    const contactEpeId = c1?.id || null;
    const contactAshaId = c2?.id || null;

    console.log(`  ✓ Contacts ready`);

    // 2. Seed Jobs
    const { data: j1 } = await admin.from("orders").insert({
      organization_id: org.id,
      contact_id: contactEpeId,
      order_number: "JOB-2026-001",
      description: "CNC Machining High-Pressure Filter End Caps 90mm",
      quantity: 100,
      unit: "Nos",
      material: "Aluminium 6061-T6",
      priority: "urgent",
      status: "in_progress",
      reference_no: "EPE-PO-8821",
      due_date: new Date(Date.now() + 5 * 86400000).toISOString().split("T")[0],
      notes: "Hard anodizing 25 microns required after turning."
    }).select("id").single();

    const { data: j2 } = await admin.from("orders").insert({
      organization_id: org.id,
      contact_id: contactAshaId,
      order_number: "JOB-2026-002",
      description: "Eccentric Pump Shaft Turning & Grinding",
      quantity: 40,
      unit: "Nos",
      material: "EN8 Steel",
      priority: "normal",
      status: "completed",
      reference_no: "ASH-PO-904",
      due_date: new Date(Date.now() - 2 * 86400000).toISOString().split("T")[0],
      notes: "Induction hardened journals HRC 55."
    }).select("id").single();

    console.log(`  ✓ Jobs ready`);

    // 3. Seed Invoices (Tax Bills)
    await admin.from("invoices").insert([
      {
        organization_id: org.id,
        contact_id: contactEpeId,
        order_id: j1?.id || null,
        invoice_number: "INV-233",
        date: new Date(Date.now() - 10 * 86400000).toISOString().split("T")[0],
        due_date: new Date(Date.now() + 35 * 86400000).toISOString().split("T")[0],
        reference_number: "EPE-PO-8821",
        subtotal: 45000,
        taxable_amount: 45000,
        total: 53100,
        total_amount: 53100,
        amount_paid: 0,
        amount_due: 53100,
        status: "sent",
        notes: "Payment due within 45 days as per agreement."
      },
      {
        organization_id: org.id,
        contact_id: contactAshaId,
        order_id: j2?.id || null,
        invoice_number: "INV-234",
        date: new Date(Date.now() - 3 * 86400000).toISOString().split("T")[0],
        due_date: new Date(Date.now() + 27 * 86400000).toISOString().split("T")[0],
        reference_number: "ASH-PO-904",
        subtotal: 28500,
        taxable_amount: 28500,
        total: 33630,
        total_amount: 33630,
        amount_paid: 33630,
        amount_due: 0,
        status: "paid",
        notes: "Paid in full via Bank Transfer."
      }
    ]);

    console.log(`  ✓ Invoices (INV-233 & INV-234) created`);

    // 4. Seed Job Work Challans
    try {
      const today = new Date();
      const past340 = new Date(today.getTime() - 340 * 86400000).toISOString().split("T")[0];

      const { data: jwc } = await admin.from("job_work_challans").insert({
        organization_id: org.id,
        contact_id: contactEpeId,
        challan_number: "DC-240",
        challan_date: past340,
        dispatch_date: past340,
        expiry_date: new Date(new Date(past340).getTime() + 365 * 86400000).toISOString().split("T")[0],
        role_type: "PRINCIPAL_OUTWARD",
        principal_name: org.name || "Sri Vishwakarma Engineering Works",
        job_worker_name: "EPE Engineering Job Work Div.",
        nature_of_processing: "CNC Turning & Hard Anodizing",
        total_taxable_value: 85000,
        status: "OPEN",
        notes: "⚠ CRITICAL: 25 days remaining before 1-year CGST Sec. 143 Deemed Supply deadline!"
      }).select("id").single();

      if (jwc) {
        await admin.from("job_work_items").insert({
          challan_id: jwc.id,
          item_name: "Hydraulic Valve Block Steel Casting",
          hsn_code: "8481",
          sent_qty: 120,
          returned_qty: 50,
          scrap_qty: 2,
          uom: "Nos",
          unit_taxable_value: 708.33,
          total_taxable_value: 85000
        });
      }
      console.log(`  ✓ Job Work Challans (DC-240) created`);
    } catch (e) {
      console.log(`  ℹ Skipped job work (tables pending catchup SQL)`);
    }
  }

  console.log(`\n========================================`);
  console.log(`✅ Invoices & Bills populated for ALL user accounts!`);
  console.log(`========================================\n`);
}

seedAllOrganizations().catch(console.error);
