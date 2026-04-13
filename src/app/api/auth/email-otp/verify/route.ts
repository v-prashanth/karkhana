import { createHash } from "crypto";
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { otpVerifyLimiter } from "@/lib/rate-limit";

function hashCode(email: string, code: string) {
  return createHash("sha256").update(`${email}:${code}`).digest("hex");
}

export async function POST(request: Request) {
  try {
    const { email, code } = await request.json();

    if (!email || !code) {
      return NextResponse.json({ error: "Email and code are required" }, { status: 400 });
    }

    // Rate limit: 10 verify attempts per email per 15 minutes
    const { success } = otpVerifyLimiter.check(email.toLowerCase());
    if (!success) {
      return NextResponse.json(
        { error: "Too many attempts. Please wait before trying again." },
        { status: 429 }
      );
    }

    const admin = createAdminClient();
    const normalizedEmail = email.toLowerCase();

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
      return NextResponse.json({ error: "Code expired or not found" }, { status: 400 });
    }

    if (authCode.code_hash !== hashCode(normalizedEmail, code)) {
      return NextResponse.json({ error: "Invalid code" }, { status: 400 });
    }

    // 2. Mark the code as consumed so it can't be reused
    await admin
      .from("email_auth_codes")
      .update({ consumed_at: new Date().toISOString() })
      .eq("id", authCode.id);

    // 3. Generate a magic link via Supabase Admin API
    //    This gives us a hashed_token we can return to the CLIENT
    //    so it can establish the session in-browser (no redirect needed)
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

    // 4. Return ONLY the hashed_token — the client will use
    //    supabase.auth.verifyOtp({ token_hash, type: 'magiclink' })
    //    to establish the session directly in browser cookies.
    //    NO navigation to external URLs. NO hash fragments.
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
