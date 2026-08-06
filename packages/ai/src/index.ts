import { aiService } from './service'
import { OpenAIProvider } from './providers/openai'
import { AnthropicProvider } from './providers/anthropic'

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

// Auto-register built-in providers
aiService.registerProvider(new OpenAIProvider({ apiKey: '' }))
aiService.registerProvider(new AnthropicProvider({ apiKey: '' }))
