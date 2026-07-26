/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server'
import { validateApiKey } from '@/lib/api/validate-api-key'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(req: NextRequest) {
  const auth = await validateApiKey(
    req.headers.get('x-api-key')
  )

  if (!auth) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    )
  }

  if (!auth.scopes.includes('leads:write')) {
    return NextResponse.json(
      { 
        error: 'Insufficient scope: leads:write required' 
      },
      { status: 403 }
    )
  }

  let body: any
  try {
    body = await req.json()
  } catch {
    return NextResponse.json(
      { error: 'Invalid JSON body' },
      { status: 400 }
    )
  }

  if (
    !body.name ||
    typeof body.name !== 'string' ||
    body.name.trim().length === 0
  ) {
    return NextResponse.json(
      { 
        error: 'name is required and must be a non-empty string' 
      },
      { status: 400 }
    )
  }

  const supabase = createAdminClient() as any

  // Idempotency check
  if (body.external_ref) {
    const { data: existing } = await supabase
      .from('external_leads')
      .select('id, status, created_at')
      .eq('external_ref', body.external_ref)
      .eq('org_id', auth.org_id)
      .maybeSingle()

    if (existing) {
      return NextResponse.json({
        success: true,
        lead_id: existing.id,
        duplicate: true,
        message: 'Lead already exists'
      })
    }
  }

  const { data, error } = await supabase
    .from('external_leads')
    .insert({
      org_id: auth.org_id,
      name: body.name.trim(),
      phone: body.phone ?? null,
      email: body.email ?? null,
      address: body.address ?? null,
      product_interest: body.interested_product ?? null,
      property_type: body.property_type ?? null,
      bathrooms: body.bathrooms ?? null,
      preferred_date: body.preferred_date ?? null,
      notes: body.message ?? body.notes ?? null,
      external_ref: body.external_ref ?? null,
      source: body.source ?? 'website',
      status: 'new'
    })
    .select('id, created_at')
    .maybeSingle()

  if (error || !data) {
    console.error(
      '[External API] Lead insert error:', 
      error
    )
    return NextResponse.json(
      { error: 'Failed to create lead' },
      { status: 500 }
    )
  }

  return NextResponse.json({
    success: true,
    lead_id: data.id,
    created_at: data.created_at
  }, { status: 201 })
}

export async function GET(req: NextRequest) {
  const auth = await validateApiKey(
    req.headers.get('x-api-key')
  )

  if (!auth) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    )
  }

  if (!auth.scopes.includes('leads:read')) {
    return NextResponse.json(
      { 
        error: 'Insufficient scope: leads:read required'
      },
      { status: 403 }
    )
  }

  const { searchParams } = new URL(req.url)
  const limit = Math.min(
    parseInt(searchParams.get('limit') ?? '50'),
    200
  )
  const status = searchParams.get('status')

  const supabase = createAdminClient() as any

  let query = supabase
    .from('external_leads')
    .select('*')
    .eq('org_id', auth.org_id)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (status) {
    query = query.eq('status', status)
  }

  const { data, error } = await query

  if (error) {
    return NextResponse.json(
      { error: 'Failed to fetch leads' },
      { status: 500 }
    )
  }

  return NextResponse.json({
    leads: data ?? [],
    count: data?.length ?? 0
  })
}
