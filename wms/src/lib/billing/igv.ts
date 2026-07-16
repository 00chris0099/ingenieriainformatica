const IGV_RATE = 0.18;

export function calcularIGV(subtotal: number, tasa: number = IGV_RATE): {
  subtotal: number;
  igv: number;
  total: number;
} {
  const igv = Math.round(subtotal * tasa * 100) / 100;
  const total = Math.round((subtotal + igv) * 100) / 100;
  return { subtotal, igv, total };
}

export function desgloseIGV(total: number, tasa: number = IGV_RATE): {
  base: number;
  igv: number;
  total: number;
} {
  const base = Math.round((total / (1 + tasa)) * 100) / 100;
  const igv = Math.round((total - base) * 100) / 100;
  return { base, igv, total };
}

export function calcularIGVPorItem(items: Array<{ quantity: number; unitPrice: number; discount?: number }>): {
  subtotal: number;
  totalDescuentos: number;
  baseImponible: number;
  igv: number;
  total: number;
} {
  let subtotal = 0;
  let totalDescuentos = 0;

  for (const item of items) {
    const itemSubtotal = item.quantity * item.unitPrice;
    const itemDescuento = item.discount || 0;
    subtotal += itemSubtotal;
    totalDescuentos += itemDescuento;
  }

  const baseImponible = subtotal - totalDescuentos;
  const igv = Math.round(baseImponible * IGV_RATE * 100) / 100;
  const total = Math.round((baseImponible + igv) * 100) / 100;

  return { subtotal, totalDescuentos, baseImponible, igv, total };
}

export function formatSoles(amount: number): string {
  return `S/ ${amount.toFixed(2)}`;
}

export function esExonerado(tipoDocumento: string): boolean {
  return ['31', '32', '33', '34', '35', '36', '37'].includes(tipoDocumento);
}

export function esInafecto(tipoDocumento: string): boolean {
  return ['21', '22', '23', '24', '25', '26', '27'].includes(tipoDocumento);
}
