import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendAuthEmail } from "@/lib/auth/mailer";

/**
 * Custom Password Reset — sends the recovery link through our own SMTP
 * instead of Supabase's default noreply@mail.app.supabase.io
 */
export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const admin = createAdminClient();
    const origin = new URL(request.url).origin;

    // Generate a recovery link via Supabase Admin API
    const { data, error } = await admin.auth.admin.generateLink({
      type: "recovery",
      email: email.toLowerCase(),
      options: {
        redirectTo: `${origin}/auth/callback?next=/update-password`,
      },
    });

    if (error || !data?.properties?.action_link) {
      // Silently succeed even if user doesn't exist (security best practice)
      return NextResponse.json({ success: true });
    }

    // Send via our custom branded mailer
    await sendAuthEmail({
      to: email,
      subject: "Reset your Karkhana password",
      heading: "Reset your password",
      body: "Click the button below to set a new password for your Karkhana account. This link expires in 1 hour.",
      ctaLabel: "Reset Password",
      ctaUrl: data.properties.action_link,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    // Silently succeed to prevent email enumeration
    return NextResponse.json({ success: true });
  }
}
