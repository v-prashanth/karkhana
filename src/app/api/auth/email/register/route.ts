import { NextResponse } from "next/server";
import { rateLimit, LIMITS } from "@/lib/api/security/rate-limit";
import { securityLogger } from "@/lib/api/security/logger";
import { isPasswordPwned } from "@/lib/api/security/pwned";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { createAdminClient } from "@/lib/supabase/admin";
function sanitize(str: string) { return str.replace(/<[^>]*>/g, "").trim(); }
import validator from "validator";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password, name } = body;

    // 1. Sanitize & Validate
    const sanitizedEmail = sanitize(email || "").toLowerCase();
    const sanitizedName = sanitize(name || "");

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

    // 4. Call Supabase Admin to create the user
    console.log("Creating admin client...");
    const admin = createAdminClient();
    console.log("Admin client created. Calling createUser for:", sanitizedEmail);

    const { data: adminData, error: createError } = await admin.auth.admin.createUser({
      email: sanitizedEmail,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: sanitizedName,
      },
    });

    if (createError) {
      console.error("Supabase create user error:", createError);
      if (createError.message.toLowerCase().includes("already registered") || createError.message.toLowerCase().includes("already exists")) {
        return NextResponse.json({ error: "This email is already registered." }, { status: 409 });
      }
      return NextResponse.json({ error: "Registration failed: " + createError.message }, { status: 500 });
    }

    console.log("User created via admin. Sending welcome email...");

    // 5. Send custom Welcome/Confirmation email via Nodemailer
    try {
      const { sendAuthEmail } = await import("@/lib/auth/mailer");
      await sendAuthEmail({
        to: sanitizedEmail,
        subject: "Welcome to Karkhana",
        heading: "Welcome to Karkhana!",
        body: "Your account has been successfully created. You can now log in to your workspace and start managing your business.",
        ctaLabel: "Go to Dashboard",
        ctaUrl: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/login`,
      });
      console.log("Welcome email sent.");
    } catch (mailError) {
      console.error("Failed to send welcome email:", mailError);
    }

    console.log("Signing in user...");

    // 6. Sign in the user to establish the session
    const cookieStore = cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
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

    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: sanitizedEmail,
      password,
    });

    if (signInError) {
      console.error("SignIn after register error:", signInError);
      return NextResponse.json({ error: "Account created, but failed to log in automatically." }, { status: 500 });
    }

    console.log("SignIn successful, logging security event...");

    // 7. Log success
    try {
      await securityLogger.log({
        userId: signInData.user?.id,
        identifier: sanitizedEmail,
        eventType: "registration_success",
        ipAddress: ip,
        userAgent: request.headers.get("user-agent") || "unknown",
        details: { status: "success", mailer: "nodemailer" }
      });
    } catch (e) {
      console.error("Failed to log security event", e);
    }

    console.log("Registration complete. Returning success.");
    return NextResponse.json({ success: true, user: signInData.user, session: signInData.session });
  } catch (error: any) {
    console.error("CRITICAL Registration Error (Exception thrown):", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
