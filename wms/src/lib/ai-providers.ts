import {
  GeminiProvider,
  OpenAIProvider,
  AnthropicProvider,
  OpenAICompatibleProvider,
  OllamaProvider,
  type AIProvider,
} from '@repo/ai'

export const PROVIDER_IDS = ['gemini', 'openai', 'anthropic', 'groq', 'deepseek', 'ollama'] as const
export type ProviderId = (typeof PROVIDER_IDS)[number]

const ENV_MAP: Record<string, string> = {
  gemini: 'GEMINI_API_KEY',
  openai: 'OPENAI_API_KEY',
  anthropic: 'ANTHROPIC_API_KEY',
  groq: 'GROQ_API_KEY',
  deepseek: 'DEEPSEEK_API_KEY',
}

export const DEFAULT_MODELS: Record<string, string> = {
  gemini: 'gemini-1.5-flash',
  openai: 'gpt-4o-mini',
  anthropic: 'claude-sonnet-4-20250514',
  groq: 'llama-3.3-70b-versatile',
  deepseek: 'deepseek-chat',
  ollama: 'llama3',
}

/**
 * Models offered for Anthropic. When ANTHROPIC_BASE_URL points to an
 * OpenAI-compatible proxy (OpenRouter, Together, etc.), model names carry the
 * vendor prefix (anthropic/…) and dated snapshots usually do not exist.
 */
export function anthropicModelList(): string[] {
  const base = (process.env.ANTHROPIC_BASE_URL || '').toLowerCase()
  if (base.includes('openrouter')) {
    return ['anthropic/claude-3-haiku', 'anthropic/claude-3.5-sonnet', 'anthropic/claude-sonnet-4', 'openai/gpt-4o-mini']
  }
  return ['claude-sonnet-4-20250514', 'claude-3-5-sonnet-20241022', 'claude-3-haiku-20240307']
}

/** Default model for Anthropic, aware of the base URL (OpenRouter → prefixed). */
export function anthropicDefaultModel(): string {
  const list = anthropicModelList()
  return list[0] || DEFAULT_MODELS.anthropic || 'claude-3-haiku'
}

export const PROVIDER_BASE_URLS: Record<string, string> = {
  groq: 'https://api.groq.com/openai/v1',
  deepseek: 'https://api.deepseek.com/v1',
}

/** The env var that holds the API key for a cloud provider (empty for ollama). */
export function providerEnvVar(id: string): string {
  return process.env[ENV_MAP[id] || ''] || ''
}

export function cleanKey(key?: string): string {
  return (key || '').trim()
}

/**
 * A key is "real" if it is non-empty and not one of the placeholders the UI
 * or old code used to simulate a configured provider.
 */
export function isUsableKey(key?: string): boolean {
  const k = cleanKey(key)
  if (!k) return false
  if (k.startsWith('AIzaSy...')) return false
  if (k === 'local' || k === 'configured' || k === '••••') return false
  return true
}

/** Effective key: stored (panel) wins, otherwise fall back to the environment. */
export function getEffectiveKey(id: string, stored?: any): string {
  const storedKey = cleanKey(stored?.apiKey)
  if (isUsableKey(storedKey)) return storedKey
  return providerEnvVar(id)
}

/** True when the provider has real credentials (cloud) or a reachable-looking base URL (ollama). */
export function providerConfigured(id: string, stored?: any): boolean {
  if (id === 'ollama') {
    const url = cleanKey(stored?.baseUrl || process.env.OLLAMA_URL || 'http://localhost:11434')
    return !!url
  }
  return isUsableKey(getEffectiveKey(id, stored))
}

/**
 * Lists the models actually installed on an Ollama server (GET /api/tags).
 * Returns an empty array when the server is unreachable or misconfigured, so
 * callers can fall back to the DEFAULT_MODELS list.
 */
export async function listOllamaModels(baseUrl?: string): Promise<string[]> {
  const url = cleanKey(baseUrl || process.env.OLLAMA_URL || 'http://localhost:11434')
  try {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 4000)
    const res = await fetch(`${url.replace(/\/$/, '')}/api/tags`, {
      signal: controller.signal,
      headers: { 'Content-Type': 'application/json' },
    })
    clearTimeout(timer)
    if (!res.ok) return []
    const data = await res.json()
    const models = (data?.models || [])
      .map((m: any) => m?.name)
      .filter((n: any): n is string => typeof n === 'string' && n.length > 0)
    return models
  } catch {
    return []
  }
}

/**
 * Picks the best model for Ollama: the configured selection if it is actually
 * installed, otherwise the first installed model, otherwise the default list.
 */
export async function pickOllamaModel(
  baseUrl: string | undefined,
  preferred?: string | null
): Promise<string> {
  const installed = await listOllamaModels(baseUrl)
  if (preferred && installed.includes(preferred)) return preferred
  const first = installed[0]
  if (first) return first
  return DEFAULT_MODELS.ollama || 'llama3'
}

export function maskKey(key?: string): string {
  const k = cleanKey(key)
  if (!k) return ''
  if (k.length > 8) return `${k.slice(0, 4)}...${k.slice(-4)}`
  return 'Configurado'
}

/**
 * Builds a concrete provider instance for a provider id. Used both by the
 * runtime (aiService registry) and by the connection test endpoint.
 */
export function createProviderInstance(
  id: string,
  cfg: { apiKey: string; model?: string; baseUrl?: string }
): { provider: AIProvider; model: string } {
  const model = cfg.model || DEFAULT_MODELS[id] || ''
  switch (id) {
    case 'gemini':
      return { provider: new GeminiProvider({ apiKey: cfg.apiKey, model }), model }
    case 'openai':
      return { provider: new OpenAIProvider({ apiKey: cfg.apiKey, model }), model }
    case 'anthropic':
      // Respeta ANTHROPIC_BASE_URL (p. ej. OpenRouter: https://openrouter.ai/api/v1),
      // que es compatible con la API de Messages de Anthropic.
      {
        const base = cfg.baseUrl || process.env.ANTHROPIC_BASE_URL || 'https://api.anthropic.com/v1'
        const isOpenRouter = base.toLowerCase().includes('openrouter')
        // Con OpenRouter los nombres de modelo llevan prefijo vendor y las fechas
        // no existen: si el modelo guardado no es válido para la base, usar el
        // default correcto en vez de fallar con 404.
        const finalModel = (() => {
          const list = anthropicModelList()
          if (!model) return anthropicDefaultModel()
          if (isOpenRouter && !list.includes(model)) return anthropicDefaultModel()
          return model
        })()
        return {
          provider: new AnthropicProvider({ apiKey: cfg.apiKey, model: finalModel, baseUrl: base }),
          model: finalModel,
        }
      }
    case 'groq':
      return {
        provider: new OpenAICompatibleProvider('groq', 'Groq Cloud', {
          apiKey: cfg.apiKey,
          model,
          baseUrl: cfg.baseUrl || PROVIDER_BASE_URLS.groq,
        }),
        model,
      }
    case 'deepseek':
      return {
        provider: new OpenAICompatibleProvider('deepseek', 'DeepSeek AI', {
          apiKey: cfg.apiKey,
          model,
          baseUrl: cfg.baseUrl || PROVIDER_BASE_URLS.deepseek,
        }),
        model,
      }
    case 'ollama':
      return {
        provider: new OllamaProvider({
          apiKey: cfg.apiKey || 'local',
          model,
          baseUrl: cfg.baseUrl || process.env.OLLAMA_URL || 'http://localhost:11434',
        }),
        model,
      }
    default:
      throw new Error(`Proveedor IA desconocido: ${id}`)
  }
}
