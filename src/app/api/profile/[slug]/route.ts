import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Use a direct Supabase client (no auth needed for public data)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET(
  request: Request,
  { params }: { params: { slug: string } }
) {
  const slug = params.slug;
  
  if (!slug || slug.length < 2) {
    return NextResponse.json({ error: 'Invalid profile URL' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('organizations')
    .select('id, name, owner_name, phone, email, address, gstin, logo_url, upi_id, business_type, public_slug, is_verified, tagline, capabilities, year_established, employee_count, brand_primary_color, brand_secondary_color, created_at')
    .eq('public_slug', slug)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: 'Business profile not found' }, { status: 404 });
  }

  // Add cache headers for performance (5 minutes)
  return NextResponse.json(data, {
    headers: {
      'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
    },
  });
}
