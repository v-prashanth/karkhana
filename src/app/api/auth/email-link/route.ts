import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendAuthEmail } from "@/lib/auth/mailer";

export async function POST(request: Request) {
  try {
    const { email, mode } = await request.json();

    if (!email || !mode) {
      return NextResponse.json({ error: "Email and mode are required" }, { status: 400 });
    }

    const admin = createAdminClient();
    const origin = new URL(request.url).origin;
    const redirectTo = `${origin}/auth/callback`;

    if (mode === "magic") {
      const { data, error } = await admin.auth.admin.generateLink({
        type: "magiclink",
        email,
        options: { redirectTo: `${origin}/auth/reset-password` },
      });

      if (error || !data.properties?.action_link) {
        return NextResponse.json({ error: error?.message || "Could not create sign-in link" }, { status: 400 });
      }

      await sendAuthEmail({
        to: email,
        subject: "Your Karkhana sign-in link",
        heading: "Sign in to Karkhana",
        body: "Tap the button below to sign in to your workspace. This link is secure and meant only for you.",
        ctaLabel: "Open Karkhana",
        ctaUrl: data.properties.action_link,
      });

      return NextResponse.json({ success: true });
    }

    if (mode === "recovery") {
      const { data, error } = await admin.auth.admin.generateLink({
        type: "recovery",
        email,
        options: { redirectTo },
      });

      if (error || !data.properties?.action_link) {
        return NextResponse.json({ error: error?.message || "Could not create recovery link" }, { status: 400 });
      }

      await sendAuthEmail({
        to: email,
        subject: "Reset your Karkhana password",
        heading: "Reset your password",
        body: "Use the secure button below to set a new password for your Karkhana account.",
        ctaLabel: "Reset Password",
        ctaUrl: data.properties.action_link,
      });

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Unsupported email flow" }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Email flow failed" }, { status: 500 });
  }
}
