import { randomInt, createHash } from "crypto";
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendAuthEmail } from "@/lib/auth/mailer";
import { rateLimit, LIMITS } from "@/lib/api/security/rate-limit";
import { securityLogger } from "@/lib/api/security/logger";

function hashCode(email: string, code: string) {
  return createHash("sha256").update(`${email}:${code}`).digest("hex");
}

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase();
    const ip = request.headers.get("x-forwarded-for") || "unknown";
    const userAgent = request.headers.get("user-agent") || "unknown";

    // 1. Rate limit: 5 OTP requests per hour using Upstash
    const rateLimitKey = `otp_request:${normalizedEmail}`;
    const rl = await rateLimit(rateLimitKey, LIMITS.OTP_REQUESTS.limit, LIMITS.OTP_REQUESTS.window);
    
    if (!rl.success) {
      await securityLogger.log({
        identifier: normalizedEmail,
        eventType: "otp_requested",
        ipAddress: ip,
        userAgent,
        details: { status: "rate_limited" }
      });
      return NextResponse.json(
        { error: "Too many code requests. Please wait before trying again." },
        { status: 429, headers: { "Retry-After": "3600", "X-RateLimit-Remaining": String(rl.remaining) } }
      );
    }

    const admin = createAdminClient();
    const code = String(randomInt(100000, 999999));
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

    const { error } = await admin.from("email_auth_codes").insert({
      email: normalizedEmail,
      code_hash: hashCode(normalizedEmail, code),
      expires_at: expiresAt,
      consumed_at: null,
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    await sendAuthEmail({
      to: email,
      subject: "Your Karkhana login code",
      heading: "Your login code",
      body: "Enter this code in Karkhana to continue signing in. It expires in 10 minutes.",
      code,
    });

    await securityLogger.log({
      identifier: normalizedEmail,
      eventType: "otp_requested",
      ipAddress: ip,
      userAgent,
      details: { status: "success", method: "email" }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Could not send login code" }, { status: 500 });
  }
}
