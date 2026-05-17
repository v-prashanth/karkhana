import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase URL or Service Role Key in .env.local");
  process.exit(1);
}

const admin = createClient(supabaseUrl, supabaseKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function seedDemoAccount() {
  console.log("Seeding Karkhana Demo Account...");

  const demoEmail = "demo@karkhana.in";
  const demoPassword = "demo1234";

  // 1. Setup Auth User
  let { data: users, error: listError } = await admin.auth.admin.listUsers();
  let authUser = users?.users?.find(u => u.email === demoEmail);

  if (authUser) {
    console.log("Demo auth user already exists.");
  } else {
    console.log("Creating new demo auth user...");
    const { data: newAuthUser, error: authError } = await admin.auth.admin.createUser({
      email: demoEmail,
      password: demoPassword,
      email_confirm: true,
      user_metadata: { name: "Demo User" }
    });
    if (authError) throw authError;
    authUser = newAuthUser.user;
  }

  const userId = authUser.id;

  // 2. Setup Organization
  let { data: existingOrg } = await admin.from('organizations').select('id').eq('email', demoEmail).single();
  let orgId;

  if (existingOrg) {
    orgId = existingOrg.id;
    console.log("Demo organization exists.");
  } else {
    console.log("Creating Demo Organization...");
    const { data: newOrg, error: orgError } = await admin.from('organizations').insert({
      name: "Sri Balaji Engineering Works",
      owner_name: "Ramesh Sharma",
      address: "Phase 1, Industrial Area, Peenya, Bangalore",
      phone: "9876543210",
      email: demoEmail,
      gstin: "29AAACR1234A1Z1",
      tagline: "Precision CNC Machining & Fabrication",
      year_established: 2005,
      employee_count: "15-25",
      is_verified: true,
      document_template: "modern",
      invoice_prefix: "INV",
      invoice_counter: 104,
      dc_prefix: "DC",
      dc_counter: 50,
      financial_year: "2026-27"
    }).select('id').single();
    
    if (orgError) throw orgError;
    orgId = newOrg.id;
  }

  // 3. Link User to Organization
  await admin.from('users').upsert({
    id: userId,
    organization_id: orgId,
    name: "Ramesh Sharma",
    email: demoEmail,
    role: "owner",
    phone: "9876543210",
    is_active: true
  }, { onConflict: 'id' });

  // 4. Create Contacts
  console.log("Creating Contacts...");
  const contacts = [
    { name: "Tata Motors Ltd", phone: "9876500001", type: "client", address: "Pune, MH" },
    { name: "TechNova Systems", phone: "9876500002", type: "client", address: "Bangalore, KA" },
    { name: "Global Steel Suppliers", phone: "9876500003", type: "supplier", address: "Mumbai, MH" }
  ];

  const contactIds = [];
  for (const c of contacts) {
    const { data, error } = await admin.from('contacts').upsert({
      organization_id: orgId,
      name: c.name,
      phone: c.phone,
      type: c.type,
      address: c.address
    }, { onConflict: 'phone,organization_id' }).select('id').single();
    if (!error && data) contactIds.push(data.id);
  }

  // 5. Create Invoices
  console.log("Creating Invoices...");
  const today = new Date().toISOString().split('T')[0];
  
  if (contactIds.length >= 2) {
    await admin.from('invoices').insert([
      {
        organization_id: orgId,
        contact_id: contactIds[0],
        invoice_number: "INV/101",
        date: today,
        due_date: today,
        status: "paid",
        subtotal: 50000,
        taxable_amount: 50000,
        cgst_rate: 9,
        cgst_amount: 4500,
        sgst_rate: 9,
        sgst_amount: 4500,
        total: 59000,
        amount_due: 0,
        amount_paid: 59000
      },
      {
        organization_id: orgId,
        contact_id: contactIds[1],
        invoice_number: "INV/102",
        date: today,
        due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        status: "sent",
        subtotal: 125000,
        taxable_amount: 125000,
        cgst_rate: 9,
        cgst_amount: 11250,
        sgst_rate: 9,
        sgst_amount: 11250,
        total: 147500,
        amount_due: 147500,
        amount_paid: 0
      }
    ]);
  }

  // 6. Create Expenses
  console.log("Creating Expenses...");
  await admin.from('expenses').insert({
    organization_id: orgId,
    category: "Electricity",
    amount: 12500,
    date: today,
    payment_method: "upi",
    description: "Factory BESCOM Bill"
  });

  console.log("✅ Demo Account Seeded Successfully!");
  console.log("========================================");
  console.log("Email: demo@karkhana.in");
  console.log("Password: demo1234");
  console.log("========================================");
}

seedDemoAccount().catch(console.error);
