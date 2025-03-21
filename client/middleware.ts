import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

const publicPaths = [
  '/',
  '/signin',
  '/signup',
  '/api/auth',
  '/info',
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  const isPublicPath = publicPaths.some(path => 
    pathname === path || 
    pathname.startsWith(`${path}/`) ||
    pathname.startsWith('/api/auth/')
  );
  
  const token = await getToken({ 
    req: request,
    secret: process.env.NEXTAUTH_SECRET
  });
  
  const isAuthRoute = pathname.startsWith('/signin') || pathname.startsWith('/signup');

  // Redirect authenticated users trying to access auth pages to home
  if (isAuthRoute && token) {
    return NextResponse.redirect(new URL('/home', request.url));
  }

  // Protect private routes
  if (!isPublicPath && !token) {
    // Simplified redirect with fixed destination
    return NextResponse.redirect(new URL('/signin', request.url));
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next|static|favicon.ico|robots.txt).*)',
  ],
};
