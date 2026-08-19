import { NextResponse } from "next/server";
import { rateLimit, LIMITS } from "@/lib/api/security/rate-limit";
import { securityLogger } from "@/lib/api/security/logger";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import validator from "validator";

function sanitize(str: string) { return str.replace(/<[^>]*>/g, "").trim(); }

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    const sanitizedEmail = sanitize(email || "").toLowerCase();
    if (!validator.isEmail(sanitizedEmail) || !password) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 400 });
    }

    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "127.0.0.1";
    const userAgent = request.headers.get("user-agent") || "unknown";

    // Rate Limiting: 5 attempts per 15 min per IP
    const ipLimitKey = `login:${ip}`;
    const rl = await rateLimit(ipLimitKey, LIMITS.LOGIN_ATTEMPTS.limit, LIMITS.LOGIN_ATTEMPTS.window);

    if (!rl.success) {
      await securityLogger.log({
        identifier: sanitizedEmail,
        eventType: "account_locked",
        ipAddress: ip,
        userAgent,
        details: { reason: "too_many_attempts" }
      });
      return NextResponse.json({ 
        error: "Too many attempts. Try again in 15 minutes." 
      }, { status: 429 });
    }

    // Setup Supabase Client
    const cookieStore = cookies();
    const supabase = createServerClient(
      supabaseUrl,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
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

    // Attempt Login
    const { data, error } = await supabase.auth.signInWithPassword({
      email: sanitizedEmail,
      password,
    });

    if (error) {
      await securityLogger.log({
        identifier: sanitizedEmail,
        eventType: "login_failed",
        ipAddress: ip,
        userAgent,
        details: { reason: "invalid_credentials" }
      });
      return NextResponse.json({ error: "Incorrect email or password" }, { status: 401 });
    }

    await securityLogger.log({
      userId: data.user.id,
      identifier: sanitizedEmail,
      eventType: "login_success",
      ipAddress: ip,
      userAgent,
      details: { method: "email_password" }
    });

    return NextResponse.json({ success: true, user: data.user, session: data.session });
  } catch (error) {
    console.error("Login Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
