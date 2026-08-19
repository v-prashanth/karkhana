import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Load .env.local manually if process.env is missing keys
try {
  const envPath = path.resolve(process.cwd(), '.env.local');
  if (fs.existsSync(envPath)) {
    const envConfig = fs.readFileSync(envPath, 'utf8');
    envConfig.split('\n').forEach((line) => {
      const parts = line.split('=');
      if (parts.length >= 2 && !line.startsWith('#')) {
        const key = parts[0].trim();
        const value = parts.slice(1).join('=').trim();
        if (key && value && !process.env[key]) {
          process.env[key] = value;
        }
      }
    });
  }
} catch (e) {
  console.warn("Could not load .env.local file automatically:", e);
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase URL or Service Role Key in process.env");
  process.exit(1);
}

const admin = createClient(supabaseUrl, supabaseKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

const testAccounts = [
  {
    email: "manufacturing@karkhana.in",
    password: "password123",
    business_type: "manufacturing",
    name: "Sri Balaji Engineering Works",
    owner_name: "Ramesh Sharma",
    phone: "9876543210",
    gstin: "29AAACR1234A1Z1",
    tagline: "Precision CNC Machining & Job Work",
    orderLabel: "Job",
    contacts: [
      { name: "EPE Electro-Pneumatic Equipment", phone: "9876500011", type: "client", address: "Peenya Ind. Area, Bangalore" },
      { name: "Ashalube Lubricants Pvt Ltd", phone: "9876500012", type: "client", address: "Bommasandra, Bangalore" },
      { name: "Precision Tooling Suppliers", phone: "9876500013", type: "supplier", address: "Rajajinagar, Bangalore" }
    ],
    orders: [
      { description: "CNC Machining Aluminium Caps 90mm", quantity: 60, unit: "Nos", material: "Aluminium 6061", priority: "urgent", status: "in_progress", reference_no: "EPE-PO-8821" },
      { description: "Eccentric Shaft Turning & Grinding", quantity: 25, unit: "Nos", material: "EN8 Steel", priority: "normal", status: "completed", reference_no: "EPE-PO-8840" },
      { description: "Brass Bushing Turning 45mm", quantity: 200, unit: "Nos", material: "Brass", priority: "normal", status: "received", reference_no: "ASH-PO-102" }
    ],
    invoices: [
      { invoice_number: "INV-2026-001", total_amount: 45000, amount_due: 15000, status: "partial" },
      { invoice_number: "INV-2026-002", total_amount: 28500, amount_due: 0, status: "paid" }
    ]
  },
  {
    email: "autorepair@karkhana.in",
    password: "password123",
    business_type: "auto_repair",
    name: "Apex Motors & Service Garage",
    owner_name: "Vikram Singh",
    phone: "9876543220",
    gstin: "29BBBCR5678B1Z2",
    tagline: "Multibrand Auto Maintenance & Repair",
    orderLabel: "Ticket",
    contacts: [
      { name: "Rohan Varma", phone: "9876500021", type: "client", address: "Indiranagar, Bangalore" },
      { name: "Mahindra Logistics Fleet", phone: "9876500022", type: "client", address: "Whitefield, Bangalore" },
      { name: "TVS Spare Auto Parts", phone: "9876500023", type: "supplier", address: "Koramangala, Bangalore" }
    ],
    orders: [
      { description: "Engine Overhaul & Synthetic Oil Change", quantity: 1, unit: "Service", material: "Vehicle KA-01-MJ-9921", priority: "urgent", status: "in_progress", reference_no: "TCK-401" },
      { description: "AC Compressor Gas Refill & Filter Replacement", quantity: 1, unit: "Service", material: "Vehicle KA-05-AB-1234", priority: "normal", status: "completed", reference_no: "TCK-402" }
    ],
    invoices: [
      { invoice_number: "INV-2026-101", total_amount: 18500, amount_due: 0, status: "paid" },
      { invoice_number: "INV-2026-102", total_amount: 7200, amount_due: 7200, status: "sent" }
    ]
  },
  {
    email: "services@karkhana.in",
    password: "password123",
    business_type: "services",
    name: "Apex Digital & Consulting Agency",
    owner_name: "Priya Nair",
    phone: "9876543230",
    gstin: "29CCCCR9999C1Z3",
    tagline: "Cloud Infrastructure & Software Solutions",
    orderLabel: "Project",
    contacts: [
      { name: "Nexus Tech Solutions", phone: "9876500031", type: "client", address: "HSR Layout, Bangalore" },
      { name: "Horizon Retail Brands", phone: "9876500032", type: "client", address: "MG Road, Bangalore" },
      { name: "AWS Cloud Infrastructure Provider", phone: "9876500033", type: "supplier", address: "Online Services" }
    ],
    orders: [
      { description: "ERP Migration & Custom API Integration", quantity: 1, unit: "Project", material: "Software Development", priority: "urgent", status: "in_progress", reference_no: "PRJ-901" },
      { description: "Monthly Managed Cloud Security Audit", quantity: 1, unit: "Retainer", material: "Cloud Ops", priority: "normal", status: "completed", reference_no: "PRJ-902" }
    ],
    invoices: [
      { invoice_number: "INV-2026-301", total_amount: 120000, amount_due: 40000, status: "partial" },
      { invoice_number: "INV-2026-302", total_amount: 50000, amount_due: 0, status: "paid" }
    ]
  },
  {
    email: "trading@karkhana.in",
    password: "password123",
    business_type: "trading",
    name: "Bharat Industrial Supplies & Wholesale",
    owner_name: "Suresh Gupta",
    phone: "9876543240",
    gstin: "29DDDDR4444D1Z4",
    tagline: "Wholesale Fasteners, Bearings & Hardware",
    orderLabel: "Order",
    contacts: [
      { name: "Metro Infrastructure Builders", phone: "9876500041", type: "client", address: "Electronic City, Bangalore" },
      { name: "Southern Steel Mills", phone: "9876500042", type: "supplier", address: "Bellary, KA" }
    ],
    orders: [
      { description: "High-Tensile Hex Bolts M16 x 65mm", quantity: 5000, unit: "Nos", material: "Grade 8.8 Steel", priority: "normal", status: "in_progress", reference_no: "ORD-701" },
      { description: "SKF Ball Bearings 6204-2RSH", quantity: 200, unit: "Nos", material: "Steel", priority: "urgent", status: "completed", reference_no: "ORD-702" }
    ],
    invoices: [
      { invoice_number: "INV-2026-401", total_amount: 84000, amount_due: 84000, status: "sent" }
    ]
  }
];

async function seedTestUsers() {
  console.log("🚀 Seeding Multi-Business Test Accounts in Karkhana...\n");

  for (const acc of testAccounts) {
    console.log(`----------------------------------------`);
    console.log(`Processing: ${acc.name} (${acc.business_type})...`);

    // 1. Create or Find Auth User
    let { data: usersData } = await admin.auth.admin.listUsers();
    let authUser = usersData?.users?.find(u => u.email === acc.email);

    if (authUser) {
      console.log(`  ✓ Auth user exists: ${acc.email}`);
    } else {
      console.log(`  + Creating Auth User: ${acc.email}`);
      const { data: newAuth, error: authErr } = await admin.auth.admin.createUser({
        email: acc.email,
        password: acc.password,
        email_confirm: true,
        user_metadata: { name: acc.owner_name }
      });
      if (authErr) {
        console.error(`  ✕ Error creating auth user for ${acc.email}:`, authErr.message);
        continue;
      }
      authUser = newAuth.user;
    }

    // 2. Create or Find Organization
    let { data: existingOrg } = await admin.from('organizations').select('id').eq('email', acc.email).single();
    let orgId;

    if (existingOrg) {
      orgId = existingOrg.id;
      console.log(`  ✓ Organization exists.`);
      // Update business type
      await admin.from('organizations').update({
        business_type: acc.business_type,
        order_label: acc.orderLabel
      }).eq('id', orgId);
    } else {
      console.log(`  + Creating Organization (${acc.business_type})...`);
      const { data: newOrg, error: orgErr } = await admin.from('organizations').insert({
        name: acc.name,
        owner_name: acc.owner_name,
        phone: acc.phone,
        email: acc.email,
        gstin: acc.gstin,
        business_type: acc.business_type,
        order_label: acc.orderLabel,
        is_verified: true,
        financial_year: "2026-27",
        total_revenue: acc.invoices.reduce((acc, inv) => acc + (inv.total_amount - inv.amount_due), 0),
        total_outstanding: acc.invoices.reduce((acc, inv) => acc + inv.amount_due, 0)
      }).select('id').single();

      if (orgErr) {
        console.error(`  ✕ Error creating org:`, orgErr.message);
        continue;
      }
      orgId = newOrg.id;
    }

    // 3. Upsert User Profile
    await admin.from('users').upsert({
      id: authUser.id,
      organization_id: orgId,
      name: acc.owner_name,
      email: acc.email,
      phone: acc.phone,
      role: 'owner',
      is_active: true
    }, { onConflict: 'id' });

    // 4. Seed Contacts
    const contactMap = new Map();
    for (const c of acc.contacts) {
      const { data: contactData } = await admin.from('contacts').upsert({
        organization_id: orgId,
        name: c.name,
        phone: c.phone,
        type: c.type,
        address: c.address
      }, { onConflict: 'phone,organization_id' }).select('id, name').single();

      if (contactData) {
        contactMap.set(c.name, contactData.id);
      }
    }
    console.log(`  ✓ Seeded ${acc.contacts.length} Contacts.`);

    // 5. Seed Orders / Work
    const clientContactId = Array.from(contactMap.values())[0] || null;
    for (const ord of acc.orders) {
      await admin.from('orders').insert({
        organization_id: orgId,
        contact_id: clientContactId,
        order_number: `${acc.orderLabel.toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`,
        description: ord.description,
        quantity: ord.quantity,
        unit: ord.unit,
        material: ord.material,
        priority: ord.priority,
        status: ord.status,
        reference_no: ord.reference_no,
        due_date: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0]
      });
    }
    console.log(`  ✓ Seeded ${acc.orders.length} Work Orders (${acc.orderLabel}s).`);

    // 6. Seed Invoices
    for (const inv of acc.invoices) {
      await admin.from('invoices').insert({
        organization_id: orgId,
        contact_id: clientContactId,
        invoice_number: inv.invoice_number,
        issue_date: new Date().toISOString().split('T')[0],
        due_date: new Date(Date.now() + 15 * 86400000).toISOString().split('T')[0],
        subtotal: inv.total_amount,
        tax_total: inv.total_amount * 0.18,
        total_amount: inv.total_amount,
        amount_paid: inv.total_amount - inv.amount_due,
        amount_due: inv.amount_due,
        status: inv.status
      });
    }
    console.log(`  ✓ Seeded Invoices.`);

    // 7. Seed Job Work Challans (For Manufacturing org)
    if (acc.business_type === 'manufacturing') {
      try {
        const today = new Date();
        const past340 = new Date(today.getTime() - 340 * 86400000).toISOString().split('T')[0];
        const past200 = new Date(today.getTime() - 200 * 86400000).toISOString().split('T')[0];
        const past30 = new Date(today.getTime() - 30 * 86400000).toISOString().split('T')[0];

        const { data: jwc1 } = await admin.from('job_work_challans').insert({
          organization_id: orgId,
          contact_id: clientContactId,
          challan_number: "JWC-2026-001",
          challan_date: past340,
          dispatch_date: past340,
          expiry_date: new Date(new Date(past340).getTime() + 365 * 86400000).toISOString().split('T')[0],
          role_type: "PRINCIPAL_OUTWARD",
          principal_name: acc.name,
          principal_gstin: acc.gstin,
          job_worker_name: "EPE Engineering Job Work Div.",
          job_worker_gstin: "29AAACE9999E1Z9",
          nature_of_processing: "CNC Milling & Hard Anodizing",
          total_taxable_value: 75000,
          status: "OPEN",
          notes: "⚠ Expiring in 25 days! CGST Sec. 143 action required."
        }).select('id').single();

        if (jwc1) {
          await admin.from('job_work_items').insert([
            { challan_id: jwc1.id, item_name: "Aluminium Enclosure Housing", sent_qty: 100, returned_qty: 40, scrap_qty: 0, uom: "Nos", unit_taxable_value: 750 }
          ]);
        }

        const { data: jwc2 } = await admin.from('job_work_challans').insert({
          organization_id: orgId,
          contact_id: clientContactId,
          challan_number: "JWC-2026-002",
          challan_date: past200,
          dispatch_date: past200,
          expiry_date: new Date(new Date(past200).getTime() + 365 * 86400000).toISOString().split('T')[0],
          role_type: "PRINCIPAL_OUTWARD",
          principal_name: acc.name,
          principal_gstin: acc.gstin,
          job_worker_name: "Precision Heat Treaters Bangalore",
          job_worker_gstin: "29BBBP9876P1Z4",
          nature_of_processing: "Vacuum Heat Treatment (HRC 58-60)",
          total_taxable_value: 32000,
          status: "PARTIALLY_RETURNED",
          notes: "Material partially returned after heat treatment."
        }).select('id').single();

        if (jwc2) {
          await admin.from('job_work_items').insert([
            { challan_id: jwc2.id, item_name: "EN31 Die Steel Pins", sent_qty: 500, returned_qty: 350, scrap_qty: 10, uom: "Nos", unit_taxable_value: 64 }
          ]);
        }

        console.log(`  ✓ Seeded Job Work Challans (CGST Sec. 143 tracker populated).`);
      } catch (err) {
        console.log(`  ℹ Skipping Job Work seed (tables not yet created on live DB):`, err.message);
      }
    }
  }

  console.log(`\n========================================`);
  console.log(`✅ Multi-Business Test Accounts Ready!`);
  console.log(`========================================\n`);
  console.log(`Login Credentials for Testing:\n`);
  console.log(`1️⃣  MANUFACTURING (SVEW):`);
  console.log(`    Email: manufacturing@karkhana.in | Password: password123\n`);
  console.log(`2️⃣  AUTO REPAIR (GARAGE):`);
  console.log(`    Email: autorepair@karkhana.in | Password: password123\n`);
  console.log(`3️⃣  SERVICES (AGENCY):`);
  console.log(`    Email: services@karkhana.in | Password: password123\n`);
  console.log(`4️⃣  TRADING (WHOLESALE):`);
  console.log(`    Email: trading@karkhana.in | Password: password123\n`);
}

seedTestUsers().catch(console.error);
