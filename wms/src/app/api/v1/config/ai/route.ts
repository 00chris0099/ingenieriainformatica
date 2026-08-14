import { NextRequest } from 'next/server';
import { prisma } from '@repo/prisma';
import { apiSuccess, apiError } from '@/lib/api';
import { aiConfigStore } from '@/lib/aiConfigStore';
import {
  PROVIDER_IDS,
  getEffectiveKey,
  isUsableKey,
  listOllamaModels,
  maskKey,
  providerConfigured,
} from '@/lib/ai-providers';

/**
 * Applies truthful status (configured / maskedKey) to a provider snapshot.
 * Stored keys (from the panel) win; otherwise we fall back to the env var,
 * so the panel always reflects the real state of each provider.
 */
function applyRealStatus(snapshot: any): any {
  const providers = snapshot?.providers || {};
  for (const id of PROVIDER_IDS) {
    const p = providers[id];
    if (!p) continue;

    if (id === 'ollama') {
      p.configured = providerConfigured(id, p);
      p.baseUrl = p.baseUrl || process.env.OLLAMA_URL || 'http://localhost:11434';
      delete p.maskedKey;
      continue;
    }

    const effective = getEffectiveKey(id, p);
    p.configured = isUsableKey(effective);
    // Never leak the key to the client; the input stays empty unless the user
    // saved one from the panel (which is already masked server-side).
    p.apiKey = '';
    p.maskedKey = p.configured ? maskKey(effective) : '';
  }
  return snapshot;
}

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

    // Deep clone so we never mutate the live store while masking
    const safeConfig = JSON.parse(JSON.stringify(aiConfigStore));

    // Ollama: reflect the models actually installed on the server so the panel
    // offers a working model (the static default list may not exist locally).
    try {
      const ollama = safeConfig?.providers?.ollama;
      if (ollama) {
        const installed = await listOllamaModels(ollama.baseUrl);
        if (installed.length > 0) {
          ollama.models = installed;
          if (!installed.includes(ollama.selectedModel)) {
            ollama.selectedModel = installed[0];
          }
        }
      }
    } catch {
      // keep defaults when the server is unreachable
    }

    return apiSuccess(applyRealStatus(safeConfig));
  } catch (error) {
    return apiSuccess(applyRealStatus(JSON.parse(JSON.stringify(aiConfigStore))));
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
        if (!aiConfigStore.providers[pKey]) continue;
        const current = aiConfigStore.providers[pKey] || {};
        const incoming = providers[pKey] || {};
        const merged = { ...current, ...incoming };
        // `configured` is always derived from the real key/baseUrl, never trusted
        // from the client payload.
        merged.configured = providerConfigured(pKey, merged);
        if (pKey !== 'ollama') {
          if (incoming.apiKey === null) {
            // null = borrado explícito desde el panel (botón "Quitar clave")
            merged.apiKey = '';
            merged.configured = false;
          } else if (!isUsableKey(merged.apiKey)) {
            // El panel muestra el input vacío tras recargar (la key nunca se filtra al
            // cliente): conserva la key guardada actual antes de caer al entorno.
            merged.apiKey = isUsableKey(current.apiKey) ? current.apiKey : getEffectiveKey(pKey, merged);
            merged.configured = isUsableKey(merged.apiKey);
          }
        }
        aiConfigStore.providers[pKey] = merged;
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
      providers: Object.fromEntries(
        PROVIDER_IDS.map(id => [
          id,
          { configured: providerConfigured(id, aiConfigStore.providers[id]) },
        ])
      ),
    });
  } catch (error) {
    return apiError('Error al guardar configuración de IA', 500);
  }
}
