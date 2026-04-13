import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { userCheckLimiter } from "@/lib/rate-limit";

export async function POST(request: Request) {
  try {
    // Rate limit by IP: 20 checks per minute
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    const { success } = userCheckLimiter.check(ip);
    if (!success) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }

    const { identifier } = await request.json();

    if (!identifier) {
      return NextResponse.json({ error: "Identifier is required" }, { status: 400 });
    }

    const admin = createAdminClient();
    const isEmail = identifier.includes("@");
    
    // Normalize identifier
    const normalizedIdentifier = isEmail 
      ? identifier.toLowerCase().trim() 
      : identifier.startsWith("+91") 
        ? identifier 
        : `+91${identifier.replace(/\D/g, "")}`;

    // Query public.users table securely to see if they exist
    const { data, error } = await admin
      .from("users")
      .select("id")
      .eq(isEmail ? "email" : "phone", normalizedIdentifier)
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error("User check error:", error);
      return NextResponse.json({ exists: false });
    }

    return NextResponse.json({ exists: !!data });
  } catch (error) {
    return NextResponse.json({ exists: false }, { status: 500 });
  }
}
