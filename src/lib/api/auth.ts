import { createClient } from '@/lib/supabase/client';

/**
 * Authentication API — v2 (Rewritten for session reliability)
 *
 * KEY PRINCIPLE: Every auth flow must establish the session
 * DIRECTLY in the browser via the Supabase client library.
 * Never navigate to external URLs or rely on hash-fragment tokens.
 */
export const authApi = {
  /**
   * Check if a user with this email/phone already exists in public.users
   */
  async checkUserExists(identifier: string) {
    const response = await fetch("/api/auth/check", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ identifier }),
    });
    const payload = await response.json();
    return Boolean(payload.exists);
  },

  // ─── PHONE AUTH ─────────────────────────────────────────────

  /**
   * Step 1: Request SMS OTP via secure proxy
   */
  async signInWithPhone(phone: string) {
    const normalizedPhone = phone.startsWith("+91") ? phone.replace("+91", "") : phone.replace(/\D/g, "");
    
    const response = await fetch("/api/auth/phone/request-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone: normalizedPhone }),
    });
    
    const payload = await response.json();
    if (!response.ok) throw new Error(payload.error || "Could not send verification code");
    
    return payload;
  },

  /**
   * Step 2: Verify SMS OTP → establishes session in browser
   */
  async verifyOtp(phone: string, token: string) {
    const supabase = createClient();
    const normalizedPhone = phone.startsWith("+91") ? phone : `+91${phone.replace(/\D/g, "")}`;
    const { data, error } = await supabase.auth.verifyOtp({
      phone: normalizedPhone,
      token,
      type: 'sms',
    });
    if (error) throw error;
    return data;
  },

  // ─── EMAIL OTP AUTH ─────────────────────────────────────────

  /**
   * Step 1: Request custom email OTP (sent via our SMTP)
   */
  async requestEmailOtp(email: string) {
    const response = await fetch("/api/auth/email-otp/request", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    const payload = await response.json();
    if (!response.ok) throw new Error(payload.error || "Could not send login code");
    return payload;
  },

  /**
   * Step 2: Verify email OTP → establishes session in browser
   */
  async verifyEmailOtp(email: string, code: string) {
    const response = await fetch("/api/auth/email-otp/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, code }),
    });
    const payload = await response.json();
    if (!response.ok) throw new Error(payload.error || "Could not verify login code");

    const supabase = createClient();
    const { data, error } = await supabase.auth.verifyOtp({
      token_hash: payload.token_hash,
      type: 'magiclink',
    });

    if (error) {
      throw new Error("Verification succeeded but session could not be created. Please try again.");
    }

    return data;
  },

  // ─── PASSWORD AUTH (EMAIL & PHONE) ────────────────────────────────────

  /**
   * Sign in with identifier (email or phone) + password via secure proxy
   */
  async signInWithPassword(identifier: string, pass: string) {
    const isEmail = identifier.includes("@");
    const credentials = isEmail 
      ? { email: identifier, password: pass } 
      : { phone: identifier.startsWith("+91") ? identifier : `+91${identifier.replace(/\D/g, "")}`, password: pass };
      
    // Since our proxy currently only handles email explicitly in naming but we can pass email to it.
    // Wait, the proxy we built is /api/auth/email/login but the payload takes { email, password }.
    // If it's a phone, we need to handle it. Actually, Karkhana Phase 1 spec explicitly stated:
    // Method 1: Phone + OTP. Method 2: Email + Password.
    // So signInWithPassword will only be used for Email + Password now!
    const response = await fetch("/api/auth/email/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: identifier, password: pass }),
    });
    
    const payload = await response.json();
    if (!response.ok) throw new Error(payload.error || "Login failed");
    
    // Establish session in the browser immediately to sync state
    if (payload.session) {
      const supabase = createClient();
      await supabase.auth.setSession({
        access_token: payload.session.access_token,
        refresh_token: payload.session.refresh_token,
      });
    }
    
    return payload;
  },

  /**
   * Sign up with email + password via secure proxy
   */
  async signUpWithPassword(identifier: string, pass: string) {
    const response = await fetch("/api/auth/email/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: identifier, password: pass }),
    });
    
    const payload = await response.json();
    if (!response.ok) throw new Error(payload.error || "Registration failed");
    
    // Establish session in the browser immediately to sync state
    if (payload.session) {
      const supabase = createClient();
      await supabase.auth.setSession({
        access_token: payload.session.access_token,
        refresh_token: payload.session.refresh_token,
      });
    }
    
    return payload;
  },

  // ─── GOOGLE OAUTH ──────────────────────────────────────────

  async signInWithGoogle() {
    const supabase = createClient();
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    });
    if (error) throw error;
    return data;
  },

  // ─── PASSWORD RESET ────────────────────────────────────────

  async resetPassword(email: string) {
    const response = await fetch("/api/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    const payload = await response.json();
    if (!response.ok) throw new Error(payload.error || "Could not send reset link");
  },

  // ─── SIGN OUT ──────────────────────────────────────────────

  async signOut() {
    const supabase = createClient();
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  // ─── SESSION HELPERS ───────────────────────────────────────

  async getCurrentSession() {
    const supabase = createClient();
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error) throw error;
    if (!session) return null;

    const { data: profile } = await supabase
      .from('users')
      .select('*, organization:organizations(*)')
      .eq('id', session.user.id)
      .single();

    return {
      user: session.user,
      profile,
      organization: profile?.organization,
    };
  },
};
