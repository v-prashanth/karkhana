import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(req: Request) {
  try {
    const supabase = createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File;
    const orgId = formData.get("orgId") as string;

    if (!file || !orgId) {
      return NextResponse.json({ error: "Missing file or orgId" }, { status: 400 });
    }

    const admin = createAdminClient();
    
    // Ensure bucket exists (fallback if migration wasn't run)
    try {
      const { data: buckets } = await admin.storage.listBuckets();
      if (!buckets?.find(b => b.name === 'logos')) {
        await admin.storage.createBucket('logos', { public: true });
      }
    } catch (e) {
      console.warn("Could not verify/create bucket:", e);
    }

    const fileExt = file.name.split(".").pop();
    const fileName = `${orgId}-${Date.now()}.${fileExt}`;

    // Upload using admin client to bypass any missing RLS policies temporarily for MVP
    const { error: uploadError } = await admin.storage
      .from("logos")
      .upload(fileName, file, {
        cacheControl: "3600",
        upsert: true,
      });

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = admin.storage
      .from("logos")
      .getPublicUrl(fileName);

    return NextResponse.json({ url: publicUrl });
  } catch (error: any) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
