import { Block, SEOConfig, ThemeConfig } from '@repo/blocks'

// ============================================================================
// AI Provider Types
// ============================================================================

export interface AIProviderConfig {
  apiKey: string
  baseUrl?: string
  model?: string
  maxTokens?: number
  temperature?: number
}

export interface AIMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export interface AICompletionRequest {
  messages: AIMessage[]
  maxTokens?: number
  temperature?: number
  json?: boolean
}

export interface AICompletionResponse {
  content: string
  usage?: {
    promptTokens: number
    completionTokens: number
    totalTokens: number
  }
}

export interface AIProvider {
  id: string
  name: string
  complete(request: AICompletionRequest): Promise<AICompletionResponse>
}

// ============================================================================
// Content Generation Types
// ============================================================================

export interface GenerateBlockContentRequest {
  blockType: string
  industry?: string
  businessName?: string
  businessDescription?: string
  language?: string
  tone?: 'professional' | 'casual' | 'friendly' | 'luxury' | 'playful'
  additionalContext?: string
}

export interface GenerateBlockContentResponse {
  content: Record<string, any>
  suggestions?: string[]
}

// ============================================================================
// Page Generation Types
// ============================================================================

export interface GeneratePageRequest {
  businessName: string
  businessDescription: string
  industry: string
  pageType: 'landing' | 'page' | 'store'
  language?: string
  tone?: 'professional' | 'casual' | 'friendly' | 'luxury' | 'playful'
  templateId?: string
  specificBlocks?: string[]
}

export interface GeneratePageResponse {
  blocks: Block[]
  seo: Partial<SEOConfig>
  theme?: Partial<ThemeConfig>
}

// ============================================================================
// SEO Generation Types
// ============================================================================

export interface GenerateSEORequest {
  businessName: string
  businessDescription: string
  pageContent: string
  industry: string
  targetKeywords?: string[]
  language?: string
}

export interface GenerateSEResponse {
  metaTitle: string
  metaDescription: string
  keywords: string[]
  suggestions?: string[]
}

// ============================================================================
// AI Service Config
// ============================================================================

export interface AIServiceConfig {
  defaultProvider: string
  providers: Record<string, AIProviderConfig>
}
