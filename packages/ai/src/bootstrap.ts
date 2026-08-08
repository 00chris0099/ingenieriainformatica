import { aiService } from './service'
import { OpenAIProvider } from './providers/openai'
import { AnthropicProvider } from './providers/anthropic'
import { GeminiProvider } from './providers/gemini'
import { OpenAICompatibleProvider } from './providers/openai-compatible'
import { OllamaProvider } from './providers/ollama'
import { AIServiceConfig } from './types'

/**
 * Configures the AI service from environment variables.
 * Any provider without an API key is registered but marked unavailable;
 * the service falls back to providers that actually have keys.
 */
export function configureAIFromEnv(): void {
  const providers: AIServiceConfig['providers'] = {}
  const configured: string[] = []

  const add = (id: string, config: Record<string, string | number | undefined>, hasKey: boolean) => {
    providers[id] = {
      apiKey: (config.apiKey as string) || '',
      baseUrl: config.baseUrl as string | undefined,
      model: config.model as string | undefined,
      maxTokens: config.maxTokens as number | undefined,
      temperature: config.temperature as number | undefined,
    }
    if (hasKey) configured.push(id)
  }

  add('gemini', { apiKey: process.env.GEMINI_API_KEY, model: process.env.GEMINI_MODEL || 'gemini-1.5-flash' }, !!process.env.GEMINI_API_KEY)
  add('openai', { apiKey: process.env.OPENAI_API_KEY, model: process.env.OPENAI_MODEL || 'gpt-4o-mini' }, !!process.env.OPENAI_API_KEY)
  add('anthropic', { apiKey: process.env.ANTHROPIC_API_KEY, model: process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-20250514' }, !!process.env.ANTHROPIC_API_KEY)
  add('groq', { apiKey: process.env.GROQ_API_KEY, model: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile', baseUrl: 'https://api.groq.com/openai/v1' }, !!process.env.GROQ_API_KEY)
  add('deepseek', { apiKey: process.env.DEEPSEEK_API_KEY, model: process.env.DEEPSEEK_MODEL || 'deepseek-chat', baseUrl: 'https://api.deepseek.com/v1' }, !!process.env.DEEPSEEK_API_KEY)
  add('ollama', { apiKey: 'local', model: process.env.OLLAMA_MODEL || 'llama3', baseUrl: process.env.OLLAMA_URL || 'http://localhost:11434' }, true)

  // Re-register providers with real keys (registerProvider overwrites by id)
  aiService.registerProvider(new GeminiProvider(providers.gemini!))
  aiService.registerProvider(new OpenAIProvider(providers.openai!))
  aiService.registerProvider(new AnthropicProvider(providers.anthropic!))
  aiService.registerProvider(new OpenAICompatibleProvider('groq', 'Groq Cloud', providers.groq!))
  aiService.registerProvider(new OpenAICompatibleProvider('deepseek', 'DeepSeek AI', providers.deepseek!))
  aiService.registerProvider(new OllamaProvider(providers.ollama!))

  aiService.configure({
    defaultProvider: configured[0] || 'ollama',
    providers,
  })

  if (typeof console !== 'undefined') {
    console.log(`[AI BOOTSTRAP] Providers configured: ${configured.length ? configured.join(', ') : 'NONE (no API keys set — using Ollama local)'}`)
  }
}

/**
 * Returns the ordered list of usable provider ids (with keys configured).
 */
export function getUsableProviderIds(): string[] {
  const cfg = aiService.getAvailableProviders().map(p => p.id)
  const withKey = cfg.filter(id => {
    if (id === 'ollama') return true
    const key = process.env[`${id.toUpperCase()}_API_KEY`]
    return !!key && !key.startsWith('AIzaSy...')
  })
  return withKey.length ? withKey : ['ollama']
}
