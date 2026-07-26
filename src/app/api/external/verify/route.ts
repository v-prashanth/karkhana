/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server'
import { validateApiKey } from '@/lib/api/validate-api-key'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET(req: NextRequest) {
  const auth = await validateApiKey(
    req.headers.get('x-api-key')
  )

  if (!auth) {
    return NextResponse.json(
      { 
        valid: false, 
        error: 'Invalid or revoked API key' 
      },
      { status: 401 }
    )
  }

  const supabase = createAdminClient() as any
  const { data: org } = await supabase
    .from('organizations')
    .select('name, plan, plan_expires_at')
    .eq('id', auth.org_id)
    .maybeSingle()

  return NextResponse.json({
    valid: true,
    workspace: org?.name ?? 'Unknown Workspace',
    plan: org?.plan ?? 'free',
    plan_expires_at: org?.plan_expires_at ?? null,
    scopes: auth.scopes
  })
}
