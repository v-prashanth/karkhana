"use client";

import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useStore } from "@/store/useStore";

const supabase = createClient();

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { setAuthHydrated, setOrganization, setUser } = useStore();

  useEffect(() => {
    let mounted = true;

    const syncProfile = async () => {
      try {
        const response = await fetch("/api/auth/profile", { cache: "no-store" });
        const payload = await response.json();

        if (!mounted) return;

        if (response.ok) {
          setUser(payload.user ?? null);
          setOrganization(payload.organization ?? null);
        } else {
          
          // Clear stale local/demo state if the real session cannot be resolved.
          setUser(null);
          setOrganization(null);
        }
      } catch {
        if (!mounted) return;
        setUser(null);
        setOrganization(null);
      } finally {
        if (mounted) {
          setAuthHydrated(true);
        }
      }
    };

    syncProfile();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        // Recovery link was clicked — redirect to the password update page.
        // This handles the hash-fragment flow where Supabase appends
        // #access_token=...&type=recovery to the URL.
        window.location.href = '/update-password';
        return;
      }

      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
         // Give the browser time to persist session cookies before the
         // server-side /api/auth/profile reads them from the request headers.
         // NOTE: We no longer set authHydrated=false here to avoid the
         // skeleton flash on protected pages during registration redirect.
         setTimeout(() => {
           syncProfile();
         }, 150);
      } else if (event === 'SIGNED_OUT') {
         setUser(null);
         setOrganization(null);
         setAuthHydrated(true);
      } else {
         syncProfile();
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [setAuthHydrated, setOrganization, setUser]);

  return <>{children}</>;
}
