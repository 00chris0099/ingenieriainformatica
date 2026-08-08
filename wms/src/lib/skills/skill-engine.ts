import { UI_UX_SKILLS, UIUXSkill } from './ui-ux-skills'

export const PAGE_TYPE_LABELS: Record<string, string> = {
  store: 'Tienda Virtual (multi-ventana: Inicio, Catálogo, y landing por producto)',
  landing: 'Landing Page de Alta Conversión (una sola ventana)',
  corporate: 'Página Corporativa (multi-sección)',
}

const SKILL_MAP: Record<string, string[]> = {
  store: ['fashion_store', 'tech_ecommerce', 'food_ecommerce', 'general_store'],
  landing: ['landing_page', 'saas_landing', 'local_business_landing'],
  corporate: ['corporate_services', 'professional_corporate', 'general_corporate'],
}

/**
 * Resolves the most specific skill for the given page type + industry.
 * Falls back to a general skill of the same type.
 */
export function getSkillForPageType(pageType: string, industry?: string): UIUXSkill {
  const candidates = SKILL_MAP[pageType] || []
  const industryLower = (industry || '').toLowerCase()

  // 1. Try industry-match inside the type bucket
  for (const skillId of candidates) {
    const skill = UI_UX_SKILLS[skillId]
    if (!skill) continue
    const industryHits = (skill.industries || []).some(ind => industryLower.includes(ind))
    if (industryHits) return skill
  }

  // 2. Type-generic fallback
  const generic = UI_UX_SKILLS[`${pageType}_general`]
  if (generic) return generic

  // 3. Last resort
  const fallback = UI_UX_SKILLS[pageType === 'store' ? 'fashion_store' : pageType === 'landing' ? 'landing_page' : 'corporate_services']
  if (!fallback) {
    throw new Error(`No UI/UX skill available for page type "${pageType}"`)
  }
  return fallback
}

/**
 * Builds the system prompt embedding the skill's design system, conversion rules,
 * and SEO/GEO best practices so the AI produces on-brand, conversion-ready output.
 */
export function buildSkillSystemPrompt(skill: UIUXSkill, pageType: string, businessName: string, businessDescription: string): string {
  const palette = skill.designSystemRules.colorPalette
  const seoGeo = buildSEOGEORules(pageType)

  return `Eres un diseñador web senior y experto en conversión, SEO y GEO (Generative Engine Optimization) para ${PAGE_TYPE_LABELS[pageType] || pageType}.

NEGOCIO: ${businessName}
DESCRIPCIÓN: ${businessDescription}

APLICAS EL SKILL DE DISEÑO: "${skill.name}"
- Tipo: ${skill.type}
- Descripción del skill: ${skill.description}

SISTEMA DE DISEÑO OBLIGATORIO:
- Tipografía: ${skill.designSystemRules.fontFamily}
- Paleta: fondo ${palette.bg}, texto ${palette.text}, acento ${palette.accent} (usa el acento SOLO en CTAs, precios y highlights), badges ${palette.badgeBg}
- Bordes redondeados: ${skill.designSystemRules.borderRadius}
- Padding vertical de secciones: ${skill.designSystemRules.paddingVertical}px

REGLAS DE CONVERSIÓN (obligatorias):
${skill.conversionRules.map(r => `- ${r}`).join('\n')}

${seoGeo}

REGLAS GENERALES:
1. Genera SOLO JSON válido. Nada de texto fuera del JSON, nada de bloques de código.
2. Contenido 100% en español, real y específico para "${businessName}" (nunca lorem ipsum).
3. Cero emojis: usa iconName de lucide-react (Home, Shirt, Sparkles, Truck, ShieldCheck, Leaf, Wine, Headphones, Zap, Watch, Gift, Target, Eye, Handshake, etc.).
4. Imágenes de producto/sección: usa URLs de Unsplash (images.unsplash.com/photo-...?...w=800&auto=format&fit=crop).
5. Hero: propuesta de valor clara, badge promocional, título potente, subtítulo, 2 botones CTA.
6. Secuencia de bloques sugerida: ${skill.requiredBlockSequence.join(' → ')}.`
}

/**
 * SEO + GEO rules tailored per page type (injected into the AI prompt).
 */
function buildSEOGEORules(pageType: string): string {
  const base = `REGLAS SEO y GEO (obligatorias):
- metaTitle: máximo 60 caracteres, incluye la palabra clave principal y el nombre de la marca.
- metaDescription: máximo 160 caracteres, persuasiva con llamada a la acción.
- keywords: 8-10 keywords long-tail relevantes al rubro y a la ciudad (p.ej. "comprar [producto] en Lima").
- Usa lenguaje natural y respondón para que asistentes de IA (SearchGPT, Gemini, Perplexity) puedan citar la página: frases de autoridad, datos verificables, FAQ con preguntas reales que la gente busca.
- Los títulos de sección (h2) deben ser descriptivos y con keywords naturales.`

  if (pageType === 'store') {
    return `${base}
- GEO tienda: estructura de datos de producto (nombre, precio en soles, descuento, tallas, envío a Perú), reseñas de clientes verificadas, FAQ de envío/pagos/cambios, sección "Por qué comprar en [marca]".`
  }
  if (pageType === 'landing') {
    return `${base}
- GEO landing: propuesta de valor clara respondiendo "¿qué es?", "¿para quién?", "¿cuánto cuesta?", prueba social con números, garantía, FAQ de objeciones de compra, CTA repetido.`
  }
  return `${base}
- GEO corporativa: sección Nosotros con misión/visión/valores, datos de contacto estructurados, años de experiencia, certificaciones, mapa/horarios, FAQ institucional.`
}
