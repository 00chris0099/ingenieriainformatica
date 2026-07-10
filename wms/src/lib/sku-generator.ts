import { prisma } from '@repo/prisma';

// Cache en memoria para secuencias (se resetea al reiniciar el servidor)
const sequenceCache = new Map<string, number>();

/**
 * Genera un codigo de categoria corto a partir del nombre
 * Ejemplo: "Muebles para Bebe" -> "MUE", "Accesorios" -> "ACC"
 */
function getCategoryCode(categoryName: string): string {
  const words = categoryName
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .split(/\s+/)
    .filter(w => w.length > 2 && !['PARA', 'LOS', 'LAS', 'DEL', 'DE', 'EL', 'LA', 'UN', 'UNA'].includes(w));

  if (words.length >= 2) {
    return words.slice(0, 2).map(w => w.substring(0, 2)).join('');
  }
  return words[0]?.substring(0, 3) || 'PRD';
}

/**
 * Obtiene el siguiente numero de secuencia para una categoria
 */
async function getNextSequence(categoryCode: string): Promise<number> {
  // Buscar en cache primero
  const cached = sequenceCache.get(categoryCode);
  if (cached !== undefined) {
    const next = cached + 1;
    sequenceCache.set(categoryCode, next);
    return next;
  }

  // Buscar el ultimo SKU con este prefijo en la BD
  const prefix = `ADK-${categoryCode}-`;
  const lastProduct = await prisma.product.findFirst({
    where: {
      sku: { startsWith: prefix },
    },
    orderBy: { sku: 'desc' },
    select: { sku: true },
  });

  let lastNumber = 0;
  if (lastProduct) {
    const numPart = lastProduct.sku.replace(prefix, '');
    lastNumber = parseInt(numPart, 10) || 0;
  }

  const next = lastNumber + 1;
  sequenceCache.set(categoryCode, next);
  return next;
}

/**
 * Genera un SKU secuencial basado en la categoria del producto
 * Formato: ADK-{CATCODE}-{001}
 */
export async function generateSequentialSku(categoryName?: string | null): Promise<string> {
  const categoryCode = categoryName ? getCategoryCode(categoryName) : 'PRD';
  const sequence = await getNextSequence(categoryCode);
  const paddedSequence = String(sequence).padStart(3, '0');
  return `ADK-${categoryCode}-${paddedSequence}`;
}

/**
 * Verifica si un SKU ya existe
 */
export async function skuExists(sku: string): Promise<boolean> {
  const existing = await prisma.product.findUnique({
    where: { sku },
    select: { id: true },
  });
  return !!existing;
}

/**
 * Genera un SKU unico, verificando que no exista
 */
export async function generateUniqueSku(categoryName?: string | null): Promise<string> {
  let sku = await generateSequentialSku(categoryName);
  let attempts = 0;

  while (await skuExists(sku) && attempts < 10) {
    sku = await generateSequentialSku(categoryName);
    attempts++;
  }

  return sku;
}
