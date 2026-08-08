import { AIProvider, AIProviderConfig, AICompletionRequest, AICompletionResponse } from '../types'

/**
 * Generic provider for any OpenAI-compatible chat completions API
 * (OpenAI, Groq, DeepSeek, Together, OpenRouter, etc.)
 */
export class OpenAICompatibleProvider implements AIProvider {
  id: string
  name: string

  private config: AIProviderConfig

  constructor(id: string, name: string, config: AIProviderConfig) {
    this.id = id
    this.name = name
    this.config = {
      model: 'gpt-4o-mini',
      maxTokens: 4096,
      temperature: 0.7,
      baseUrl: 'https://api.openai.com/v1',
      ...config,
    }
  }

  async complete(request: AICompletionRequest): Promise<AICompletionResponse> {
    const body: any = {
      model: this.config.model,
      messages: request.messages,
      max_tokens: request.maxTokens || this.config.maxTokens,
      temperature: request.temperature ?? this.config.temperature,
    }

    if (request.json) {
      body.response_format = { type: 'json_object' }
    }

    const response = await fetch(`${this.config.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.config.apiKey}`,
      },
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`${this.name} API error: ${response.status} - ${error}`)
    }

    const data = await response.json()
    const choice = data.choices?.[0]

    return {
      content: choice?.message?.content || '',
      usage: data.usage ? {
        promptTokens: data.usage.prompt_tokens,
        completionTokens: data.usage.completion_tokens,
        totalTokens: data.usage.total_tokens,
      } : undefined,
    }
  }
}
