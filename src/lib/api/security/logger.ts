import { createClient } from "@supabase/supabase-js";

// We use the service role key to bypass RLS when writing logs from the server
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Fallback to anon key if service key is missing during local dev
const supabase = createClient(
  supabaseUrl,
  supabaseServiceKey || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export type SecurityEventType = 
  | 'login_success'
  | 'login_failed'
  | 'password_changed'
  | '2fa_enabled'
  | 'session_revoked'
  | 'account_locked'
  | 'registration_success'
  | 'otp_requested'
  | 'password_reset_requested';

interface LogSecurityEventParams {
  userId?: string; // Optional because failed logins might not have a resolved user ID
  identifier?: string; // Email or phone number attempted
  eventType: SecurityEventType;
  ipAddress?: string;
  userAgent?: string;
  location?: string;
  details?: Record<string, any>;
}

export const securityLogger = {
  async log(params: LogSecurityEventParams) {
    try {
      const { userId, eventType, ipAddress, userAgent, location, details, identifier } = params;
      
      const payload = {
        user_id: userId || null,
        event_type: eventType,
        ip_address: ipAddress || 'unknown',
        user_agent: userAgent || 'unknown',
        location: location || 'unknown',
        details: {
          ...details,
          identifier,
        }
      };

      const { error } = await supabase
        .from('security_logs')
        .insert([payload]);

      if (error) {
        // If the table doesn't exist yet, we just console error so we don't crash auth flows
        console.error("Failed to write to security_logs table:", error.message);
      }
    } catch (err) {
      console.error("Error in securityLogger:", err);
    }
  }
};
