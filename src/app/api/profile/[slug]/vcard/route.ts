import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET(
  request: Request,
  { params }: { params: { slug: string } }
) {
  const slug = params.slug;

  const { data: org, error } = await supabase
    .from('organizations')
    .select('name, owner_name, phone, email, address, gstin, logo_url, business_type, public_slug, tagline')
    .eq('public_slug', slug)
    .single();

  if (error || !org) {
    return NextResponse.json({ error: 'Business not found' }, { status: 404 });
  }

  // Build vCard 3.0 format
  const lines = [
    'BEGIN:VCARD',
    'VERSION:3.0',
    `FN:${org.name}`,
    `ORG:${org.name}`,
  ];

  if (org.owner_name) lines.push(`N:;${org.owner_name};;;`);
  if (org.phone) lines.push(`TEL;TYPE=WORK:${org.phone.startsWith('+') ? org.phone : '+91' + org.phone.replace(/\D/g, '')}`);
  if (org.email) lines.push(`EMAIL;TYPE=WORK:${org.email}`);
  if (org.address) lines.push(`ADR;TYPE=WORK:;;${org.address.replace(/\n/g, ', ')};;;;India`);
  if (org.tagline) lines.push(`TITLE:${org.tagline}`);
  if (org.public_slug) {
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://karkhana.app';
    lines.push(`URL:${siteUrl}/${org.public_slug}`);
  }
  lines.push(`NOTE:${org.business_type} business${org.gstin ? ' | GSTIN: ' + org.gstin : ''} | Found on Karkhana`);
  lines.push('END:VCARD');

  const vcf = lines.join('\r\n');
  const filename = `${org.name.replace(/[^a-zA-Z0-9]/g, '_')}.vcf`;

  return new Response(vcf, {
    headers: {
      'Content-Type': 'text/vcard; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  });
}
