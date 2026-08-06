import { auth } from '@/lib/auth';
import { NextResponse } from 'next/server';

const ALLOWED_ORIGINS = [
  process.env.NEXT_PUBLIC_STORE_URL || 'http://localhost:3001',
  process.env.NEXT_PUBLIC_WMS_URL || 'http://localhost:3000',
].filter(Boolean);

function addCorsHeaders(response: NextResponse, origin: string | null) {
  if (origin && ALLOWED_ORIGINS.includes(origin)) {
    response.headers.set('Access-Control-Allow-Origin', origin);
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
    response.headers.set('Access-Control-Allow-Credentials', 'true');
    response.headers.set('Access-Control-Max-Age', '86400');
  }
  return response;
}

const PUBLIC_ROUTES = ['/login', '/api/auth', '/api/v1/health'];
const READ_ONLY_PUBLIC_ROUTES = ['/api/v1/products', '/api/v1/categories'];

// Routes that require admin or super_admin role
const ADMIN_ONLY_API_ROUTES = [
  '/api/v1/users',
  '/api/v1/config/ai',
  '/api/v1/settings',
  '/api/v1/tax-config',
  '/api/v1/audit',
];

// Routes that require minimum admin role for mutations
const ADMIN_MUTATION_ROUTES = [
  '/api/v1/business',
];

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const session = req.auth;
  const origin = req.headers.get('origin');

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    const response = new NextResponse(null, { status: 204 });
    return addCorsHeaders(response, origin);
  }

  const isFullyPublic = PUBLIC_ROUTES.some((r) => pathname.startsWith(r));
  const isReadOnlyPublic = READ_ONLY_PUBLIC_ROUTES.some((r) => pathname.startsWith(r));

  if (isFullyPublic) {
    if (session && pathname === '/login') {
      return NextResponse.redirect(new URL('/', req.url));
    }
    const response = NextResponse.next();
    return addCorsHeaders(response, origin);
  }

  if (isReadOnlyPublic && req.method === 'GET') {
    const response = NextResponse.next();
    return addCorsHeaders(response, origin);
  }

  if (!session) {
    if (pathname.startsWith('/api/')) {
      const response = NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
      return addCorsHeaders(response, origin);
    }
    const loginUrl = new URL('/login', req.url);
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // RBAC: check admin-only routes
  const userRole = (session.user as any)?.role as string | undefined;
  const isAdminRoute = ADMIN_ONLY_API_ROUTES.some((r) => pathname.startsWith(r));
  const isAdminMutationRoute = ADMIN_MUTATION_ROUTES.some((r) => pathname.startsWith(r));

  if (isAdminRoute && !['super_admin', 'admin'].includes(userRole || '')) {
    const response = NextResponse.json({ success: false, error: 'Forbidden: admin access required' }, { status: 403 });
    return addCorsHeaders(response, origin);
  }

  if (isAdminMutationRoute && req.method !== 'GET' && !['super_admin', 'admin'].includes(userRole || '')) {
    const response = NextResponse.json({ success: false, error: 'Forbidden: admin access required' }, { status: 403 });
    return addCorsHeaders(response, origin);
  }

  // Block readonly users from mutations on any route
  if (req.method !== 'GET' && req.method !== 'HEAD' && userRole === 'readonly') {
    const response = NextResponse.json({ success: false, error: 'Forbidden: read-only access' }, { status: 403 });
    return addCorsHeaders(response, origin);
  }

  const response = NextResponse.next();
  return addCorsHeaders(response, origin);
});

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|images/).*)'],
};
