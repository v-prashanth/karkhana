import { NextResponse } from "next/server";
import { rateLimit, LIMITS } from "@/lib/api/security/rate-limit";
import { securityLogger } from "@/lib/api/security/logger";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendAuthEmail } from "@/lib/auth/mailer";
function sanitize(str: string) { return str.replace(/<[^>]*>/g, "").trim(); }
import validator from "validator";

// Fallback to anon key if service key is missing
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    const sanitizedEmail = sanitize(email || "").toLowerCase();
    if (!validator.isEmail(sanitizedEmail)) {
      return NextResponse.json({ error: "Invalid email" }, { status: 400 });
    }

    const ip = request.headers.get("x-forwarded-for") || "unknown";
    const userAgent = request.headers.get("user-agent") || "unknown";

    // 1. Rate Limiting
    const rateLimitKey = `reset_email:${sanitizedEmail}`;
    const rl = await rateLimit(rateLimitKey, LIMITS.PASSWORD_RESET.limit, LIMITS.PASSWORD_RESET.window);

    if (!rl.success) {
      // Silently succeed to prevent enumeration, but log the rate limit
      await securityLogger.log({
        identifier: sanitizedEmail,
        eventType: "password_reset_requested",
        ipAddress: ip,
        userAgent,
        details: { status: "rate_limited" }
      });
      return NextResponse.json({ success: true });
    }

    // 2. Setup Supabase Client
    const cookieStore = cookies();
    const supabase = createServerClient(
      supabaseUrl,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) { return cookieStore.get(name)?.value; },
          set() {},
          remove() {},
        },
      }
    );

    // 3. Request Password Reset Link via Admin API
    const origin = request.headers.get("origin") || process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
    console.log("Generating link for:", sanitizedEmail, "with origin:", origin);

    const admin = createAdminClient();
    const { data, error } = await admin.auth.admin.generateLink({
      type: "recovery",
      email: sanitizedEmail,
      options: {
        redirectTo: `${origin}/auth/callback?next=/update-password`,
      },
    });

    if (error || !data?.properties?.action_link) {
      console.error("Generate recovery link error:", error);
      // We still return success: true to prevent enumeration
    } else {
      console.log("Link generated successfully:", data.properties.action_link);
      // 4. Send via our custom branded mailer
      try {
        console.log("Sending email via nodemailer...");
        await sendAuthEmail({
          to: sanitizedEmail,
          subject: "Reset your Karkhana password",
          heading: "Reset your password",
          body: "Click the button below to set a new password for your Karkhana account. This link expires in 1 hour.",
          ctaLabel: "Reset Password",
          ctaUrl: data.properties.action_link,
        });
        console.log("Email sent!");
      } catch (mailError) {
        console.error("Failed to send nodemailer reset password email:", mailError);
      }
    }

    // 5. Log success request
    await securityLogger.log({
      identifier: sanitizedEmail,
      eventType: "password_reset_requested",
      ipAddress: ip,
      userAgent,
      details: { status: "requested", mailer: "nodemailer" }
    });

    // Always succeed
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Password reset Error:", error);
    return NextResponse.json({ success: true });
  }
}
