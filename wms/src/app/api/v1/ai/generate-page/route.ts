import { NextRequest } from 'next/server';
import { apiSuccess, apiError } from '@/lib/api';
import { callAI, syncProvidersFromStore, getUsableProviders } from '@/lib/ai-runtime';
import { getSkillForPageType, buildSkillSystemPrompt } from '@/lib/skills/skill-engine';

const PAGE_TYPE_BLUEPRINTS: Record<string, { label: string; blocks: string[]; windowed: boolean }> = {
  store: {
    label: 'tienda virtual multi-ventana',
    blocks: ['navbar', 'hero', 'product-grid', 'features', 'testimonials', 'countdown', 'faq', 'newsletter', 'cta', 'footer'],
    windowed: true,
  },
  landing: {
    label: 'landing page de alta conversión (una sola ventana)',
    blocks: ['hero', 'features', 'pricing', 'testimonials', 'faq', 'cta', 'contact', 'footer'],
    windowed: false,
  },
  corporate: {
    label: 'página corporativa multi-sección',
    blocks: ['navbar', 'hero', 'features', 'about', 'team', 'gallery', 'testimonials', 'contact', 'footer'],
    windowed: true,
  },
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { businessName, businessDescription, industry, pageType, businessKeywords } = body;

    const bName = businessName || 'Mi Negocio';
    const bDesc = businessDescription || 'Empresa enfocada en brindar productos y servicios de alta calidad.';
    const type: string = ['store', 'landing', 'corporate'].includes(pageType) ? pageType : 'store';
    const blueprint = PAGE_TYPE_BLUEPRINTS[type] || PAGE_TYPE_BLUEPRINTS.store!;

    // Build system prompt from the matching UI/UX skill (conversion + SEO/GEO rules)
    const skill = getSkillForPageType(type, industry);
    const systemPrompt = buildSkillSystemPrompt(skill, type, bName, bDesc);

    const userPrompt = `Genera la estructura de bloques (JSON) para una ${blueprint.label} de "${bName}".

INDUSTRIA: ${industry || 'general'}
DESCRIPCIÓN: ${bDesc}
PALABRAS CLAVE SEO: ${Array.isArray(businessKeywords) ? businessKeywords.join(', ') : 'genera 8 relevantes'}

BLOQUES PERMITIDOS (usa SOLO estos, en este orden sugerido): ${blueprint.blocks.join(', ')}

Formato JSON EXACTO (no añadas texto fuera del JSON):
{
  "title": "${bName}",
  "blocks": [
    {
      "type": "hero",
      "settings": { "backgroundColor": "#...", "textColor": "#...", "accentColor": "#...", "paddingY": 96 },
      "content": { "badge": "...", "title": "...", "subtitle": "...", "buttonText": "...", "secondaryButtonText": "...", "heroImage": "https://..." }
    }
  ],
  "seo": {
    "metaTitle": "Título SEO (<=60 chars)",
    "metaDescription": "Descripción SEO persuasiva (<=160 chars)",
    "keywords": ["k1", "k2", "k3"]
  }
}

REGLAS DE DISEÑO (obligatorias):
- Colores coherentes con la industria y un color de acento llamativo para CTAs.
- Hero con propuesta de valor clara + 2 botones CTA.
- ${type === 'store' ? 'product-grid con categoryTabs (ventanas: Todos + 3 categorías) y products con name/price/originalPrice/discountBadge/imageUrl/sizes/description.' : ''}
- ${type === 'landing' ? 'pricing con 3 planes (Básico, Profesional, Premium) con precios y features, y CTA final potente.' : ''}
- ${type === 'corporate' ? 'features con iconName (SVG de lucide), about con misión/visión, team con integrantes, gallery con imágenes Unsplash.' : ''}
- Testimonios con text/name/role reales y creíbles.
- FAQ con 4 preguntas reales del rubro.
- footer con brandName y copyright.
- Nada de emojis en el contenido: usa iconName SVG (lucide) para iconos.`;

    const result = await callAI(systemPrompt, userPrompt, { json: true, temperature: 0.75, maxTokens: 8192 });

    let parsedBlocks: any[] = [];
    let parsedSeo: any = {};

    if (result?.content) {
      try {
        // Strip markdown fences if provider wrapped the JSON
        const cleaned = result.content.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
        const parsed = JSON.parse(cleaned);
        if (Array.isArray(parsed.blocks)) parsedBlocks = parsed.blocks;
        if (parsed.seo && typeof parsed.seo === 'object') parsedSeo = parsed.seo;
      } catch (e) {
        console.warn('[AI] JSON parse failed, using fallback blocks', (e as any)?.message?.slice(0, 80));
      }
    }

    // If AI provider returned blocks, assign ids, merge settings with defaults
    if (parsedBlocks.length > 0) {
      const formattedBlocks = parsedBlocks.map((b: any, idx: number) => ({
        id: `ai-block-${Date.now()}-${idx}`,
        type: b.type || 'hero',
        settings: {
          backgroundColor: b.settings?.backgroundColor || (b.type === 'hero' ? '#0f172a' : '#ffffff'),
          textColor: b.settings?.textColor || (b.type === 'hero' ? '#ffffff' : '#0f172a'),
          accentColor: b.settings?.accentColor || '#ec4899',
          paddingY: b.settings?.paddingY || 72,
          ...(b.type === 'navbar' ? { backgroundColor: '#ffffff', textColor: '#111827', accentColor: b.settings?.accentColor || '#ec4899' } : {}),
        },
        content: b.content || {},
      }));

      return apiSuccess({
        provider: result?.provider,
        model: result?.model,
        connected: result?.connected,
        usage: result?.usage,
        type,
        windowed: blueprint.windowed,
        blocks: formattedBlocks,
        seo: {
          title: parsedSeo.metaTitle || `${bName}`,
          description: parsedSeo.metaDescription || bDesc,
          keywords: parsedSeo.keywords || [],
          ...parsedSeo,
        },
      });
    }

    // Fallback: deterministic generator (no AI available)
    const fallbackBlocks = buildFallbackBlocks(bName, bDesc, type, industry);
    const usable = getUsableProviders();

    return apiSuccess({
      provider: result?.provider || (usable[0] || 'none'),
      model: result?.model || 'fallback',
      connected: false,
      reason: result ? 'parse-error' : 'no-provider-configured',
      type,
      windowed: blueprint.windowed,
      blocks: fallbackBlocks,
      seo: {
        title: `${bName} | ${bDesc.slice(0, 40)}`,
        description: bDesc.slice(0, 160),
        keywords: ['tienda virtual', 'comprar online', ...(industry ? [industry] : [])],
      },
    });
  } catch (error) {
    console.error('[AI generate-page] Error:', error);
    return apiError('Error al conectar con proveedor de IA', 500);
  }
}

function buildFallbackBlocks(bName: string, bDesc: string, type: string, industry?: string): any[] {
  const accent = type === 'landing' ? '#8b5cf6' : type === 'corporate' ? '#2563eb' : '#ec4899';
  const ts = Date.now();
  return [
    {
      id: `ai-hero-${ts}`,
      type: 'hero',
      settings: { backgroundColor: '#0f172a', textColor: '#ffffff', accentColor: accent, paddingY: 96 },
      content: {
        badge: type === 'landing' ? 'OFERTA LIMITADA' : type === 'corporate' ? 'EMPRESA CERTIFICADA' : 'NUEVA COLECCIÓN',
        title: type === 'landing' ? `Transforma tu ${industry || 'negocio'} Hoy` : `Bienvenido a ${bName}`,
        subtitle: bDesc,
        buttonText: type === 'store' ? 'Ver Catálogo' : type === 'landing' ? 'Empezar Ahora' : 'Conócenos',
        secondaryButtonText: type === 'landing' ? 'Ver Precios' : 'Contáctanos',
      },
    },
    ...(type === 'store'
      ? [{
          id: `ai-products-${ts}`,
          type: 'product-grid',
          settings: { backgroundColor: '#ffffff', textColor: '#0f172a', accentColor: accent, paddingY: 72 },
          content: {
            title: 'Catálogo de Productos',
            subtitle: 'Explora nuestras categorías exclusivas',
            categoryTabs: [
              { id: 'all', label: 'Todos los Productos' },
              { id: 'cat1', label: 'Categoría 1' },
              { id: 'cat2', label: 'Categoría 2' },
              { id: 'cat3', label: 'Categoría 3' },
            ],
            products: [
              { id: 'f1', category: 'cat1', name: `Producto Destacado ${bName}`, price: 'S/ 99.90', originalPrice: 'S/ 129.90', discountBadge: '-23%', imageUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&auto=format&fit=crop', sizes: ['M', 'L', 'XL'], description: 'Producto de alta calidad con garantía.' },
              { id: 'f2', category: 'cat2', name: 'Novedad de Temporada', price: 'S/ 149.90', imageUrl: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&auto=format&fit=crop', sizes: ['S', 'M', 'L'], description: 'Diseño exclusivo y durabilidad garantizada.' },
              { id: 'f3', category: 'cat3', name: 'Básico Imprescindible', price: 'S/ 79.90', originalPrice: 'S/ 99.90', discountBadge: '-20%', imageUrl: 'https://images.unsplash.com/photo-1585386959984-a4155224a1ad?w=600&auto=format&fit=crop', sizes: ['M', 'L'], description: 'Calidad premium al mejor precio.' },
            ],
          },
        }]
      : type === 'landing'
      ? [{
          id: `ai-pricing-${ts}`,
          type: 'pricing',
          settings: { backgroundColor: '#f8fafc', textColor: '#0f172a', accentColor: accent, paddingY: 72 },
          content: {
            title: 'Planes y Precios',
            subtitle: 'Elige el plan perfecto para ti',
            plans: [
              { name: 'Básico', price: 'S/ 49', features: ['Funcionalidad 1', 'Funcionalidad 2', 'Soporte email'] },
              { name: 'Profesional', price: 'S/ 99', features: ['Todo lo del Básico', 'Funcionalidad 3', 'Soporte prioritario'], highlight: true },
              { name: 'Premium', price: 'S/ 199', features: ['Todo lo del Profesional', 'Funcionalidad 4', 'Soporte 24/7'] },
            ],
          },
        }]
      : [{
          id: `ai-about-${ts}`,
          type: 'features',
          settings: { backgroundColor: '#ffffff', textColor: '#0f172a', accentColor: accent, paddingY: 64 },
          content: {
            title: '¿Quiénes Somos?',
            items: [
              { iconName: 'Target', title: 'Misión', description: bDesc },
              { iconName: 'Eye', title: 'Visión', description: 'Ser líderes en nuestro rubro con innovación constante.' },
              { iconName: 'Handshake', title: 'Valores', description: 'Integridad, calidad y compromiso con nuestros clientes.' },
            ],
          },
        }]),
    {
      id: `ai-features-${ts}`,
      type: 'features',
      settings: { backgroundColor: '#f8fafc', textColor: '#0f172a', accentColor: accent, paddingY: 64 },
      content: {
        title: 'Beneficios Exclusivos',
        items: [
          { iconName: 'ShieldCheck', title: 'Garantía Total', description: 'Calidad asegurada en cada compra.' },
          { iconName: 'Truck', title: 'Envío Rápido', description: 'Entregas puntuales a todo el país.' },
          { iconName: 'Headphones', title: 'Soporte 24/7', description: 'Atención personalizada por WhatsApp.' },
          { iconName: 'CreditCard', title: 'Pago Seguro', description: 'Múltiples medios de pago protegidos.' },
        ],
      },
    },
    {
      id: `ai-testimonials-${ts}`,
      type: 'testimonials',
      settings: { backgroundColor: '#ffffff', textColor: '#0f172a', paddingY: 64 },
      content: {
        title: 'Lo que dicen nuestros clientes',
        items: [
          { text: 'Excelente atención y productos de primera calidad. ¡Totalmente recomendado!', name: 'María G.', role: 'Cliente Verificada' },
          { text: 'El proceso de compra fue rapidísimo y el envío llegó antes de lo esperado.', name: 'Carlos R.', role: 'Cliente Verificado' },
          { text: 'Atención personalizada y resolución de dudas inmediata. Volveré a comprar.', name: 'Lucía P.', role: 'Cliente Verificada' },
        ],
      },
    },
    {
      id: `ai-faq-${ts}`,
      type: 'faq',
      settings: { backgroundColor: '#f8fafc', textColor: '#0f172a', accentColor: accent, paddingY: 64 },
      content: {
        title: 'Preguntas Frecuentes',
        items: [
          { question: '¿Cuánto tarda el envío?', answer: 'Entre 24 y 72 horas dependiendo de tu ubicación.' },
          { question: '¿Qué medios de pago aceptan?', answer: 'Yape, Plin, transferencia, tarjetas y contra entrega.' },
          { question: '¿Tienen garantía?', answer: 'Sí, todos nuestros productos incluyen garantía de satisfacción.' },
          { question: '¿Cómo contacto con soporte?', answer: 'Por WhatsApp o el formulario de contacto, respondemos en minutos.' },
        ],
      },
    },
    {
      id: `ai-cta-${ts}`,
      type: 'cta',
      settings: { accentColor: accent, paddingY: 80 },
      content: {
        title: type === 'landing' ? '¡Empieza Hoy con 15% OFF!' : '¡No te lo Pierdas!',
        description: 'Contáctanos ahora y recibe una oferta exclusiva de bienvenida.',
        buttonText: type === 'store' ? 'Pedir por WhatsApp' : 'Comenzar Ahora',
      },
    },
    {
      id: `ai-footer-${ts}`,
      type: 'footer',
      settings: { backgroundColor: '#0f172a', textColor: '#ffffff', paddingY: 48 },
      content: {
        brandName: bName.toUpperCase(),
        copyright: `© ${new Date().getFullYear()} ${bName}. Todos los derechos reservados.`,
      },
    },
  ];
}
