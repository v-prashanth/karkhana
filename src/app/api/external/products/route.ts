import { NextRequest, NextResponse } 
  from 'next/server'
import { validateApiKey } 
  from '@/lib/api/validate-api-key'

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

  if (!auth.scopes.includes('products:read')) {
    return NextResponse.json(
      { error: 'Insufficient scope' },
      { status: 403 }
    )
  }

  return NextResponse.json({
    products: [],
    note: 'Product sync coming in next release'
  })
}
