import { aiService } from '@repo/ai'
import { aiConfigStore } from '@/lib/aiConfigStore'
import {
  PROVIDER_IDS,
  createProviderInstance,
  getEffectiveKey,
  isUsableKey,
} from '@/lib/ai-providers'

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
export function syncProvidersFromStore(): void {
  const providers = (aiConfigStore?.providers as Record<string, any>) || {}

  for (const id of PROVIDER_IDS) {
    const p = providers[id]
    if (!p) continue

    if (id === 'ollama') {
      aiService.registerProvider(createProviderInstance(id, {
        apiKey: 'local',
        model: p.selectedModel || p.models?.[0],
        baseUrl: p.baseUrl,
      }).provider)
      continue
    }

    const key = cleanKey(p.apiKey)
    if (!isUsableKey(key)) continue

    aiService.registerProvider(createProviderInstance(id, {
      apiKey: key,
      model: p.selectedModel || p.models?.[0],
      baseUrl: p.baseUrl,
    }).provider)
  }
}

/**
 * Returns the ordered list of provider ids that currently have usable credentials.
 * Ollama (local) is always usable as the final fallback.
 */
export function getUsableProviders(): string[] {
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
  syncProvidersFromStore()

  const active = aiConfigStore?.activeProvider || 'gemini'
  const providerOrder = [active, ...getUsableProviders().filter(p => p !== active)]

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
  const providers = (aiConfigStore?.providers as Record<string, any>) || {}
  const id = providerId || aiConfigStore?.activeProvider || 'gemini'
  const p = providers[id]

  if (!p) {
    return { ok: false, provider: id, model: model || '', message: `Proveedor "${id}" no existe` }
  }

  const modelId = model || p.selectedModel || p.models?.[0] || ''
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

  const { provider } = createProviderInstance(id, {
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
      model: modelId,
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
