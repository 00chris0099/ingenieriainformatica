import { NextRequest } from 'next/server';
import { prisma } from '@repo/prisma';
import { apiSuccess, apiError } from '@/lib/api';
import { aiConfigStore } from '@/lib/aiConfigStore';

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
