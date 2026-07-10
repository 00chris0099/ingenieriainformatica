import { prisma } from '@repo/prisma';

interface CreateVersionParams {
  productId: string;
  snapshot: any;
  changeType?: 'manual' | 'auto';
  authorName?: string;
}

/**
 * Crea una nueva version (snapshot) de un producto
 */
export async function createProductVersion(params: CreateVersionParams): Promise<string> {
  const { productId, snapshot, changeType = 'manual', authorName = 'Sistema' } = params;

  // Obtener ultima version
  const lastVersion = await prisma.productVersion.findFirst({
    where: { productId },
    orderBy: { version: 'desc' },
  });

  const nextVersion = (lastVersion?.version || 0) + 1;

  // Calcular diff con la version anterior
  let diff = null;
  if (lastVersion) {
    diff = calculateDiff(lastVersion.snapshot as any, snapshot);
  }

  // Crear version
  const version = await prisma.productVersion.create({
    data: {
      productId,
      version: nextVersion,
      snapshot,
      diff,
      changeType,
      authorName,
    },
  });

  return version.id;
}

/**
 * Calcula las diferencias entre dos snapshots
 */
function calculateDiff(prev: any, curr: any): any {
  const changes: string[] = [];

  // Campos de texto
  const textFields = ['name', 'description', 'shortDescription', 'brand', 'model', 'sku', 'status', 'color', 'recommendedAge', 'originCountry'];
  for (const field of textFields) {
    if (prev[field] !== curr[field]) {
      changes.push(`${field}: "${prev[field] || ''}" → "${curr[field] || ''}"`);
    }
  }

  // Campos numericos
  const numberFields = ['weight', 'warrantyDays', 'lowStockAlert'];
  for (const field of numberFields) {
    if (prev[field] !== curr[field]) {
      changes.push(`${field}: ${prev[field] || 0} → ${curr[field] || 0}`);
    }
  }

  // Dimensiones
  if (JSON.stringify(prev.dimensions) !== JSON.stringify(curr.dimensions)) {
    changes.push('dimensions updated');
  }

  // Arrays
  const arrayFields = ['tags', 'images', 'materials'];
  for (const field of arrayFields) {
    if (JSON.stringify(prev[field] || []) !== JSON.stringify(curr[field] || [])) {
      changes.push(`${field} updated`);
    }
  }

  // Variantes
  const prevVariants = prev.variants?.length || 0;
  const currVariants = curr.variants?.length || 0;
  if (prevVariants !== currVariants) {
    changes.push(`variants: ${prevVariants} → ${currVariants}`);
  } else if (prevVariants > 0) {
    // Comparar precios de variantes
    for (let i = 0; i < currVariants; i++) {
      const prevPrice = prev.variants?.[i]?.price;
      const currPrice = curr.variants?.[i]?.price;
      if (prevPrice !== currPrice) {
        changes.push(`variant[${i}] price: ${prevPrice} → ${currPrice}`);
      }
    }
  }

  // Precios
  if (JSON.stringify(prev.prices) !== JSON.stringify(curr.prices)) {
    changes.push('prices updated');
  }

  // Popup descuento
  if (JSON.stringify(prev.discountPopup) !== JSON.stringify(curr.discountPopup)) {
    changes.push('discount popup updated');
  }

  return changes.length > 0 ? { changes, timestamp: new Date().toISOString() } : null;
}

/**
 * Obtiene el historial de versiones de un producto
 */
export async function getProductVersions(productId: string, limit = 50) {
  return prisma.productVersion.findMany({
    where: { productId },
    orderBy: { version: 'desc' },
    take: limit,
  });
}

/**
 * Obtiene una version especifica
 */
export async function getProductVersion(versionId: string) {
  return prisma.productVersion.findUnique({
    where: { id: versionId },
  });
}

/**
 * Restaura un producto desde una version
 */
export async function restoreFromVersion(versionId: string) {
  const version = await prisma.productVersion.findUnique({
    where: { id: versionId },
  });

  if (!version) {
    throw new Error('Version not found');
  }

  const snapshot = version.snapshot as any;

  // Restaurar producto
  const restored = await prisma.product.update({
    where: { id: version.productId },
    data: {
      name: snapshot.name,
      model: snapshot.model,
      description: snapshot.description,
      shortDescription: snapshot.shortDescription,
      brand: snapshot.brand,
      status: snapshot.status,
      tags: snapshot.tags || [],
      images: snapshot.images || [],
      height: snapshot.dimensions?.height || snapshot.height,
      width: snapshot.dimensions?.width || snapshot.width,
      depth: snapshot.dimensions?.depth || snapshot.depth,
      color: snapshot.color,
      materials: snapshot.materials || [],
      recommendedAge: snapshot.recommendedAge,
      warrantyDays: snapshot.warrantyDays,
      originCountry: snapshot.originCountry,
      weight: snapshot.weight,
      weightUnit: snapshot.weightUnit,
      lowStockAlert: snapshot.lowStockAlert,
      discountPopup: snapshot.discountPopup,
    },
    include: { category: true, variants: true },
  });

  // Crear version de restauracion
  await createProductVersion({
    productId: version.productId,
    snapshot: { ...restored, restoredFromVersion: version.version },
    changeType: 'manual',
    authorName: 'Restauracion',
  });

  return restored;
}

/**
 * Elimina versiones antiguas (mantiene las ultimas N)
 */
export async function pruneOldVersions(productId: string, keepLast = 50) {
  const versions = await prisma.productVersion.findMany({
    where: { productId },
    orderBy: { version: 'desc' },
    skip: keepLast,
  });

  if (versions.length > 0) {
    await prisma.productVersion.deleteMany({
      where: {
        id: { in: versions.map(v => v.id) },
      },
    });
  }

  return versions.length;
}
