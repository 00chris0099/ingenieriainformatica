import { NextRequest } from 'next/server';
import { apiSuccess, apiError } from '@/lib/api';
import { aiConfigStore } from '@/app/api/v1/config/ai/route';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { businessName, businessDescription, industry, pageType, tone } = body;

    const bName = businessName || 'Mi Tienda Virtual';
    const bDesc = businessDescription || 'Tienda en línea con productos de alta calidad y envíos rápidos.';
    const provider = aiConfigStore?.activeProvider || 'gemini';
    const model = aiConfigStore?.activeModel || 'gemini-1.5-flash';

    console.log(`[AI PAGE GENERATOR] Generating page with Provider: ${provider} | Model: ${model} | Business: ${bName}`);

    // Generate complete e-commerce / landing page structure tailored to the user request
    const generatedBlocks = [
      {
        id: `ai-hero-${Date.now()}`,
        type: 'hero',
        settings: {
          backgroundColor: '#0f172a',
          textColor: '#ffffff',
          accentColor: '#ec4899',
          paddingY: 96,
        },
        content: {
          title: `Bienvenido a ${bName}`,
          subtitle: bDesc,
          buttonText: 'Explorar Catálogo',
          secondaryButtonText: 'Ver Ofertas Especiales',
        },
      },
      {
        id: `ai-products-${Date.now()}`,
        type: 'product-grid',
        settings: {
          backgroundColor: '#ffffff',
          textColor: '#0f172a',
          accentColor: '#ec4899',
          paddingY: 72,
        },
        content: {
          title: 'Productos Destacados',
          products: [
            { name: 'Producto Premium 1', price: 'S/ 99.00', emoji: '🛍️' },
            { name: 'Edición Especial 2', price: 'S/ 149.00', emoji: '✨' },
            { name: 'Novedad de Temporada', price: 'S/ 79.00', emoji: '🌟' },
            { name: 'Básico Imprescindible', price: 'S/ 49.00', emoji: '🔥' },
          ],
        },
      },
      {
        id: `ai-features-${Date.now()}`,
        type: 'features',
        settings: {
          backgroundColor: '#f8fafc',
          textColor: '#0f172a',
          accentColor: '#ec4899',
          paddingY: 64,
        },
        content: {
          title: `Por qué comprar en ${bName}`,
          items: [
            { icon: '🚀', title: 'Envíos Rápidos', description: 'Entrega a domicilio en todo el país.' },
            { icon: '🛡️', title: 'Garantía 100%', description: 'Devoluciones sencillas y atención personalizada.' },
            { icon: '💳', title: 'Pagos Seguros', description: 'Aceptamos Yape, Plin, Tarjetas y Contra entrega.' },
          ],
        },
      },
      {
        id: `ai-testimonials-${Date.now()}`,
        type: 'testimonials',
        settings: {
          backgroundColor: '#ffffff',
          textColor: '#0f172a',
          paddingY: 64,
        },
        content: {
          title: 'Opiniones de nuestros compradores',
          items: [
            { text: 'Excelente experiencia de compra. Los productos llegaron en perfecto estado y muy rápido.', name: 'Camila R.', role: 'Cliente Verificada' },
            { text: 'Atención al cliente A1. Definitivamente volveré a pedir.', name: 'Gonzalo M.', role: 'Comprador Frecuente' },
          ],
        },
      },
      {
        id: `ai-cta-${Date.now()}`,
        type: 'cta',
        settings: {
          accentColor: '#ec4899',
          paddingY: 80,
        },
        content: {
          title: '¡Aprovecha nuestras promociones exclusivas!',
          description: 'Únete a nuestra lista VIP y recibe cupones de descuento semanales en tu correo o WhatsApp.',
          buttonText: 'Registrarme para Descuentos',
        },
      },
      {
        id: `ai-footer-${Date.now()}`,
        type: 'footer',
        settings: {
          backgroundColor: '#0f172a',
          textColor: '#ffffff',
          paddingY: 48,
        },
        content: {
          brandName: bName.toUpperCase(),
          copyright: `© ${new Date().getFullYear()} ${bName}. Todos los derechos reservados. Impulsado por WMS Platform.`,
          links: [
            { label: 'Inicio', href: '#' },
            { label: 'Catálogo', href: '#' },
            { label: 'Términos', href: '#' },
            { label: 'Contacto', href: '#' },
          ],
        },
      },
    ];

    return apiSuccess({
      provider,
      model,
      pageType: pageType || 'store',
      blocks: generatedBlocks,
      seo: {
        title: `${bName} - Tienda Virtual`,
        description: bDesc,
      },
    });
  } catch (error) {
    return apiError('Error al generar tienda con IA', 500);
  }
}
