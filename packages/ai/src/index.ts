import { aiService } from './service'

// Re-export everything
export { aiService } from './service'
export type {
  AIProvider,
  AIProviderConfig,
  AIMessage,
  AICompletionRequest,
  AICompletionResponse,
  GenerateBlockContentRequest,
  GenerateBlockContentResponse,
  GeneratePageRequest,
  GeneratePageResponse,
  GenerateSEORequest,
  GenerateSEResponse,
  AIServiceConfig,
} from './types'

export { generateBlockContent, generateMultipleBlocks, blockTypeDescriptions } from './generators/block-content'
export { generatePage } from './generators/page'
export { generateSEO } from './generators/seo'

export { OpenAIProvider } from './providers/openai'
export { AnthropicProvider } from './providers/anthropic'
export { GeminiProvider } from './providers/gemini'
export { OpenAICompatibleProvider } from './providers/openai-compatible'
export { OllamaProvider } from './providers/ollama'

export { configureAIFromEnv, getUsableProviderIds } from './bootstrap'
