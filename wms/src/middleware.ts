import { auth } from '@/lib/auth';
import { NextResponse } from 'next/server';

const ALLOWED_ORIGINS = [
  process.env.NEXT_PUBLIC_STORE_URL || 'https://aimachristian-tiendawms.ajcxjb.easypanel.host',
  process.env.NEXT_PUBLIC_WMS_URL || 'https://aimachristian-tiendawms.ajcxjb.easypanel.host',
  'http://localhost:3000',
  'http://localhost:3001',
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

const PUBLIC_ROUTES = [
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password',
  '/api/auth',
  '/api/v1/auth',
  '/api/v1/health',
  '/api/v1/store',
  '/api/v1/payments',
  '/p/',
  '/pedido/',
  '/blog/',
  '/manifest.json',
  '/sw.js',
  '/site.webmanifest',
];

const READ_ONLY_PUBLIC_ROUTES = [
  '/api/v1/products',
  '/api/v1/categories',
];

// Routes reserved exclusively for Super Admin / Agency Admin
const SUPER_ADMIN_ONLY_PAGES = [
  // Agencia & diseño
  '/builder',
  '/pages',
  // Gestión de clientes / finanzas (solo agencia)
  '/clientes',
  '/finanzas',
  '/usuarios',
  '/roles',
  // Control super admin
  '/configuracion',
  '/auditoria',
  '/admin',
  '/cupones',
  '/reportes',
  '/analytics-avanzado',
];

const ADMIN_ONLY_API_ROUTES = [
  '/api/v1/users',
  '/api/v1/config/ai',
  '/api/v1/ai/test',
  '/api/v1/settings',
  '/api/v1/audit',
];

const ADMIN_MUTATION_ROUTES = [
  '/api/v1/business',
];

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const session = req.auth;
  const origin = req.headers.get('origin');

  // Extract host and subdomain for multi-tenant VPS resolution
  const host = req.headers.get('x-forwarded-host') || req.headers.get('host') || '';
  const rootDomain = (process.env.WMS_URL || 'aimachristian-tiendawms.ajcxjb.easypanel.host')
    .replace(/^https?:\/\//, '')
    .split(':')[0];

  let tenantSubdomain: string | null = null;
  const cleanHost = host.split(':')[0];

  if (cleanHost && rootDomain && cleanHost !== rootDomain && cleanHost.endsWith(`.${rootDomain}`)) {
    tenantSubdomain = cleanHost.replace(`.${rootDomain}`, '');
  }

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    const response = new NextResponse(null, { status: 204 });
    return addCorsHeaders(response, origin);
  }

  const isFullyPublic = PUBLIC_ROUTES.some((r) => pathname.startsWith(r));
  const isReadOnlyPublic = READ_ONLY_PUBLIC_ROUTES.some((r) => pathname.startsWith(r));

  // Cron de recuperación de carritos abandonados: POST /api/v1/carts/* con el
  // secret de entorno (cron-job.org / EasyPanel) pasa sin sesión.
  const isCartCron =
    req.method === 'POST' &&
    pathname.startsWith('/api/v1/carts') &&
    !!process.env.CART_CRON_SECRET &&
    req.headers.get('x-cron-secret') === process.env.CART_CRON_SECRET;

  if (isFullyPublic || isCartCron) {
    if (session && ['/login', '/register', '/forgot-password', '/reset-password'].includes(pathname)) {
      return NextResponse.redirect(new URL('/', req.url));
    }
    const response = NextResponse.next();
    if (tenantSubdomain) response.headers.set('x-tenant-subdomain', tenantSubdomain);
    response.headers.set('x-tenant-host', cleanHost || '');
    return addCorsHeaders(response, origin);
  }

  if (isReadOnlyPublic && req.method === 'GET') {
    const response = NextResponse.next();
    if (tenantSubdomain) response.headers.set('x-tenant-subdomain', tenantSubdomain);
    response.headers.set('x-tenant-host', cleanHost || '');
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

  // Sesión revocada (Configuración → Seguridad): expulsar del panel.
  if ((session.user as any)?.sessionRevoked && !pathname.startsWith('/login')) {
    const expiredUrl = new URL('/login', req.url);
    expiredUrl.searchParams.set('expired', '1');
    return NextResponse.redirect(expiredUrl);
  }

  // RBAC Roles Check
  const userRole = (session.user as any)?.role as string | undefined;
  const isSuperAdmin = ['super_admin', 'admin'].includes(userRole || '');

  // Restrict Super Admin pages (Visual Builder, Theme settings, Audit, System Users) from Store Clients
  // Exception: a client may open /builder/<uuid> (their own assigned store page) — the pages API
  // enforces the multi-tenant ownership check server-side.
  const BUILDER_PAGE_REGEX = /^\/builder\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
  const isSuperAdminPage =
    SUPER_ADMIN_ONLY_PAGES.some((p) => pathname.startsWith(p)) && !BUILDER_PAGE_REGEX.test(pathname);
  if (isSuperAdminPage && !isSuperAdmin) {
    // Redirect store client to their simplified merchant portal (/catalogo or /pedidos)
    return NextResponse.redirect(new URL('/mis-tiendas', req.url));
  }

  // Restrict Super Admin APIs
  const isAdminRoute = ADMIN_ONLY_API_ROUTES.some((r) => pathname.startsWith(r));
  const isAdminMutationRoute = ADMIN_MUTATION_ROUTES.some((r) => pathname.startsWith(r));

  if (isAdminRoute && !isSuperAdmin) {
    const response = NextResponse.json({ success: false, error: 'Forbidden: super_admin access required' }, { status: 403 });
    return addCorsHeaders(response, origin);
  }

  if (isAdminMutationRoute && req.method !== 'GET' && !isSuperAdmin) {
    // La ruta de agencia es /api/v1/business (exacto): '/api/v1/businesses/...'
    // es multi-tenant y NO debe bloquearse aquí (el guard de propiedad vive en la API).
    const isExactBusinessRoute = pathname === '/api/v1/business' || pathname.startsWith('/api/v1/business/');
    if (isExactBusinessRoute) {
      const response = NextResponse.json({ success: false, error: 'Forbidden: super_admin access required' }, { status: 403 });
      return addCorsHeaders(response, origin);
    }
  }

  // Block readonly users from mutations on any route
  if (req.method !== 'GET' && req.method !== 'HEAD' && userRole === 'readonly') {
    const response = NextResponse.json({ success: false, error: 'Forbidden: read-only access' }, { status: 403 });
    return addCorsHeaders(response, origin);
  }

  const response = NextResponse.next();
  if (tenantSubdomain) response.headers.set('x-tenant-subdomain', tenantSubdomain);
  response.headers.set('x-tenant-host', cleanHost || '');
  return addCorsHeaders(response, origin);
});

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|images/|sw.js|manifest.json|site.webmanifest|robots.txt).*)'],
};
