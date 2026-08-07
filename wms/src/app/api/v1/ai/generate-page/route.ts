import { NextRequest } from 'next/server';
import { apiSuccess, apiError } from '@/lib/api';
import { aiConfigStore } from '@/lib/aiConfigStore';

// Real Multi-Provider AI Caller (Gemini, OpenAI, Groq, DeepSeek, Ollama)
async function callAIProvider(prompt: string): Promise<string | null> {
  const activeProvider = aiConfigStore?.activeProvider || 'gemini';
  const providerConfig = aiConfigStore?.providers?.[activeProvider];

  const apiKey = providerConfig?.apiKey || process.env[`${activeProvider.toUpperCase()}_API_KEY` || ''] || process.env.GEMINI_API_KEY;

  console.log(`[AI ENGINE CALL] Active Provider: ${activeProvider} | Key Present: ${!!apiKey}`);

  try {
    // 1. Google Gemini
    if (activeProvider === 'gemini' && apiKey && !apiKey.startsWith('AIzaSy...')) {
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { responseMimeType: 'application/json' },
        }),
      });
      if (res.ok) {
        const data = await res.json();
        return data.candidates?.[0]?.content?.parts?.[0]?.text || null;
      }
    }

    // 2. OpenAI / Groq / DeepSeek (OpenAI Compatible Format)
    if (['openai', 'groq', 'deepseek'].includes(activeProvider) && apiKey) {
      let endpoint = 'https://api.openai.com/v1/chat/completions';
      let model = 'gpt-4o-mini';

      if (activeProvider === 'groq') {
        endpoint = 'https://api.groq.com/openai/v1/chat/completions';
        model = 'llama-3.3-70b-versatile';
      } else if (activeProvider === 'deepseek') {
        endpoint = 'https://api.deepseek.com/v1/chat/completions';
        model = 'deepseek-chat';
      }

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: 'system', content: 'Eres un diseñador web experto que responde exclusivamente en JSON.' },
            { role: 'user', content: prompt }
          ],
          response_format: { type: 'json_object' },
        }),
      });

      if (res.ok) {
        const data = await res.json();
        return data.choices?.[0]?.message?.content || null;
      }
    }

    // 3. Ollama (Local AI)
    if (activeProvider === 'ollama') {
      const baseUrl = providerConfig?.baseUrl || 'http://localhost:11434';
      const res = await fetch(`${baseUrl}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: providerConfig?.selectedModel || 'llama3',
          prompt: `${prompt}\nResponde solo en formato JSON.`,
          stream: false,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        return data.response || null;
      }
    }
  } catch (err) {
    console.warn(`[AI PROVIDER CALL ERROR] Provider ${activeProvider} failed:`, (err as any)?.message);
  }

  return null;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { businessName, businessDescription, industry } = body;

    const bName = businessName || 'Mi Tienda Virtual';
    const bDesc = businessDescription || 'Tienda en línea con productos de alta calidad y envíos rápidos.';
    const provider = aiConfigStore?.activeProvider || 'gemini';

    const aiPrompt = `Genera la estructura de bloques para una tienda virtual de "${bName}". Descripción: "${bDesc}".
Formato JSON requerido:
{
  "title": "${bName}",
  "blocks": [
    { "type": "hero", "content": { "title": "...", "subtitle": "...", "buttonText": "..." } },
    { "type": "product-grid", "content": { "title": "Catálogo", "products": [{ "name": "...", "price": "S/ 89.00", "emoji": "🛍️" }] } },
    { "type": "features", "content": { "title": "Beneficios", "items": [{ "icon": "🚀", "title": "...", "description": "..." }] } }
  ]
}`;

    const rawResponse = await callAIProvider(aiPrompt);
    let parsedBlocks: any[] = [];

    if (rawResponse) {
      try {
        const parsed = JSON.parse(rawResponse);
        if (Array.isArray(parsed.blocks)) parsedBlocks = parsed.blocks;
      } catch {}
    }

    // If AI provider call returned blocks, assign ids and settings
    if (parsedBlocks.length > 0) {
      const formattedBlocks = parsedBlocks.map((b: any, idx: number) => ({
        id: `ai-block-${Date.now()}-${idx}`,
        type: b.type || 'hero',
        settings: {
          backgroundColor: b.type === 'hero' ? '#0f172a' : (b.type === 'features' ? '#f8fafc' : '#ffffff'),
          textColor: b.type === 'hero' ? '#ffffff' : '#0f172a',
          accentColor: '#ec4899',
          paddingY: 72,
        },
        content: b.content || {},
      }));

      return apiSuccess({
        provider,
        connected: true,
        blocks: formattedBlocks,
        seo: { title: `${bName} - Tienda Virtual`, description: bDesc },
      });
    }

    // Default Fallback Generator if provider API key is not entered yet
    const defaultBlocks = [
      {
        id: `ai-hero-${Date.now()}`,
        type: 'hero',
        settings: { backgroundColor: '#0f172a', textColor: '#ffffff', accentColor: '#ec4899', paddingY: 96 },
        content: {
          title: `Bienvenido a ${bName}`,
          subtitle: bDesc,
          buttonText: 'Explorar Catálogo',
          secondaryButtonText: 'Ver Ofertas Exclusivas',
        },
      },
      {
        id: `ai-products-${Date.now()}`,
        type: 'product-grid',
        settings: { backgroundColor: '#ffffff', textColor: '#0f172a', accentColor: '#ec4899', paddingY: 72 },
        content: {
          title: 'Colección de Productos Destacados',
          products: [
            { name: `Edición Especial ${bName}`, price: 'S/ 99.00', emoji: '🛍️' },
            { name: 'Novedad de Temporada', price: 'S/ 149.00', emoji: '✨' },
            { name: 'Básico Imprescindible', price: 'S/ 79.00', emoji: '🔥' },
          ],
        },
      },
      {
        id: `ai-features-${Date.now()}`,
        type: 'features',
        settings: { backgroundColor: '#f8fafc', textColor: '#0f172a', accentColor: '#ec4899', paddingY: 64 },
        content: {
          title: `Beneficios Exclusivos de ${bName}`,
          items: [
            { icon: '🚀', title: 'Envío Gratis', description: 'Envíos el mismo día a todo el país.' },
            { icon: '🛡️', title: 'Garantía Total', description: 'Cambios sencillos sin costo adicional.' },
            { icon: '💬', title: 'Atención 24/7', description: 'Asesoría personal vía WhatsApp.' },
          ],
        },
      },
      {
        id: `ai-cta-${Date.now()}`,
        type: 'cta',
        settings: { accentColor: '#ec4899', paddingY: 80 },
        content: {
          title: '¡15% DE DESCUENTO EN TU PRIMERA COMPRA!',
          description: 'Escríbenos directamente por WhatsApp para activar tu cupón de bienvenida.',
          buttonText: 'Pedir por WhatsApp',
        },
      },
      {
        id: `ai-footer-${Date.now()}`,
        type: 'footer',
        settings: { backgroundColor: '#0f172a', textColor: '#ffffff', paddingY: 48 },
        content: {
          brandName: bName.toUpperCase(),
          copyright: `© ${new Date().getFullYear()} ${bName}. Todos los derechos reservados.`,
        },
      },
    ];

    return apiSuccess({
      provider,
      connected: false,
      blocks: defaultBlocks,
      seo: { title: `${bName} - Tienda Virtual`, description: bDesc },
    });
  } catch (error) {
    return apiError('Error al conectar con proveedor de IA', 500);
  }
}
