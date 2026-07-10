import { auth } from '@/lib/auth';
import { NextResponse } from 'next/server';

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const session = req.auth;

  // Rutas completamente publicas (no requieren login)
  const publicRoutes = [
    '/', '/tienda', '/producto', '/carrito', '/checkout', '/pedido',
    '/login', '/registro',
    '/api/v1/products', '/api/v1/categories', '/api/v1/offers',
    '/api/v1/orders', '/api/v1/payments', '/api/v1/auth',
    '/api/auth',
  ];
  const isPublic = publicRoutes.some((r) => pathname === r || pathname.startsWith(r + '/'));

  if (isPublic) {
    const response = NextResponse.next();
    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    return response;
  }

  // Rutas protegidas (requieren login)
  if (!session) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const loginUrl = new URL('/login', req.url);
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
});

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|images/).*)'],
};
