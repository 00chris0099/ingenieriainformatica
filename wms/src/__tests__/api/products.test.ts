import { describe, it, expect, vi, beforeEach } from 'vitest';

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

describe('Products API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('GET returns paginated products', async () => {
    const { GET } = await import('@/app/api/v1/products/route');
    const request = new Request('http://localhost/api/v1/products?page=1&limit=10');
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
    const request = new Request('http://localhost/api/v1/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sku: 'TEST-001', name: 'Test Product' }),
    });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
  });

  it('POST fails without required fields', async () => {
    const { POST } = await import('@/app/api/v1/products/route');
    const request = new Request('http://localhost/api/v1/products', {
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
