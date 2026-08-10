import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

// Mock Prisma
vi.mock('@repo/prisma', () => ({
  prisma: {
    product: {
      findMany: vi.fn().mockResolvedValue([]),
      findUnique: vi.fn().mockResolvedValue(null),
      count: vi.fn().mockResolvedValue(0),
      create: vi.fn().mockResolvedValue({ id: '1', sku: 'TEST', name: 'Test Product', slug: 'test-product', status: 'active' }),
      update: vi.fn().mockResolvedValue({ id: '1' }),
      delete: vi.fn().mockResolvedValue({ id: '1' }),
    },
    category: {
      findMany: vi.fn().mockResolvedValue([]),
      findUnique: vi.fn().mockResolvedValue(null),
    },
  },
}));

// Mock cache
vi.mock('@/lib/cache', () => ({
  cached: vi.fn((_key: string, fn: () => Promise<any>) => fn()),
  invalidateCache: vi.fn().mockResolvedValue(undefined),
}));

// Mock auth: the products API is now multi-tenant and requires a session
vi.mock('@/lib/api/auth-guard', () => ({
  requireAuth: vi.fn().mockResolvedValue({
    user: { id: 'staff-1', role: 'super_admin' },
    session: { user: { id: 'staff-1', role: 'super_admin' } },
  }),
  requireRole: vi.fn().mockResolvedValue({
    user: { id: 'staff-1', role: 'super_admin' },
    session: {},
  }),
}));

describe('Products API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('GET returns paginated products', async () => {
    const { GET } = await import('@/app/api/v1/products/route');
    const request = new NextRequest('http://localhost/api/v1/products?page=1&limit=10');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.pagination).toBeDefined();
    expect(data.pagination.page).toBe(1);
    expect(data.pagination.limit).toBe(10);
  });

  it('POST creates a product', async () => {
    const { POST } = await import('@/app/api/v1/products/route');
    const request = new NextRequest('http://localhost/api/v1/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sku: 'TEST-001', name: 'Test Product' }),
    });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.success).toBe(true);
  });

  it('POST fails without required fields', async () => {
    const { POST } = await import('@/app/api/v1/products/route');
    const request = new NextRequest('http://localhost/api/v1/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
  });
});
