import { NextRequest, NextResponse } 
  from 'next/server'
import { createClient } 
  from '@/lib/supabase/server'

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

  const body = await req.json().catch(() => ({}))
  const code = body.code?.toUpperCase().trim()

  if (!code) {
    return NextResponse.json(
      { error: 'Coupon code is required' },
      { status: 400 }
    )
  }

  const { data: coupon, error: couponError } =
    await supabase
      .from('coupons')
      .select('*')
      .eq('code', code)
      .single()

  if (couponError || !coupon) {
    return NextResponse.json(
      { error: 'Invalid coupon code' },
      { status: 400 }
    )
  }

  if (coupon.used_count >= coupon.max_uses) {
    return NextResponse.json(
      { 
        error: 'This coupon has already been fully redeemed' 
      },
      { status: 400 }
    )
  }

  if (
    coupon.expires_at &&
    new Date(coupon.expires_at) < new Date()
  ) {
    return NextResponse.json(
      { error: 'This coupon has expired' },
      { status: 400 }
    )
  }

  const { data: profile } = await supabase
    .from('users')
    .select('organization_id')
    .eq('id', user.id)
    .single()

  if (!profile?.organization_id) {
    return NextResponse.json(
      { error: 'Organization not found' },
      { status: 404 }
    )
  }

  const freeUntil = new Date()
  freeUntil.setMonth(
    freeUntil.getMonth() + coupon.free_months
  )

  const { error: updateError } = await supabase
    .from('organizations')
    .update({
      plan: coupon.plan,
      plan_expires_at: freeUntil.toISOString()
    })
    .eq('id', profile.organization_id)

  if (updateError) {
    return NextResponse.json(
      { error: 'Failed to apply coupon' },
      { status: 500 }
    )
  }

  await supabase
    .from('coupons')
    .update({ 
      used_count: coupon.used_count + 1 
    })
    .eq('id', coupon.id)

  return NextResponse.json({
    success: true,
    plan: coupon.plan,
    free_months: coupon.free_months,
    free_until: freeUntil.toISOString(),
    message: 
      `🎉 ${coupon.free_months} months free ` +
      `on ${coupon.plan} plan! Enjoy Karkhana.`
  })
}
