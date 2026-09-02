import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { hasValidSessionCookie } from '@/lib/session';

const PUBLIC_ROUTES = ['/login'];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isPublicRoute = PUBLIC_ROUTES.includes(pathname);

  const authenticated = await hasValidSessionCookie(request.cookies.get('session')?.value);

  if (!authenticated && !isPublicRoute) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  if (authenticated && isPublicRoute) {
    return NextResponse.redirect(new URL('/reisekosten', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
