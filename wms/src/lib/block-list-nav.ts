/**
 * Navegación por teclado de la lista de bloques del panel izquierdo del builder.
 * Devuelve el bloque visible vecino al actual dentro del contenedor de la lista,
 * con envoltura (el primero enlaza con el último y viceversa).
 * Solo considera bloques renderizados: los grupos colapsados y los filtrados
 * no aparecen en el DOM, por lo que se saltan de forma natural.
 */
export function neighborBlockEl(container: HTMLElement | null, current: HTMLElement, dir: 1 | -1): HTMLElement | null {
  const els = Array.from(container?.querySelectorAll<HTMLElement>('[data-block-id]') ?? [])
  const idx = els.indexOf(current)
  if (idx === -1 || els.length === 0) return null
  return els[(idx + dir + els.length) % els.length] ?? null
}
