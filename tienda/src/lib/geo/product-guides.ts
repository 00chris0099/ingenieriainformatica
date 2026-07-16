export interface ProductGuide {
  productName: string;
  steps: { title: string; content: string }[];
}

const guides: Record<string, ProductGuide> = {
  'cuna-convertible': {
    productName: 'Cuna Convertible 3 en 1',
    steps: [
      { title: 'Desempaquetar', content: 'Retire todos los componentes del empaque. Verifique que tenga: 4 patas, 4 barrotes laterales, base ajustable, tornillos y destornillador.' },
      { title: 'Armar la base', content: 'Coloque las 4 patas sobre una superficie plana. Atornille cada pata a la base principal siguiendo el diagrama.' },
      { title: 'Insertar barrotes', content: 'Deslice los barrotes laterales en las ranuras designadas. Asegure cada barrote con los tornillos incluidos.' },
      { title: 'Ajustar altura', content: 'La base tiene 3 posiciones de altura: alta (recien nacido), media (6 meses), baja (cuando se sienta).' },
      { title: 'Verificar seguridad', content: 'Compruebe que todos los tornillos esten apretados. Los barrotes no deben tener espacio superior a 6 cm.' },
    ],
  },
  'silla-alta': {
    productName: 'Silla Alta Ajustable',
    steps: [
      { title: 'Armar estructura', content: 'Ensamble las patas traseras y delanteras a la base de la silla. Asegure con los pernos incluidos.' },
      { title: 'Ajustar altura', content: 'La silla tiene 7 posiciones de altura. Presione los botones laterales para ajustar.' },
      { title: 'Colocar bandeja', content: 'Inserte la bandeja en las guias laterales. Puede retirarla facilmente para limpiar.' },
      { title: 'Seguridad', content: 'Siempre use el arnes de 5 puntos. Verifique que el bloqueo de rodillas este activo.' },
    ],
  },
  'cochecito-city-mini': {
    productName: 'Cochecito City Mini',
    steps: [
      { title: 'Desplegar', content: 'Desbloquee el mecanismo central tirando de la correa. El cochecito se desplegara automaticamente.' },
      { title: 'Ajustar respaldo', content: 'El respaldo tiene 3 posiciones: sentado, semi-reclinado y completamente reclinado para dormir.' },
      { title: 'Colocar canasta', content: 'Atache la canasta inferior a los ganchos del chasis. Soporta hasta 5 kg.' },
      { title: 'Plegar', content: 'Tire de la correa central con una sola mano. El cochecito se plegara automaticamente en segundos.' },
    ],
  },
};

export function getGuide(slug: string): ProductGuide | null {
  return guides[slug] || null;
}

export function getAllGuides(): ProductGuide[] {
  return Object.values(guides);
}
