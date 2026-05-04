import { createHash } from "crypto";
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { rateLimit, LIMITS } from "@/lib/api/security/rate-limit";
import { securityLogger } from "@/lib/api/security/logger";

function hashCode(email: string, code: string) {
  return createHash("sha256").update(`${email}:${code}`).digest("hex");
}

export async function POST(request: Request) {
  try {
    const { email, code } = await request.json();

    if (!email || !code) {
      return NextResponse.json({ error: "Email and code are required" }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase();
    const ip = request.headers.get("x-forwarded-for") || "unknown";
    const userAgent = request.headers.get("user-agent") || "unknown";

    // Rate limit: 5 login attempts per 15 minutes using Upstash
    const rateLimitKey = `otp_verify:${normalizedEmail}`;
    const rl = await rateLimit(rateLimitKey, LIMITS.LOGIN_ATTEMPTS.limit, LIMITS.LOGIN_ATTEMPTS.window);
    
    if (!rl.success) {
      await securityLogger.log({
        identifier: normalizedEmail,
        eventType: "account_locked",
        ipAddress: ip,
        userAgent,
        details: { reason: "too_many_otp_attempts" }
      });
      return NextResponse.json(
        { error: "Too many attempts. Account locked for 15 minutes." },
        { status: 429 }
      );
    }

    const admin = createAdminClient();

    // 1. Validate the custom OTP code against our email_auth_codes table
    const { data: authCode, error: codeError } = await admin
      .from("email_auth_codes")
      .select("*")
      .eq("email", normalizedEmail)
      .is("consumed_at", null)
      .gt("expires_at", new Date().toISOString())
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (codeError || !authCode) {
      await securityLogger.log({
        identifier: normalizedEmail,
        eventType: "login_failed",
        ipAddress: ip,
        userAgent,
        details: { reason: "otp_expired_or_not_found" }
      });
      return NextResponse.json({ error: "Code expired or not found" }, { status: 400 });
    }

    if (authCode.code_hash !== hashCode(normalizedEmail, code)) {
      await securityLogger.log({
        identifier: normalizedEmail,
        eventType: "login_failed",
        ipAddress: ip,
        userAgent,
        details: { reason: "invalid_otp" }
      });
      return NextResponse.json({ error: "Invalid code" }, { status: 400 });
    }

    // 2. Mark the code as consumed so it can't be reused
    await admin
      .from("email_auth_codes")
      .update({ consumed_at: new Date().toISOString() })
      .eq("id", authCode.id);

    // 3. Generate a magic link via Supabase Admin API
    const { data, error } = await admin.auth.admin.generateLink({
      type: "magiclink",
      email: normalizedEmail,
    });

    if (error || !data?.properties?.hashed_token) {
      return NextResponse.json(
        { error: error?.message || "Could not generate auth token" },
        { status: 400 }
      );
    }

    // 4. Log success
    await securityLogger.log({
      identifier: normalizedEmail,
      eventType: "login_success",
      ipAddress: ip,
      userAgent,
      details: { method: "email_otp" }
    });

    // Return the hashed_token
    return NextResponse.json({
      token_hash: data.properties.hashed_token,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not verify code" },
      { status: 500 }
    );
  }
}
