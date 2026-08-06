import { AIProvider, AIProviderConfig, AICompletionRequest, AICompletionResponse } from '../types'

export class AnthropicProvider implements AIProvider {
  id = 'anthropic'
  name = 'Anthropic'

  private config: AIProviderConfig

  constructor(config: AIProviderConfig) {
    this.config = {
      model: 'claude-sonnet-4-20250514',
      maxTokens: 2000,
      temperature: 0.7,
      baseUrl: 'https://api.anthropic.com/v1',
      ...config,
    }
  }

  async complete(request: AICompletionRequest): Promise<AICompletionResponse> {
    const systemMsg = request.messages.find(m => m.role === 'system')
    const userMessages = request.messages.filter(m => m.role !== 'system')

    const body = {
      model: this.config.model,
      max_tokens: request.maxTokens || this.config.maxTokens,
      temperature: request.temperature ?? this.config.temperature,
      system: systemMsg?.content || '',
      messages: userMessages.map(m => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })),
    }

    const response = await fetch(`${this.config.baseUrl}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.config.apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Anthropic API error: ${response.status} - ${error}`)
    }

    const data = await response.json()
    const textBlock = data.content?.find((b: any) => b.type === 'text')

    return {
      content: textBlock?.text || '',
      usage: data.usage ? {
        promptTokens: data.usage.input_tokens,
        completionTokens: data.usage.output_tokens,
        totalTokens: data.usage.input_tokens + data.usage.output_tokens,
      } : undefined,
    }
  }
}
