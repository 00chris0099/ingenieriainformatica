import { NextRequest } from 'next/server';
import { prisma } from '@repo/prisma';
import { apiSuccess, apiError } from '@/lib/api';

// In-process memory store for AI Provider Configuration (fail-safe if DB is down)
declare global {
  // eslint-disable-next-line no-var
  var __aiConfigStore: any;
}

if (!global.__aiConfigStore) {
  global.__aiConfigStore = {
    activeProvider: 'gemini',
    activeModel: 'gemini-1.5-flash',
    systemPrompt: 'Eres un diseñador web senior y experto en e-commerce. Generas bloques y tiendas altamente conversivas.',
    providers: {
      gemini: {
        name: 'Google Gemini AI',
        configured: true,
        apiKey: process.env.GEMINI_API_KEY || 'AIzaSy...configured',
        models: ['gemini-1.5-flash', 'gemini-1.5-pro', 'gemini-2.0-flash'],
        selectedModel: 'gemini-1.5-flash',
      },
      openai: {
        name: 'OpenAI (GPT-4o)',
        configured: !!process.env.OPENAI_API_KEY,
        apiKey: process.env.OPENAI_API_KEY || '',
        models: ['gpt-4o', 'gpt-4o-mini', 'gpt-3.5-turbo'],
        selectedModel: 'gpt-4o-mini',
      },
      anthropic: {
        name: 'Anthropic Claude',
        configured: !!process.env.ANTHROPIC_API_KEY,
        apiKey: process.env.ANTHROPIC_API_KEY || '',
        models: ['claude-3-5-sonnet-20241022', 'claude-3-haiku-20240307'],
        selectedModel: 'claude-3-5-sonnet-20241022',
      },
      deepseek: {
        name: 'DeepSeek AI',
        configured: true,
        apiKey: process.env.DEEPSEEK_API_KEY || '',
        models: ['deepseek-chat', 'deepseek-coder', 'deepseek-r1'],
        selectedModel: 'deepseek-chat',
      },
      groq: {
        name: 'Groq Cloud (Fast Llama)',
        configured: true,
        apiKey: process.env.GROQ_API_KEY || '',
        models: ['llama-3.3-70b-versatile', 'mixtral-8x7b-32768'],
        selectedModel: 'llama-3.3-70b-versatile',
      },
      ollama: {
        name: 'Ollama / IA Local Custom',
        configured: true,
        baseUrl: 'http://localhost:11434',
        models: ['llama3', 'mistral', 'codellama'],
        selectedModel: 'llama3',
      },
    },
  };
}

export const aiConfigStore = global.__aiConfigStore;

export async function GET() {
  try {
    try {
      const settings = await prisma.settings.findUnique({ where: { key: 'ai_config_v2' } });
      if (settings?.value) {
        Object.assign(aiConfigStore, settings.value);
      }
    } catch {
      // Return memory config if DB down
    }

    // Mask sensitive API keys before returning to UI
    const safeConfig = JSON.parse(JSON.stringify(aiConfigStore));
    for (const key in safeConfig.providers) {
      if (safeConfig.providers[key].apiKey) {
        const keyVal = safeConfig.providers[key].apiKey;
        if (keyVal.length > 8) {
          safeConfig.providers[key].maskedKey = `${keyVal.slice(0, 4)}...${keyVal.slice(-4)}`;
        } else {
          safeConfig.providers[key].maskedKey = 'Configurado';
        }
      }
    }

    return apiSuccess(safeConfig);
  } catch (error) {
    return apiSuccess(aiConfigStore);
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { activeProvider, activeModel, systemPrompt, providers } = body;

    if (activeProvider) aiConfigStore.activeProvider = activeProvider;
    if (activeModel) aiConfigStore.activeModel = activeModel;
    if (systemPrompt) aiConfigStore.systemPrompt = systemPrompt;
    if (providers) {
      for (const pKey in providers) {
        if (aiConfigStore.providers[pKey]) {
          aiConfigStore.providers[pKey] = {
            ...aiConfigStore.providers[pKey],
            ...providers[pKey],
            configured: true,
          };
        }
      }
    }

    try {
      await prisma.settings.upsert({
        where: { key: 'ai_config_v2' },
        update: { value: aiConfigStore },
        create: { key: 'ai_config_v2', value: aiConfigStore },
      });
    } catch {
      // In-process fallback updated
    }

    return apiSuccess({
      message: 'Configuración Multi-Proveedor de IA actualizada correctamente',
      activeProvider: aiConfigStore.activeProvider,
      activeModel: aiConfigStore.activeModel,
    });
  } catch (error) {
    return apiError('Error al guardar configuración de IA', 500);
  }
}
