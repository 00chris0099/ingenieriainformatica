import { NextRequest, NextResponse } from 'next/server';

export function cn(...classes: (string | undefined | null | false)[]) {
  return classes.filter(Boolean).join(' ');
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  pagination?: { page: number; limit: number; total: number; totalPages: number; hasNext: boolean; hasPrev: boolean };
}

export function apiSuccess<T>(data: T, status: number = 200) {
  return NextResponse.json({ success: true, data } as ApiResponse<T>, { status });
}

export function apiPaginated<T>(data: T[], total: number, page: number, limit: number) {
  const totalPages = Math.ceil(total / limit);
  return NextResponse.json({ success: true, data, pagination: { page, limit, total, totalPages, hasNext: page < totalPages, hasPrev: page > 1 } } as ApiResponse<T[]>);
}

export function apiError(error: string, status: number = 500) {
  return NextResponse.json({ success: false, error } as ApiResponse, { status });
}

export function apiMessage(message: string, status: number = 200) {
  return NextResponse.json({ success: true, message } as ApiResponse, { status });
}

export function parsePagination(searchParams: URLSearchParams) {
  const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20')));
  return { page, limit, offset: (page - 1) * limit };
}

export function getSearchParam(searchParams: URLSearchParams, key: string): string | null {
  const v = searchParams.get(key);
  return v && v.trim() ? v.trim() : null;
}

export function handleApiError(error: unknown, context: string) {
  console.error(`API Error [${context}]:`, error);
  return apiError(error instanceof Error ? error.message : 'Internal server error', 500);
}

export async function withDbFallback<T>(dbQuery: () => Promise<T>, mockFallback: () => T): Promise<T> {
  try { return await dbQuery(); }
  catch (error: any) {
    const msg = error.message || '';
    if (msg.includes('connect') || msg.includes('ECONNREFUSED') || msg.includes("Can't reach database") || msg.includes('PrismaClientInitializationError') || msg.includes('P1000') || msg.includes('P2022')) {
      return mockFallback();
    }
    throw error;
  }
}

export function getClientIp(request: NextRequest): string {
  return request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || '127.0.0.1';
}

// Simple in-memory rate limiter (per process)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

export function checkRateLimit(key: string, maxRequests: number = 100, windowSeconds: number = 60): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const entry = rateLimitMap.get(key);

  if (!entry || now > entry.resetTime) {
    rateLimitMap.set(key, { count: 1, resetTime: now + windowSeconds * 1000 });
    return { allowed: true, remaining: maxRequests - 1 };
  }

  entry.count++;
  if (entry.count > maxRequests) {
    return { allowed: false, remaining: 0 };
  }
  return { allowed: true, remaining: maxRequests - entry.count };
}

// Simple Zod-like validation helper
export function validate(body: any, rules: Record<string, { required?: boolean; type?: string; min?: number; max?: number; pattern?: RegExp }>): string | null {
  for (const [field, rule] of Object.entries(rules)) {
    const value = body[field];
    if (rule.required && (value === undefined || value === null || value === '')) {
      return `${field} is required`;
    }
    if (rule.type && value !== undefined && value !== null && typeof value !== rule.type) {
      return `${field} must be of type ${rule.type}`;
    }
    if (rule.min !== undefined && typeof value === 'string' && value.length < rule.min) {
      return `${field} must be at least ${rule.min} characters`;
    }
    if (rule.max !== undefined && typeof value === 'string' && value.length > rule.max) {
      return `${field} must be at most ${rule.max} characters`;
    }
    if (rule.pattern && typeof value === 'string' && !rule.pattern.test(value)) {
      return `${field} format is invalid`;
    }
  }
  return null;
}
