const synonyms: Record<string, string[]> = {
  cuna: ['berlin', 'cama convertible', 'cuna portatil', 'cuna bebe', 'cuna plegable', 'camita'],
  silla: ['silla alta', 'silla para comer', 'silla comedor', 'high chair', 'silla ajustable'],
  cochecito: ['carrito', 'stroller', 'paseo', 'coche bebe', 'cochecito plegable'],
  decoracion: ['nursery', 'habitacion bebe', 'decoracion bebe', 'ambientacion'],
  bano: ['tina', 'banera', 'escalera bano', 'higiene bebe'],
  juguete: ['juegos', 'entretenimiento', 'actividades bebe', 'tablero actividades'],
  organizador: ['caja organizadora', 'estanteria', 'almacenamiento', 'guardar juguetes'],
  seguridad: ['certificacion', 'norma', 'seguro', 'proteccion'],
  envio: ['delivery', 'entrega', 'despacho', 'transporte'],
  pago: ['pago tarjeta', 'yape', 'plin', 'contraentrega', 'transferencia'],
  garantia: ['garantia', 'devolucion', 'reembolso', 'cambio'],
  led: ['luces', 'iluminacion', 'guirnalda', 'estrellas'],
  plegable: ['plegable', 'portatil', 'compacto', 'facil guardar'],
  ajustable: ['regulable', 'ajustable', 'adaptable', 'variable'],
  convertible: ['3 en 1', 'multiusos', 'transformable', 'versatil'],
  premium: ['premium', 'alta calidad', 'gama alta', 'exclusivo'],
  silicona: ['silicona', 'flexible', 'suave', 'seguro'],
  peluche: ['peluche', 'suave', 'mullido', 'acolchado'],
  montessori: ['montessori', 'educativo', 'desarrollo', 'aprendizaje'],
  tipi: ['tipi', 'carpa', 'tienda', 'campamento'],
};

export function expandSearch(term: string): string[] {
  const lower = term.toLowerCase().trim();
  const expanded = [lower];

  for (const [key, syns] of Object.entries(synonyms)) {
    if (lower.includes(key) || syns.some((s) => lower.includes(s))) {
      expanded.push(key, ...syns);
    }
  }

  return [...new Set(expanded)];
}

export function filterWithSynonyms<T>(
  items: T[],
  searchTerm: string,
  getSearchable: (item: T) => string
): T[] {
  if (!searchTerm.trim()) return items;

  const terms = expandSearch(searchTerm);
  const lower = searchTerm.toLowerCase();

  return items.filter((item) => {
    const searchable = getSearchable(item).toLowerCase();
    return terms.some((term) => searchable.includes(term)) || searchable.includes(lower);
  });
}
