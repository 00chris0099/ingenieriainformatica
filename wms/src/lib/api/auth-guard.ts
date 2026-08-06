import { NextRequest } from 'next/server';
import { auth } from '@/lib/auth';
import { apiError } from '@/lib/api/handler';

export type UserRole = 'super_admin' | 'admin' | 'warehouse_manager' | 'warehouse_staff' | 'sales_manager' | 'sales_rep' | 'logistics_coordinator' | 'customer_service' | 'finance' | 'readonly';

const ROLE_HIERARCHY: Record<UserRole, number> = {
  super_admin: 100,
  admin: 80,
  warehouse_manager: 60,
  sales_manager: 60,
  finance: 60,
  logistics_coordinator: 50,
  customer_service: 40,
  warehouse_staff: 30,
  sales_rep: 30,
  readonly: 10,
};

export async function requireAuth(request?: NextRequest) {
  const session = await auth();
  if (!session?.user) return { error: apiError('Unauthorized', 401) };
  return { session, user: session.user };
}

export async function requireRole(...allowedRoles: UserRole[]) {
  const { session, user, error } = await requireAuth();
  if (error) return { error };

  const userRole = (user as any).role as UserRole;
  if (!userRole || !allowedRoles.includes(userRole)) {
    return { error: apiError('Forbidden: insufficient permissions', 403) };
  }
  return { session, user };
}

export async function requireMinRole(minRole: UserRole) {
  const { session, user, error } = await requireAuth();
  if (error) return { error };

  const userRole = (user as any).role as UserRole;
  const userLevel = ROLE_HIERARCHY[userRole] ?? 0;
  const minLevel = ROLE_HIERARCHY[minRole] ?? 0;

  if (userLevel < minLevel) {
    return { error: apiError('Forbidden: insufficient permissions', 403) };
  }
  return { session, user };
}

/** Check if user can manage target user (cannot promote above own level) */
export async function canManageUser(targetRole: UserRole) {
  const { session, user, error } = await requireAuth();
  if (error) return { error };

  const userRole = (user as any).role as UserRole;
  const userLevel = ROLE_HIERARCHY[userRole] ?? 0;
  const targetLevel = ROLE_HIERARCHY[targetRole] ?? 0;

  if (userLevel <= targetLevel) {
    return { error: apiError('Cannot assign a role equal or higher than your own', 403) };
  }
  return { session, user };
}
