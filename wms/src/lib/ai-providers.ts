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
      return { provider: new AnthropicProvider({ apiKey: cfg.apiKey, model }), model }
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
