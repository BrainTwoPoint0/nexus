import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value }) =>
            supabaseResponse.cookies.set(name, value)
          );
        },
      },
    }
  );

  // This will refresh session if expired - required for Server Components
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  // Define paths that require authentication
  const protectedPaths = [
    '/dashboard',
    '/profile',
    '/settings',
    '/opportunities',
  ];

  // Define paths that should redirect authenticated users
  const authPaths = ['/sign-in', '/sign-up'];

  const isProtectedPath = protectedPaths.some((path) =>
    pathname.startsWith(path)
  );
  const isAuthPath = authPaths.some((path) => pathname.startsWith(path));
  const isOnboardingPath = pathname.startsWith('/onboarding');

  // If user is not authenticated and trying to access protected route
  if (!user && isProtectedPath) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = '/sign-in';
    redirectUrl.searchParams.set('redirectTo', pathname);
    return NextResponse.redirect(redirectUrl);
  }

  // If user is authenticated, check if they completed onboarding
  if (user && !isOnboardingPath && !isAuthPath) {
    // Check if user has completed onboarding
    const { data: profile } = await supabase
      .from('profiles')
      .select('onboarding_completed')
      .eq('id', user.id)
      .single();

    // If no profile exists or onboarding not completed, redirect to onboarding
    if (!profile || !profile.onboarding_completed) {
      // Only redirect if they're trying to access a protected path
      if (isProtectedPath) {
        const redirectUrl = request.nextUrl.clone();
        redirectUrl.pathname = '/onboarding';
        // Store where they were trying to go for after onboarding
        if (pathname !== '/dashboard') {
          redirectUrl.searchParams.set('redirectTo', pathname);
        }
        return NextResponse.redirect(redirectUrl);
      }
    }
  }

  // If user is authenticated and trying to access auth pages, redirect based on onboarding status
  if (user && isAuthPath) {
    // Check if user has completed onboarding
    const { data: profile } = await supabase
      .from('profiles')
      .select('onboarding_completed')
      .eq('id', user.id)
      .single();

    const redirectUrl = request.nextUrl.clone();
    // If onboarding not completed, send to onboarding, otherwise to dashboard
    redirectUrl.pathname = !profile || !profile.onboarding_completed ? '/onboarding' : '/dashboard';
    return NextResponse.redirect(redirectUrl);
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
