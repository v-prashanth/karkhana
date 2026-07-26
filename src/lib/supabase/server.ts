import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { getSupabaseBrowserEnv } from '@/lib/supabase/env';

export function createServerSupabaseClient() {
  const cookieStore = cookies();
  const { url, anonKey } = getSupabaseBrowserEnv();

  return createServerClient(
    url,
    anonKey,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options });
          } catch {
            // This can be ignored in server components
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: '', ...options });
          } catch {
            // This can be ignored in server components
          }
        },
      },
    }
  );
}

export async function getSecureServerSession() {
  const supabase = createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return { user: null, organizationId: null, supabase };
  }

  const { data: profile } = await supabase
    .from("users")
    .select("organization_id, role")
    .eq("id", user.id)
    .single();

  return { 
    user, 
    organizationId: profile?.organization_id || null, 
    role: profile?.role || null,
    supabase 
  };
}

// Helper: get authenticated user
// Use in EVERY API route
export const getAuthenticatedUser = async () => {
  const supabase = createServerSupabaseClient();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return { user: null, error: "Unauthorized" };
  }

  return { user, error: null };
};

// Helper: get org from session
// NEVER trust orgId from request
export const getOrganizationId = async (): Promise<string | null> => {
  const supabase = createServerSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data } = await supabase
    .from("users")
    .select("organization_id")
    .eq("id", user.id)
    .single();

  return data?.organization_id ?? null;
};

export { createServerSupabaseClient as createClient };

