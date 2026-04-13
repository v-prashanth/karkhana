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
    .select("organization_id")
    .eq("id", user.id)
    .single();

  return { 
    user, 
    organizationId: profile?.organization_id || null, 
    supabase 
  };
}
