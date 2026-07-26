import { redirect } from 'next/navigation'
import { createClient } 
  from '@/lib/supabase/server'
import { createAdminClient } 
  from '@/lib/supabase/admin'

interface SSOPageProps {
  searchParams: { token?: string }
}

export default async function SSOPage({
  searchParams
}: SSOPageProps) {
  const { token } = searchParams

  if (!token || token.length !== 64) {
    redirect('/login?error=invalid_sso_token')
  }

  const supabase = createClient()

  const { data: ssoToken, error } =
    await supabase
      .from('sso_tokens')
      .select(
        'id, org_id, user_id, expires_at, used_at'
      )
      .eq('token', token)
      .single()

  if (error || !ssoToken) {
    redirect('/login?error=sso_token_not_found')
  }

  if (ssoToken.used_at) {
    redirect(
      '/login?error=sso_token_already_used'
    )
  }

  if (new Date(ssoToken.expires_at) < new Date()) {
    redirect('/login?error=sso_token_expired')
  }

  // Mark used atomically before creating session
  const { error: markError } = await supabase
    .from('sso_tokens')
    .update({ 
      used_at: new Date().toISOString() 
    })
    .eq('id', ssoToken.id)
    .is('used_at', null)

  if (markError) {
    redirect(
      '/login?error=sso_token_already_used'
    )
  }

  const adminSupabase = createAdminClient()
  const { data: userData, error: userError } =
    await adminSupabase.auth.admin
      .getUserById(ssoToken.user_id)

  if (userError || !userData.user?.email) {
    redirect('/login?error=sso_user_not_found')
  }

  const { data: linkData, error: linkError } =
    await adminSupabase.auth.admin.generateLink({
      type: 'magiclink',
      email: userData.user.email,
      options: {
        redirectTo:
          `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}` +
          `/dashboard`
      }
    })

  if (
    linkError ||
    !linkData?.properties?.hashed_token
  ) {
    redirect('/login?error=sso_session_failed')
  }

  redirect(
    `/auth/confirm` +
    `?token_hash=` +
    `${linkData.properties.hashed_token}` +
    `&type=magiclink` +
    `&next=/dashboard`
  )
}
