import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

const publicPaths = [
  '/',
  '/signin',
  '/signup',
  '/api/auth',
  '/info',
  '/banner.png',
  '/api/insights', // Allow Vercel Speed Insights API
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  const isPublicPath = publicPaths.some(path => 
    pathname === path || 
    pathname.startsWith(`${path}/`) ||
    pathname.startsWith('/api/auth/') ||
    pathname.startsWith('/_vercel/') // Allow all Vercel system routes
  );

  const token = await getToken({ 
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
    secureCookie: process.env.NODE_ENV === 'production'
  });
  
  const isAuthRoute = pathname.startsWith('/signin') || pathname.startsWith('/signup');

  if (isAuthRoute && token) {
    return NextResponse.redirect(new URL('/home', request.url));
  }

  if (!isPublicPath && !token) {
    const signInUrl = new URL('/signin', request.url);
    signInUrl.searchParams.set('callbackUrl', request.url);
    return NextResponse.redirect(signInUrl);
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     * - _vercel (Vercel system routes)
     */
    '/((?!_next/static|_next/image|favicon\.ico|public|_vercel).*)',
  ],
};
