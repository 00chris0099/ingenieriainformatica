// ═══════════════════════════════════════════════════════════════════════════
// Tipografías del sitio — catálogo curado y helpers para aplicar la fuente
// elegida en el editor (canvas), en la vista pública y en las plantillas.
// ═══════════════════════════════════════════════════════════════════════════

export interface FontOption {
  id: string
  label: string
  /** Nombre exacto en Google Fonts (con espacios), p.ej. 'Playfair Display' */
  google: string
  stack: string
  weights: string
  /** Si la familia es display (para sugerencias de plantilla). */
  display?: boolean
}

export const FONT_OPTIONS: FontOption[] = [
  { id: 'sora', label: 'Sora', google: 'Sora', stack: "'Sora','Inter',system-ui,-apple-system,'Segoe UI',sans-serif", weights: '400;600;700;800', display: true },
  { id: 'inter', label: 'Inter', google: 'Inter', stack: "'Inter',system-ui,-apple-system,'Segoe UI',sans-serif", weights: '400;500;600;700' },
  { id: 'poppins', label: 'Poppins', google: 'Poppins', stack: "'Poppins',system-ui,sans-serif", weights: '400;500;600;700', display: true },
  { id: 'montserrat', label: 'Montserrat', google: 'Montserrat', stack: "'Montserrat',system-ui,sans-serif", weights: '400;500;600;700;800', display: true },
  { id: 'dm-sans', label: 'DM Sans', google: 'DM Sans', stack: "'DM Sans',system-ui,sans-serif", weights: '400;500;700' },
  { id: 'space-grotesk', label: 'Space Grotesk', google: 'Space Grotesk', stack: "'Space Grotesk',system-ui,sans-serif", weights: '400;500;600;700', display: true },
  { id: 'playfair', label: 'Playfair Display', google: 'Playfair Display', stack: "'Playfair Display',Georgia,'Times New Roman',serif", weights: '400;600;700;800', display: true },
  { id: 'lora', label: 'Lora', google: 'Lora', stack: "'Lora',Georgia,'Times New Roman',serif", weights: '400;500;600;700' },
  { id: 'oswald', label: 'Oswald', google: 'Oswald', stack: "'Oswald',system-ui,sans-serif", weights: '400;500;600;700', display: true },
  { id: 'bebas', label: 'Bebas Neue', google: 'Bebas Neue', stack: "'Bebas Neue',system-ui,sans-serif", weights: '400', display: true },
]

export const DEFAULT_FONT_ID = 'sora'

/** Resuelve la opción de fuente a partir de settings (campo `fontFamily`). */
export function resolveFont(settings?: Record<string, any> | null): FontOption {
  const id = settings?.fontFamily || DEFAULT_FONT_ID
  return FONT_OPTIONS.find(f => f.id === id) || FONT_OPTIONS[0]!
}

/** Stack CSS completo (con fallbacks) para la fuente elegida. */
export function fontStack(settings?: Record<string, any> | null): string {
  return resolveFont(settings).stack
}

/** URL del stylesheet de Google Fonts para la fuente elegida. */
export function googleFontsHref(settings?: Record<string, any> | null): string {
  const f = resolveFont(settings)
  return `https://fonts.googleapis.com/css2?family=${f.google.replace(/ /g, '+')}:wght@${f.weights}&display=swap`
}
