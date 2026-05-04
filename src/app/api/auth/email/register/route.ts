import { NextResponse } from "next/server";
import { rateLimit, LIMITS } from "@/lib/api/security/rate-limit";
import { securityLogger } from "@/lib/api/security/logger";
import { isPasswordPwned } from "@/lib/api/security/pwned";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import DOMPurify from "isomorphic-dompurify";
import validator from "validator";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password, name } = body;

    // 1. Sanitize & Validate
    const sanitizedEmail = DOMPurify.sanitize(email || "").trim().toLowerCase();
    const sanitizedName = DOMPurify.sanitize(name || "").trim();

    if (!validator.isEmail(sanitizedEmail)) {
      return NextResponse.json({ error: "Invalid email format" }, { status: 400 });
    }

    if (!password || password.length < 8 || password.length > 64) {
      return NextResponse.json({ error: "Password must be between 8 and 64 characters" }, { status: 400 });
    }

    // 2. Rate Limiting (by IP for registration)
    const ip = request.headers.get("x-forwarded-for") || "unknown";
    const rateLimitKey = `register:${ip}`;
    const rl = await rateLimit(rateLimitKey, LIMITS.EMAIL_REGISTER.limit, LIMITS.EMAIL_REGISTER.window);

    if (!rl.success) {
      await securityLogger.log({
        identifier: sanitizedEmail,
        eventType: "registration_success", // Misnomer for generic tracking, we use details to specify fail
        ipAddress: ip,
        userAgent: request.headers.get("user-agent") || "unknown",
        details: { status: "rate_limited" }
      });
      return NextResponse.json({ error: "Too many registration attempts. Try again later." }, { status: 429 });
    }

    // 3. HaveIBeenPwned Check
    const pwned = await isPasswordPwned(password);
    if (pwned) {
      return NextResponse.json({ 
        error: "This password appeared in a data breach. Please choose a different password." 
      }, { status: 400 });
    }

    // 4. Call Supabase Auth to actually register
    const cookieStore = cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) { return cookieStore.get(name)?.value; },
          set() {},
          remove() {},
        },
      }
    );

    const { data, error } = await supabase.auth.signUp({
      email: sanitizedEmail,
      password,
      options: {
        data: {
          full_name: sanitizedName,
        },
        emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/auth/callback`,
      }
    });

    if (error) {
      // Prevent enumeration
      if (error.message.toLowerCase().includes("already registered")) {
        return NextResponse.json({ error: "This email is already registered." }, { status: 409 });
      }
      return NextResponse.json({ error: "Registration failed" }, { status: 500 });
    }

    // 5. Log success
    await securityLogger.log({
      userId: data.user?.id,
      identifier: sanitizedEmail,
      eventType: "registration_success",
      ipAddress: ip,
      userAgent: request.headers.get("user-agent") || "unknown",
      details: { status: "success" }
    });

    return NextResponse.json({ success: true, user: data.user, session: data.session });
  } catch (error) {
    console.error("Registration Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
