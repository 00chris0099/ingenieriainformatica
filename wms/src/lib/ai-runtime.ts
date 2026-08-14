import { aiService } from '@repo/ai'
import { aiConfigStore } from '@/lib/aiConfigStore'
import {
  PROVIDER_IDS,
  createProviderInstance,
  getEffectiveKey,
  isUsableKey,
  listOllamaModels,
  pickOllamaModel,
} from '@/lib/ai-providers'

let prismaClient: any = null
let dbLoadAttempted = false

async function getPrisma() {
  if (!prismaClient) {
    const { prisma } = await import('@repo/prisma')
    prismaClient = prisma
  }
  return prismaClient
}

/**
 * Loads the persisted AI config (ai_config_v2) from the database into the
 * in-memory store once per process. This guarantees that keys and models saved
 * from the panel keep working in the AI runtime (generate-page, chat, tests)
 * even if no /api/v1/config/ai GET request happened first (e.g. after a cold
 * start of a serverless/container process).
 */
export async function ensureConfigLoaded(): Promise<void> {
  if (dbLoadAttempted) return
  dbLoadAttempted = true
  try {
    const prisma = await getPrisma()
    const settings = await prisma.settings.findUnique({ where: { key: 'ai_config_v2' } })
    if (settings?.value) {
      Object.assign(aiConfigStore, settings.value)
    }
  } catch (e) {
    console.warn('[AI] No se pudo cargar la config guardada desde la BD:', e)
  }
}

export interface AIRuntimeResult {
  provider: string
  model: string
  content: string
  connected: boolean
  usage?: { promptTokens: number; completionTokens: number; totalTokens: number }
}

export interface ProviderTestResult {
  ok: boolean
  provider: string
  model: string
  latencyMs?: number
  message: string
  error?: string
}

function cleanKey(key: string | undefined): string {
  return (key || '').trim()
}

/**
 * Re-syncs the aiService registry with the live configuration stored in aiConfigStore
 * (which the panel edits at runtime). Every call to the AI API goes through here,
 * so user changes to provider/keys/models take effect immediately.
 */
export async function syncProvidersFromStore(): Promise<void> {
  await ensureConfigLoaded()

  const providers = (aiConfigStore?.providers as Record<string, any>) || {}

  for (const id of PROVIDER_IDS) {
    const p = providers[id]
    if (!p) continue

    if (id === 'ollama') {
      // Ollama: use a model that is actually installed on the server. The static
      // default (llama3) usually does not exist locally, so we detect the real
      // one and remember it in the store for the panel and later calls.
      const realModel = await pickOllamaModel(p.baseUrl, p.selectedModel || p.models?.[0])
      if (p.selectedModel !== realModel) p.selectedModel = realModel
      if (!Array.isArray(p.models) || !p.models.includes(realModel)) {
        const installed = await listOllamaModels(p.baseUrl)
        if (installed.length > 0) p.models = installed
      }
      aiService.registerProvider(createProviderInstance(id, {
        apiKey: 'local',
        model: realModel,
        baseUrl: p.baseUrl,
      }).provider)
      continue
    }

    // El store guarda la key del panel, pero cuando no la tiene (p. ej. tras
    // borrarla de la BD o en un cold start), cae a la variable de entorno — igual
    // que hace getUsableProviders. Sin esto, un proveedor con key en el env queda
    // "usable" pero nunca registrado en el runtime.
    const key = getEffectiveKey(id, p)
    if (!isUsableKey(key)) continue

    aiService.registerProvider(createProviderInstance(id, {
      apiKey: key,
      model: p.selectedModel || p.models?.[0] || '',
      baseUrl: p.baseUrl,
    }).provider)
  }
}

/**
 * Returns the ordered list of provider ids that currently have usable credentials.
 * Ollama (local) is always usable as the final fallback.
 */
export async function getUsableProviders(): Promise<string[]> {
  await ensureConfigLoaded()
  const providers = (aiConfigStore?.providers as Record<string, any>) || {}
  const usable = PROVIDER_IDS.filter(id => {
    const p = providers[id]
    if (id === 'ollama') return true
    return isUsableKey(getEffectiveKey(id, p))
  })
  return usable.length ? usable : ['ollama']
}

/**
 * Calls the AI with the configured provider. Tries the active provider first,
 * then falls back to any other usable provider. Returns null if everything fails.
 */
export async function callAI(
  systemPrompt: string,
  userPrompt: string,
  opts?: { json?: boolean; temperature?: number; maxTokens?: number }
): Promise<AIRuntimeResult | null> {
  await syncProvidersFromStore()

  const active = aiConfigStore?.activeProvider || 'gemini'
  const providerOrder = [active, ...(await getUsableProviders()).filter(p => p !== active)]

  let lastError: string | null = null

  for (const providerId of providerOrder) {
    try {
      const response = await aiService.completeWithRetry(
        {
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
          json: opts?.json ?? true,
          temperature: opts?.temperature ?? 0.7,
          maxTokens: opts?.maxTokens ?? 4096,
        },
        providerId
      )

      const providers = (aiConfigStore?.providers as Record<string, any>) || {}
      const model = providers[providerId]?.selectedModel || providers[providerId]?.models?.[0] || 'default'

      return {
        provider: providerId,
        model,
        content: response.content,
        connected: true,
        usage: response.usage,
      }
    } catch (err: any) {
      lastError = err?.message || String(err)
      console.warn(`[AI] Provider "${providerId}" failed, trying next:`, lastError?.slice(0, 120))
    }
  }

  console.error('[AI] All providers failed:', lastError)
  return null
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`Timeout tras ${ms / 1000}s`)), ms)
    promise.then(
      v => { clearTimeout(timer); resolve(v) },
      e => { clearTimeout(timer); reject(e) }
    )
  })
}

/**
 * Makes a real, minimal completion call against one provider to verify the
 * configured key/base URL works. Used by the "Probar conexión" button in the panel.
 */
export async function testProviderConnection(
  providerId?: string,
  model?: string,
  baseUrl?: string,
  apiKeyOverride?: string
): Promise<ProviderTestResult> {
  await ensureConfigLoaded()

  const providers = (aiConfigStore?.providers as Record<string, any>) || {}
  const id = providerId || aiConfigStore?.activeProvider || 'gemini'
  const p = providers[id]

  if (!p) {
    return { ok: false, provider: id, model: model || '', message: `Proveedor "${id}" no existe` }
  }

  // Ollama: pick a model that is actually installed on the server (e.g. the
  // default "llama3" may not exist — use gemma2:2b or whatever /api/tags lists).
  let modelId = model || p.selectedModel || p.models?.[0] || ''
  if (id === 'ollama') {
    modelId = await pickOllamaModel(baseUrl || p.baseUrl, modelId || null)
  }

  // Prefer a key typed in the panel (not yet saved) over stored/env keys
  const key = isUsableKey(apiKeyOverride) ? cleanKey(apiKeyOverride) : getEffectiveKey(id, p)

  if (id !== 'ollama' && !isUsableKey(key)) {
    return {
      ok: false,
      provider: id,
      model: modelId,
      message: 'No hay API key configurada para este proveedor',
    }
  }

  const { provider, model: resolvedModel } = createProviderInstance(id, {
    apiKey: key,
    model: modelId,
    baseUrl: baseUrl || p.baseUrl,
  })
  const started = Date.now()

  try {
    const response = await withTimeout(
      provider.complete({
        messages: [{ role: 'user', content: 'Responde únicamente con la palabra: OK' }],
        json: false,
        temperature: 0,
        maxTokens: 10,
      }),
      20000
    )
    return {
      ok: true,
      provider: id,
      model: resolvedModel || modelId,
      latencyMs: Date.now() - started,
      message: response.content?.trim()?.slice(0, 80) || 'Conexión exitosa',
    }
  } catch (err: any) {
    const msg = err?.message || String(err)
    return {
      ok: false,
      provider: id,
      model: modelId,
      latencyMs: Date.now() - started,
      message: 'Fallo de conexión',
      error: msg.slice(0, 300),
    }
  }
}
