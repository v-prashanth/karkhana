require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function check() {
  const { data: authUser, error: authError } = await supabase.auth.admin.listUsers();
  const user = authUser?.users.find(u => u.email === "myselfai@outlook.com");
  console.log("Auth user:", user ? user.id : "Not found", authError || "");

  if (user) {
    const { data: publicUser, error: publicError } = await supabase.from('users').select('*').eq('id', user.id).single();
    console.log("Public user:", publicUser, publicError || "");
  }
}

check();
