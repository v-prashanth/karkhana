import crypto from 'crypto'
import { createAdminClient } from '@/lib/supabase/admin'

export type ApiAuth = {
  org_id: string
  scopes: string[]
} | null

export async function validateApiKey(
  apiKey: string | null
): Promise<ApiAuth> {
  if (!apiKey) return null
  if (!apiKey.startsWith('ak_live_')) return null

  const keyHash = crypto
    .createHash('sha256')
    .update(apiKey)
    .digest('hex')

  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('api_keys')
    .select('org_id, scopes, revoked_at')
    .eq('key_hash', keyHash)
    .is('revoked_at', null)
    .maybeSingle()

  if (error || !data) return null

  // Fire and forget — do not await
  supabase
    .from('api_keys')
    .update({ 
      last_used_at: new Date().toISOString() 
    })
    .eq('key_hash', keyHash)
    .then(() => {})

  return {
    org_id: data.org_id,
    scopes: data.scopes ?? []
  }
}
