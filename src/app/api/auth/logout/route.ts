import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { apiSuccess, apiError } from '@/types/api';

export async function POST() {
  try {
    const supabase = createServerSupabaseClient();
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      return NextResponse.json(apiError('Logout failed', 'LOGOUT_ERROR'), { status: 400 });
    }
    
    return NextResponse.json(apiSuccess({ success: true }));
  } catch (error) {
    return NextResponse.json(apiError('Internal error', 'SERVER_ERROR'), { status: 500 });
  }
}
