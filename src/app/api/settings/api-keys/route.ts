import { NextRequest, NextResponse } 
  from 'next/server'
import { createClient } 
  from '@/lib/supabase/server'
import crypto from 'crypto'

async function getOrgId(): Promise<string | null> {
  const supabase = createClient()
  const { data: { user } } = 
    await supabase.auth.getUser()
  if (!user) return null

  const { data: profile } = await supabase
    .from('users')
    .select('organization_id')
    .eq('id', user.id)
    .single()

  return profile?.organization_id ?? null
}

export async function GET() {
  const supabase = createClient()
  const { data: { user } } = 
    await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    )
  }

  const orgId = await getOrgId()
  if (!orgId) {
    return NextResponse.json(
      { error: 'Organization not found' },
      { status: 404 }
    )
  }

  const { data, error } = await supabase
    .from('api_keys')
    .select(
      'id, key_prefix, name, scopes, ' +
      'last_used_at, created_at'
    )
    .eq('org_id', orgId)
    .is('revoked_at', null)
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json(
      { error: 'Failed to fetch API keys' },
      { status: 500 }
    )
  }

  return NextResponse.json({ 
    keys: data ?? [] 
  })
}

export async function POST(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = 
    await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    )
  }

  const orgId = await getOrgId()
  if (!orgId) {
    return NextResponse.json(
      { error: 'Organization not found' },
      { status: 404 }
    )
  }

  const { count } = await supabase
    .from('api_keys')
    .select('*', { count: 'exact', head: true })
    .eq('org_id', orgId)
    .is('revoked_at', null)

  if ((count ?? 0) >= 5) {
    return NextResponse.json(
      { 
        error: 'Maximum 5 active API keys allowed. ' +
          'Revoke one to create a new key.' 
      },
      { status: 400 }
    )
  }

  const body = await req.json().catch(() => ({}))
  const name = body.name?.trim() 
    || 'Website Integration'

  const rawKey = 'ak_live_' +
    crypto.randomBytes(24).toString('hex')

  const keyHash = crypto
    .createHash('sha256')
    .update(rawKey)
    .digest('hex')

  const keyPrefix = rawKey.substring(0, 15) +
    '••••••••••••••'

  const { error } = await supabase
    .from('api_keys')
    .insert({
      org_id: orgId,
      key_hash: keyHash,
      key_prefix: keyPrefix,
      name,
      scopes: [
        'leads:write',
        'leads:read',
        'products:read'
      ]
    })

  if (error) {
    return NextResponse.json(
      { error: 'Failed to create API key' },
      { status: 500 }
    )
  }

  // Raw key returned ONCE — never stored
  return NextResponse.json({
    key: rawKey,
    prefix: keyPrefix,
    name,
    message: 
      'Copy this key now. ' +
      'It will not be shown again.',
    warning:
      'Store this key securely. Anyone with ' +
      'this key can create leads in your ' +
      'Karkhana workspace.'
  }, { status: 201 })
}

export async function DELETE(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = 
    await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    )
  }

  const orgId = await getOrgId()
  if (!orgId) {
    return NextResponse.json(
      { error: 'Organization not found' },
      { status: 404 }
    )
  }

  const { id } = await req.json()
  if (!id) {
    return NextResponse.json(
      { error: 'Key ID required' },
      { status: 400 }
    )
  }

  const { error } = await supabase
    .from('api_keys')
    .update({ 
      revoked_at: new Date().toISOString() 
    })
    .eq('id', id)
    .eq('org_id', orgId)

  if (error) {
    return NextResponse.json(
      { error: 'Failed to revoke API key' },
      { status: 500 }
    )
  }

  return NextResponse.json({
    success: true,
    message: 'API key revoked'
  })
}
