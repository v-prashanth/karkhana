import type { Metadata } from "next";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const { data: org } = await supabase
    .from("organizations")
    .select("name, tagline, business_type, logo_url, address, is_verified")
    .eq("public_slug", params.slug)
    .single();

  if (!org) {
    return {
      title: "Business Card — Karkhana",
      description: "This business profile was not found.",
    };
  }

  const city = org.address?.split(",").pop()?.trim() || "India";
  const description = org.tagline
    ? `${org.tagline} — ${org.business_type} business in ${city}`
    : `${org.name} is a ${org.business_type} business in ${city}. View their digital business card on Karkhana.`;

  return {
    title: `${org.name} — Business Card | Karkhana`,
    description,
    openGraph: {
      title: `${org.name} — Digital Business Card`,
      description,
      type: "profile",
      ...(org.logo_url && { images: [{ url: org.logo_url, width: 200, height: 200 }] }),
    },
    twitter: {
      card: "summary",
      title: `${org.name} — Business Card`,
      description,
    },
  };
}

export default function BusinessCardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
