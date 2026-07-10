import { describe, it, expect } from 'vitest';
import { cn, apiSuccess, apiError, apiPaginated, parsePagination } from '@/lib/api/handler';

describe('API Handler Utilities', () => {
  describe('cn', () => {
    it('concatenates class names', () => {
      expect(cn('foo', 'bar')).toBe('foo bar');
    });

    it('filters falsy values', () => {
      expect(cn('foo', false, null, undefined, 'bar')).toBe('foo bar');
    });
  });

  describe('apiSuccess', () => {
    it('returns success response', async () => {
      const response = apiSuccess({ id: 1 }, 200);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data).toEqual({ id: 1 });
      expect(response.status).toBe(200);
    });

    it('returns custom status', async () => {
      const response = apiSuccess({ id: 1 }, 201);
      expect(response.status).toBe(201);
    });
  });

  describe('apiError', () => {
    it('returns error response', async () => {
      const response = apiError('Not found', 404);
      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.error).toBe('Not found');
      expect(response.status).toBe(404);
    });
  });

  describe('apiPaginated', () => {
    it('returns paginated response', async () => {
      const response = apiPaginated([1, 2, 3], 10, 1, 3);
      const data = await response.json();
      expect(data.pagination.page).toBe(1);
      expect(data.pagination.total).toBe(10);
      expect(data.pagination.totalPages).toBe(4);
      expect(data.pagination.hasNext).toBe(true);
      expect(data.pagination.hasPrev).toBe(false);
    });
  });

  describe('parsePagination', () => {
    it('parses default values', () => {
      const result = parsePagination(new URLSearchParams());
      expect(result.page).toBe(1);
      expect(result.limit).toBe(20);
      expect(result.offset).toBe(0);
    });

    it('parses custom values', () => {
      const result = parsePagination(new URLSearchParams({ page: '3', limit: '10' }));
      expect(result.page).toBe(3);
      expect(result.limit).toBe(10);
      expect(result.offset).toBe(20);
    });

    it('caps limit at 100', () => {
      const result = parsePagination(new URLSearchParams({ limit: '200' }));
      expect(result.limit).toBe(100);
    });
  });
});
