/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server'
import { validateApiKey } from '@/lib/api/validate-api-key'
import { createAdminClient } from '@/lib/supabase/admin'
import crypto from 'crypto'

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

  const supabase = createAdminClient() as any

  const { data: profile, error: profileError } = await supabase
    .from('users')
    .select('id')
    .eq('organization_id', auth.org_id)
    .limit(1)
    .maybeSingle()

  if (profileError || !profile) {
    return NextResponse.json(
      { error: 'No user found for this workspace' },
      { status: 404 }
    )
  }

  const token = crypto
    .randomBytes(32)
    .toString('hex')
  const expiresAt = new Date(
    Date.now() + 60_000
  )

  const { error: insertError } = await supabase
    .from('sso_tokens')
    .insert({
      org_id: auth.org_id,
      user_id: profile.id,
      token,
      expires_at: expiresAt.toISOString()
    })

  if (insertError) {
    return NextResponse.json(
      { error: 'Failed to generate SSO token' },
      { status: 500 }
    )
  }

  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL
    ?? 'https://karkhana.app'

  return NextResponse.json({
    sso_url: `${baseUrl}/auth/sso?token=${token}`,
    expires_in: 60
  })
}
