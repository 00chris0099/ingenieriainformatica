import { aiService, GeminiProvider, OpenAIProvider, AnthropicProvider, OpenAICompatibleProvider, OllamaProvider } from '@repo/ai'
import { aiConfigStore } from '@/lib/aiConfigStore'

export interface AIRuntimeResult {
  provider: string
  model: string
  content: string
  connected: boolean
  usage?: { promptTokens: number; completionTokens: number; totalTokens: number }
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

  const gemini = providers.gemini
  if (gemini?.apiKey) {
    aiService.registerProvider(new GeminiProvider({
      apiKey: cleanKey(gemini.apiKey),
      model: gemini.selectedModel || gemini.models?.[0] || 'gemini-1.5-flash',
    }))
  }

  const openai = providers.openai
  if (openai?.apiKey) {
    aiService.registerProvider(new OpenAIProvider({
      apiKey: cleanKey(openai.apiKey),
      model: openai.selectedModel || openai.models?.[0] || 'gpt-4o-mini',
    }))
  }

  const anthropic = providers.anthropic
  if (anthropic?.apiKey) {
    aiService.registerProvider(new AnthropicProvider({
      apiKey: cleanKey(anthropic.apiKey),
      model: anthropic.selectedModel || anthropic.models?.[0] || 'claude-sonnet-4-20250514',
    }))
  }

  const groq = providers.groq
  if (groq?.apiKey) {
    aiService.registerProvider(new OpenAICompatibleProvider('groq', 'Groq Cloud', {
      apiKey: cleanKey(groq.apiKey),
      model: groq.selectedModel || groq.models?.[0] || 'llama-3.3-70b-versatile',
      baseUrl: 'https://api.groq.com/openai/v1',
    }))
  }

  const deepseek = providers.deepseek
  if (deepseek?.apiKey) {
    aiService.registerProvider(new OpenAICompatibleProvider('deepseek', 'DeepSeek AI', {
      apiKey: cleanKey(deepseek.apiKey),
      model: deepseek.selectedModel || deepseek.models?.[0] || 'deepseek-chat',
      baseUrl: 'https://api.deepseek.com/v1',
    }))
  }

  const ollama = providers.ollama
  aiService.registerProvider(new OllamaProvider({
    apiKey: 'local',
    model: ollama?.selectedModel || ollama?.models?.[0] || 'llama3',
    baseUrl: ollama?.baseUrl || 'http://localhost:11434',
  }))
}

/**
 * Returns the ordered list of provider ids that currently have usable credentials.
 * Ollama (local) is always usable as the final fallback.
 */
export function getUsableProviders(): string[] {
  const providers = (aiConfigStore?.providers as Record<string, any>) || {}
  const order = ['gemini', 'openai', 'anthropic', 'groq', 'deepseek', 'ollama']

  const usable = order.filter(id => {
    const p = providers[id]
    if (id === 'ollama') return true
    const key = cleanKey(p?.apiKey)
    return !!key && !key.startsWith('AIzaSy...')
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
