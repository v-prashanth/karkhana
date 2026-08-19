import { NextResponse } from "next/server";
import { rateLimit, LIMITS } from "@/lib/api/security/rate-limit";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendAuthEmail } from "@/lib/auth/mailer";

export async function POST(request: Request) {
  try {
    // Rate Limiting: 10 per hour per IP
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "127.0.0.1";
    const registerLimitKey = `register:${ip}`;
    const rl = await rateLimit(registerLimitKey, LIMITS.REGISTER.limit, LIMITS.REGISTER.window);

    if (!rl.success) {
      return NextResponse.json(
        { error: "Too many registration attempts. Please try again later." },
        { status: 429 }
      );
    }

    const admin = createAdminClient();
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
    }

    const redirectTo = `${new URL(request.url).origin}/auth/callback`;
    const { data, error } = await admin.auth.admin.generateLink({
      type: "signup",
      email,
      password,
      options: { redirectTo },
    });

    if (error || !data.properties?.action_link) {
      return NextResponse.json(
        { error: error?.message || "Could not create verification link" },
        { status: 400 }
      );
    }

    await sendAuthEmail({
      to: email,
      subject: "Verify your Karkhana account",
      heading: "Confirm your business email",
      body: "Use the secure button below to verify your email and open your Karkhana workspace setup.",
      ctaLabel: "Verify Email",
      ctaUrl: data.properties.action_link,
    });

    return NextResponse.json({
      message: "Verification link sent",
      requiresVerification: true,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Registration failed" },
      { status: 500 }
    );
  }
}
