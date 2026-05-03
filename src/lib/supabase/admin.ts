// Admin client
// ONLY for:
// → Initial user creation
// → Background jobs
// → Server-side migrations
// NEVER in user-facing API routes

import { createClient } from "@supabase/supabase-js";

export const createAdminClient = () =>
  createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
