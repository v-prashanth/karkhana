import { NextResponse } from "next/server";
import { rateLimit, LIMITS } from "@/lib/api/security/rate-limit";
import { securityLogger } from "@/lib/api/security/logger";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function POST(request: Request) {
  try {
    const { phone } = await request.json();

    if (!phone || !/^[6-9]\d{9}$/.test(phone)) {
      return NextResponse.json({ error: "Invalid phone number" }, { status: 400 });
    }

    // 1. Rate Limiting
    const ip = request.headers.get("x-forwarded-for") || "unknown";
    const rateLimitKey = `otp:${phone}`;
    const rl = await rateLimit(rateLimitKey, LIMITS.OTP_REQUESTS.limit, LIMITS.OTP_REQUESTS.window);

    if (!rl.success) {
      // Log the abuse attempt
      await securityLogger.log({
        identifier: phone,
        eventType: "otp_requested",
        ipAddress: ip,
        userAgent: request.headers.get("user-agent") || "unknown",
        details: { status: "rate_limited" }
      });
      
      // Generic message to prevent enumeration
      return NextResponse.json({ 
        error: "Too many attempts. Try again later." 
      }, { status: 429 });
    }

    // 2. Call Supabase Auth to actually send the OTP
    const cookieStore = cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) { return cookieStore.get(name)?.value; },
          set() {},
          remove() {},
        },
      }
    );

    const { data, error } = await supabase.auth.signInWithOtp({
      phone: `+91${phone}`,
      options: { channel: "sms" },
    });

    if (error) {
      console.error("Supabase OTP Error:", error);
      return NextResponse.json({ error: "Failed to send verification code" }, { status: 500 });
    }

    // 3. Log success
    await securityLogger.log({
      identifier: phone,
      eventType: "otp_requested",
      ipAddress: ip,
      userAgent: request.headers.get("user-agent") || "unknown",
      details: { status: "success" }
    });

    return NextResponse.json({ success: true, expiresIn: 600 });
  } catch (error) {
    console.error("OTP Request Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
