import { auth } from '@/lib/auth';
import { NextResponse } from 'next/server';

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const session = req.auth;

  const publicRoutes = ['/login', '/api/auth', '/api/v1/health', '/api/v1/products', '/api/v1/categories', '/api/v1/landings', '/api/v1/upload', '/api/v1/versions'];
  const isPublic = publicRoutes.some((r) => pathname.startsWith(r));

  if (isPublic) {
    if (session && pathname === '/login') {
      return NextResponse.redirect(new URL('/', req.url));
    }
    const response = NextResponse.next();
    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    return response;
  }

  if (!session) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const loginUrl = new URL('/login', req.url);
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }

  const response = NextResponse.next();
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  return response;
});

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|images/).*)'],
};