import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

/**
 * Platform Middleware — v4
 * Handles session integrity, token rotation support, and route protection.
 */
export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value,
            ...options,
          });
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          response.cookies.set({
            name,
            value,
            ...options,
          });
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value: '',
            ...options,
          });
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          response.cookies.set({
            name,
            value: '',
            ...options,
          });
        },
      },
    }
  );

  // PKCE Code Exchange Logic - Intercept any 'code' passed to any route (Fallback for missed /auth/callback)
  const code = request.nextUrl.searchParams.get('code');
  // If we receive a code on a route that ISN'T /auth/callback, we redirect them to /auth/callback 
  // so the Route Handler correctly processes Next.js cookies via next/headers
  if (code && request.nextUrl.pathname !== '/auth/callback') {
    const url = request.nextUrl.clone();
    url.pathname = '/auth/callback';
    return NextResponse.redirect(url);
  }

  // Refresh session if expired - this is critical for token rotation security
  const { data: { session } } = await supabase.auth.getSession();

  // Protected Routes Logic
  const isGatewayPage = request.nextUrl.pathname === '/';
  const isPublicDoc = request.nextUrl.pathname.startsWith('/doc/');
  const isShareLink = request.nextUrl.pathname.startsWith('/share/');
  const isPasswordReset = request.nextUrl.pathname === '/update-password';
  const isPublicPage = request.nextUrl.pathname === '/privacy' || request.nextUrl.pathname === '/network-terms';
  const isStatic = request.nextUrl.pathname.startsWith('/_next') || 
                   request.nextUrl.pathname.startsWith('/api') ||
                   request.nextUrl.pathname.includes('.');

  // 1. If no session and trying to access protected route (and NOT public)
  if (!session && !isGatewayPage && !isPublicDoc && !isShareLink && !isPasswordReset && !isPublicPage && !isStatic) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  // 2. If session exists and on gateway page, redirect to dashboard
  if (session && isGatewayPage) {
    return NextResponse.redirect(new URL('/home', request.url));
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
