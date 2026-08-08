import { AIProvider, AIProviderConfig, AICompletionRequest, AICompletionResponse } from '../types'

export class OllamaProvider implements AIProvider {
  id = 'ollama'
  name = 'Ollama (Local)'

  private config: AIProviderConfig

  constructor(config: AIProviderConfig) {
    this.config = {
      model: 'llama3',
      maxTokens: 4096,
      temperature: 0.7,
      baseUrl: 'http://localhost:11434',
      ...config,
    }
  }

  async complete(request: AICompletionRequest): Promise<AICompletionResponse> {
    const systemMsg = request.messages.find(m => m.role === 'system')
    const userContent = request.messages
      .filter(m => m.role !== 'system')
      .map(m => m.content)
      .join('\n\n')

    const fullPrompt = systemMsg ? `${systemMsg.content}\n\n${userContent}` : userContent

    const response = await fetch(`${this.config.baseUrl}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: this.config.model,
        prompt: fullPrompt,
        stream: false,
        options: {
          temperature: request.temperature ?? this.config.temperature,
          num_predict: request.maxTokens || this.config.maxTokens,
        },
        format: request.json ? 'json' : undefined,
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Ollama API error: ${response.status} - ${error}`)
    }

    const data = await response.json()

    return {
      content: data.response || '',
      usage: undefined,
    }
  }
}
