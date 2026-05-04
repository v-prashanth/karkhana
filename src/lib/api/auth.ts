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
   * Step 1: Request SMS OTP
   */
  async signInWithPhone(phone: string) {
    const supabase = createClient();
    const normalizedPhone = phone.startsWith("+91") ? phone : `+91${phone.replace(/\D/g, "")}`;
    const { data, error } = await supabase.auth.signInWithOtp({
      phone: normalizedPhone,
      options: { channel: 'sms' },
    });
    if (error) throw error;
    return data;
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
   *
   * Flow:
   *   1. Send code to server → server validates against email_auth_codes table
   *   2. Server generates a hashed_token via Supabase Admin API
   *   3. Client uses that hashed_token with supabase.auth.verifyOtp()
   *      to establish the session DIRECTLY in browser cookies
   *   4. No redirects, no hash fragments, no magic link navigation
   */
  async verifyEmailOtp(email: string, code: string) {
    // 1. Server validates the custom OTP and returns a hashed_token
    const response = await fetch("/api/auth/email-otp/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, code }),
    });
    const payload = await response.json();
    if (!response.ok) throw new Error(payload.error || "Could not verify login code");

    // 2. Use the hashed_token to establish session in the browser
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
   * Sign in with identifier (email or phone) + password
   */
  async signInWithPassword(identifier: string, pass: string) {
    const supabase = createClient();
    const isEmail = identifier.includes("@");
    const credentials = isEmail 
      ? { email: identifier, password: pass } 
      : { phone: identifier.startsWith("+91") ? identifier : `+91${identifier.replace(/\D/g, "")}`, password: pass };
      
    const { data, error } = await supabase.auth.signInWithPassword(credentials);
    if (error) throw error;
    return data;
  },

  /**
   * Sign up with identifier (email or phone) + password
   */
  async signUpWithPassword(identifier: string, pass: string) {
    const supabase = createClient();
    const isEmail = identifier.includes("@");
    const credentials = isEmail 
      ? { email: identifier, password: pass } 
      : { phone: identifier.startsWith("+91") ? identifier : `+91${identifier.replace(/\D/g, "")}`, password: pass };
      
    const { data, error } = await supabase.auth.signUp({
      ...credentials,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (error) throw error;
    return data;
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
