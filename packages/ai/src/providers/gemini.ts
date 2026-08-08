import { AIProvider, AIProviderConfig, AICompletionRequest, AICompletionResponse } from '../types'

export class GeminiProvider implements AIProvider {
  id = 'gemini'
  name = 'Google Gemini'

  private config: AIProviderConfig

  constructor(config: AIProviderConfig) {
    this.config = {
      model: 'gemini-1.5-flash',
      maxTokens: 4096,
      temperature: 0.7,
      baseUrl: 'https://generativelanguage.googleapis.com/v1beta',
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

    const body: any = {
      contents: [{ parts: [{ text: fullPrompt }] }],
      generationConfig: {
        temperature: request.temperature ?? this.config.temperature,
        maxOutputTokens: request.maxTokens || this.config.maxTokens,
      },
    }

    // Gemini JSON mode: gemini-2.0+/1.5-pro support responseMimeType
    if (request.json) {
      body.generationConfig.responseMimeType = 'application/json'
    }

    const response = await fetch(
      `${this.config.baseUrl}/models/${this.config.model}:generateContent?key=${this.config.apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      }
    )

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Gemini API error: ${response.status} - ${error}`)
    }

    const data = await response.json()
    const text = data.candidates?.[0]?.content?.parts?.map((p: any) => p.text || '').join('') || ''
    const usage = data.usageMetadata

    return {
      content: text.trim(),
      usage: usage ? {
        promptTokens: usage.promptTokenCount ?? 0,
        completionTokens: usage.candidatesTokenCount ?? 0,
        totalTokens: usage.totalTokenCount ?? 0,
      } : undefined,
    }
  }
}
