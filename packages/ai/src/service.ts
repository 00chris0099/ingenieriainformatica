import { AIProvider, AIServiceConfig, AICompletionRequest, AICompletionResponse } from './types'

class RateLimiter {
  private requests: number[] = []
  private maxRequests: number
  private windowMs: number

  constructor(maxRequests: number, windowMs: number) {
    this.maxRequests = maxRequests
    this.windowMs = windowMs
  }

  async acquire(): Promise<void> {
    const now = Date.now()
    this.requests = this.requests.filter(t => now - t < this.windowMs)
    if (this.requests.length >= this.maxRequests) {
      const oldest = this.requests[0]!
      const waitMs = this.windowMs - (now - oldest) + 100
      await new Promise(r => setTimeout(r, waitMs))
    }
    this.requests.push(Date.now())
  }
}

class AIService {
  private providers = new Map<string, AIProvider>()
  private config: AIServiceConfig
  private rateLimiter: RateLimiter
  private maxRetries = 3
  private retryDelayMs = 1000

  constructor() {
    this.config = {
      defaultProvider: 'openai',
      providers: {},
    }
    this.rateLimiter = new RateLimiter(20, 60000)
  }

  configure(config: AIServiceConfig) {
    this.config = config
  }

  registerProvider(provider: AIProvider) {
    this.providers.set(provider.id, provider)
  }

  getProvider(id?: string): AIProvider {
    const providerId = id || this.config.defaultProvider
    const provider = this.providers.get(providerId)
    if (!provider) {
      throw new Error(`AI provider "${providerId}" not registered. Available: ${Array.from(this.providers.keys()).join(', ')}`)
    }
    return provider
  }

  getAvailableProviders(): Array<{ id: string; name: string }> {
    return Array.from(this.providers.values()).map(p => ({ id: p.id, name: p.name }))
  }

  getDefaultProvider(): AIProvider {
    return this.getProvider()
  }

  async completeWithRetry(
    request: AICompletionRequest,
    providerId?: string
  ): Promise<AICompletionResponse> {
    const provider = this.getProvider(providerId)
    let lastError: Error | null = null

    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        await this.rateLimiter.acquire()
        return await provider.complete(request)
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error))
        if (attempt < this.maxRetries) {
          const delay = this.retryDelayMs * Math.pow(2, attempt - 1)
          await new Promise(r => setTimeout(r, delay))
        }
      }
    }

    throw lastError || new Error('AI request failed after retries')
  }

  async completeBatch(
    requests: Array<{ request: AICompletionRequest; providerId?: string }>,
    concurrency = 3
  ): Promise<Array<{ success: boolean; result?: AICompletionResponse; error?: string }>> {
    const results: Array<{ success: boolean; result?: AICompletionResponse; error?: string }> = []

    for (let i = 0; i < requests.length; i += concurrency) {
      const batch = requests.slice(i, i + concurrency)
      const batchResults = await Promise.allSettled(
        batch.map(({ request, providerId }) =>
          this.completeWithRetry(request, providerId)
        )
      )

      for (const result of batchResults) {
        if (result.status === 'fulfilled') {
          results.push({ success: true, result: result.value })
        } else {
          results.push({ success: false, error: result.reason?.message || 'Unknown error' })
        }
      }
    }

    return results
  }
}

export const aiService = new AIService()
