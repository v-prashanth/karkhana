import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendAuthEmail } from "@/lib/auth/mailer";
import { registerLimiter } from "@/lib/rate-limit";

export async function POST(request: Request) {
  try {
    // Rate limit: 3 registration attempts per IP per hour
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    const { success } = registerLimiter.check(ip);
    if (!success) {
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
