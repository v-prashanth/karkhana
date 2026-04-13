import { randomInt, createHash } from "crypto";
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendAuthEmail } from "@/lib/auth/mailer";
import { otpRequestLimiter } from "@/lib/rate-limit";

function hashCode(email: string, code: string) {
  return createHash("sha256").update(`${email}:${code}`).digest("hex");
}

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    // Rate limit: 5 OTP requests per email per hour
    const { success, remaining } = otpRequestLimiter.check(email.toLowerCase());
    if (!success) {
      return NextResponse.json(
        { error: "Too many code requests. Please wait before trying again." },
        { status: 429, headers: { "Retry-After": "3600", "X-RateLimit-Remaining": String(remaining) } }
      );
    }

    const admin = createAdminClient();
    const code = String(randomInt(100000, 999999));
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

    const { error } = await admin.from("email_auth_codes").insert({
      email: email.toLowerCase(),
      code_hash: hashCode(email.toLowerCase(), code),
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

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Could not send login code" }, { status: 500 });
  }
}
