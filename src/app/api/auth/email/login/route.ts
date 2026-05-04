import { NextResponse } from "next/server";
import { rateLimit, LIMITS } from "@/lib/api/security/rate-limit";
import { securityLogger } from "@/lib/api/security/logger";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import DOMPurify from "isomorphic-dompurify";
import validator from "validator";

// Fallback to anon key if service key is missing
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    const sanitizedEmail = DOMPurify.sanitize(email || "").trim().toLowerCase();
    if (!validator.isEmail(sanitizedEmail) || !password) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 400 });
    }

    const ip = request.headers.get("x-forwarded-for") || "unknown";
    const userAgent = request.headers.get("user-agent") || "unknown";

    // 1. Rate Limiting / Lockout Check
    // We limit by both IP and email to prevent brute forcing
    const ipLimitKey = `login_ip:${ip}`;
    const emailLimitKey = `login_email:${sanitizedEmail}`;
    
    const [ipRl, emailRl] = await Promise.all([
      rateLimit(ipLimitKey, LIMITS.LOGIN_ATTEMPTS.limit, LIMITS.LOGIN_ATTEMPTS.window),
      rateLimit(emailLimitKey, LIMITS.LOGIN_ATTEMPTS.limit, LIMITS.LOGIN_ATTEMPTS.window)
    ]);

    if (!ipRl.success || !emailRl.success) {
      await securityLogger.log({
        identifier: sanitizedEmail,
        eventType: "account_locked",
        ipAddress: ip,
        userAgent,
        details: { reason: "too_many_attempts" }
      });
      return NextResponse.json({ 
        error: "Too many failed attempts. Account locked for 15 minutes." 
      }, { status: 429 });
    }

    // 2. Setup Supabase Client to automatically handle cookies
    const cookieStore = cookies();
    const supabase = createServerClient(
      supabaseUrl,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, // Use anon key for user login to respect normal flow
      {
        cookies: {
          get(name: string) { return cookieStore.get(name)?.value; },
          set(name: string, value: string, options: any) {
            cookieStore.set({ name, value, ...options });
          },
          remove(name: string, options: any) {
            cookieStore.set({ name, value: '', ...options });
          },
        },
      }
    );

    // 3. Attempt Login
    const { data, error } = await supabase.auth.signInWithPassword({
      email: sanitizedEmail,
      password,
    });

    if (error) {
      // Log failed attempt
      await securityLogger.log({
        identifier: sanitizedEmail,
        eventType: "login_failed",
        ipAddress: ip,
        userAgent,
        details: { reason: "invalid_credentials" }
      });
      // Generic error message
      return NextResponse.json({ error: "Incorrect email or password" }, { status: 401 });
    }

    // 4. Log success
    await securityLogger.log({
      userId: data.user.id,
      identifier: sanitizedEmail,
      eventType: "login_success",
      ipAddress: ip,
      userAgent,
      details: { method: "email_password" }
    });

    // Note: In Phase 3, we will add 2FA logic here before returning success
    // If 2FA is enabled, we would NOT set the final cookie yet, but return { requires2FA: true }

    return NextResponse.json({ success: true, user: data.user, session: data.session });
  } catch (error) {
    console.error("Login Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
