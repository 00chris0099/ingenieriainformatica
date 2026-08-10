import { prisma } from '@repo/prisma';

/**
 * Multi-tenant access helpers: a client (role 'client') can only access
 * pages/builders of the businesses (tiendas virtuales) assigned to them.
 * Super admins and admins have full access.
 */

export function isStaffRole(role?: string | null): boolean {
  return role === 'super_admin' || role === 'admin';
}

export async function getUserBusinessIds(userId: string): Promise<Set<string>> {
  try {
    const rows = await prisma.userBusiness.findMany({
      where: { userId },
      select: { businessId: true },
    });
    return new Set(rows.map((r) => r.businessId));
  } catch {
    return new Set();
  }
}

export async function canAccessBusiness(
  user: { id?: string; role?: string | null } | null | undefined,
  businessId?: string | null
): Promise<boolean> {
  if (!user?.id) return false;
  if (isStaffRole(user.role)) return true;
  if (!businessId) return false;
  const ids = await getUserBusinessIds(user.id);
  return ids.has(businessId);
}

/**
 * Scope para catálogo/pedidos multi-tenant:
 * - staff (super_admin/admin) → sin filtro (ids vacío)
 * - cliente → solo los ids de sus tiendas asignadas
 */
export async function getBusinessScope(user: { id?: string; role?: string | null } | null | undefined): Promise<{
  isStaff: boolean;
  ids: string[];
}> {
  if (!user?.id) return { isStaff: false, ids: [] };
  if (isStaffRole(user.role)) return { isStaff: true, ids: [] };
  const ids = Array.from(await getUserBusinessIds(user.id));
  return { isStaff: false, ids };
}

/** ¿El producto/categoría/pedido pertenece a las tiendas del usuario? (para clients) */
export function belongsToScope(businessId: string | null | undefined, scope: { isStaff: boolean; ids: string[] }): boolean {
  if (scope.isStaff) return true;
  return !!businessId && scope.ids.includes(businessId);
}
