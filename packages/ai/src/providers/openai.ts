import { AIProvider, AIProviderConfig, AICompletionRequest, AICompletionResponse } from '../types'

export class OpenAIProvider implements AIProvider {
  id = 'openai'
  name = 'OpenAI'

  private config: AIProviderConfig

  constructor(config: AIProviderConfig) {
    this.config = {
      model: 'gpt-4o-mini',
      maxTokens: 2000,
      temperature: 0.7,
      baseUrl: 'https://api.openai.com/v1',
      ...config,
    }
  }

  async complete(request: AICompletionRequest): Promise<AICompletionResponse> {
    const body = {
      model: this.config.model,
      messages: request.messages,
      max_tokens: request.maxTokens || this.config.maxTokens,
      temperature: request.temperature ?? this.config.temperature,
      response_format: request.json ? { type: 'json_object' } : undefined,
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
      throw new Error(`OpenAI API error: ${response.status} - ${error}`)
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
