import { describe, it, expect } from 'vitest'
import {
  isUsableKey,
  getEffectiveKey,
  providerConfigured,
  maskKey,
  createProviderInstance,
  listOllamaModels,
  pickOllamaModel,
  anthropicModelList,
  anthropicDefaultModel,
  PROVIDER_IDS,
} from '@/lib/ai-providers'

describe('AI provider status helpers', () => {
  describe('isUsableKey', () => {
    it('accepts real keys', () => {
      expect(isUsableKey('sk-proj-abc123')).toBe(true)
      expect(isUsableKey('AIzaSyRealKeyValue')).toBe(true)
      expect(isUsableKey('gsk_abc123')).toBe(true)
    })

    it('rejects empty and placeholder values', () => {
      expect(isUsableKey('')).toBe(false)
      expect(isUsableKey(undefined)).toBe(false)
      expect(isUsableKey('   ')).toBe(false)
      expect(isUsableKey('AIzaSy...')).toBe(false)
      expect(isUsableKey('AIzaSy...configured')).toBe(false)
      expect(isUsableKey('local')).toBe(false)
      expect(isUsableKey('configured')).toBe(false)
      expect(isUsableKey('••••')).toBe(false)
    })
  })

  describe('providerConfigured', () => {
    it('ollama only needs a base URL (falls back to the default localhost endpoint)', () => {
      expect(providerConfigured('ollama', { baseUrl: 'http://localhost:11434' })).toBe(true)
      expect(providerConfigured('ollama', { baseUrl: 'http://192.168.1.10:11434' })).toBe(true)
      // Empty baseUrl falls back to the default endpoint, so it stays "configured"
      // until the live connection test reveals whether it is reachable.
      expect(providerConfigured('ollama', { baseUrl: '' })).toBe(true)
    })

    it('cloud providers need a real key (stored wins over env)', () => {
      expect(providerConfigured('gemini', { apiKey: 'AIzaSyReal123' })).toBe(true)
      expect(providerConfigured('gemini', { apiKey: '' })).toBe(false)
      expect(providerConfigured('openai', { apiKey: 'AIzaSy...configured' })).toBe(false)
    })
  })

  describe('getEffectiveKey', () => {
    it('prefers a stored real key over env', () => {
      const previous = process.env.GEMINI_API_KEY
      process.env.GEMINI_API_KEY = 'env-key-123'
      try {
        expect(getEffectiveKey('gemini', { apiKey: 'stored-key-456' })).toBe('stored-key-456')
        expect(getEffectiveKey('gemini', { apiKey: '' })).toBe('env-key-123')
        expect(getEffectiveKey('gemini', { apiKey: 'AIzaSy...' })).toBe('env-key-123')
      } finally {
        if (previous === undefined) delete process.env.GEMINI_API_KEY
        else process.env.GEMINI_API_KEY = previous
      }
    })
  })

  describe('maskKey', () => {
    it('masks long keys and flags short ones', () => {
      expect(maskKey('sk-proj-abcdef123456')).toBe('sk-p...3456')
      expect(maskKey('abc')).toBe('Configurado')
      expect(maskKey('')).toBe('')
    })
  })

  describe('createProviderInstance', () => {
    it('builds every provider id with a model', () => {
      for (const id of PROVIDER_IDS) {
        const { provider, model } = createProviderInstance(id, {
          apiKey: 'test-key',
          model: 'test-model',
          baseUrl: 'http://localhost:11434',
        })
        expect(provider).toBeDefined()
        expect(typeof provider.complete).toBe('function')
        expect(model).toBe('test-model')
      }
    })

    it('throws for unknown provider ids', () => {
      expect(() => createProviderInstance('nope', { apiKey: 'k' })).toThrow()
    })

    it('resolves an OpenRouter-safe Anthropic model when the stored one is invalid', () => {
      const previous = process.env.ANTHROPIC_BASE_URL
      process.env.ANTHROPIC_BASE_URL = 'https://openrouter.ai/api/v1'
      try {
        const { model } = createProviderInstance('anthropic', {
          apiKey: 'sk-or-v1-test',
          model: 'claude-3-5-sonnet-20241022', // dated snapshot: not on OpenRouter
        })
        expect(model.startsWith('anthropic/')).toBe(true)
      } finally {
        if (previous === undefined) delete process.env.ANTHROPIC_BASE_URL
        else process.env.ANTHROPIC_BASE_URL = previous
      }
    })

    it('keeps a valid Anthropic model unchanged', () => {
      const previous = process.env.ANTHROPIC_BASE_URL
      process.env.ANTHROPIC_BASE_URL = 'https://openrouter.ai/api/v1'
      try {
        const { model } = createProviderInstance('anthropic', {
          apiKey: 'sk-or-v1-test',
          model: 'anthropic/claude-3-haiku',
        })
        expect(model).toBe('anthropic/claude-3-haiku')
      } finally {
        if (previous === undefined) delete process.env.ANTHROPIC_BASE_URL
        else process.env.ANTHROPIC_BASE_URL = previous
      }
    })
  })

  describe('anthropicModelList / anthropicDefaultModel', () => {
    it('returns prefixed vendor models for OpenRouter', () => {
      const previous = process.env.ANTHROPIC_BASE_URL
      process.env.ANTHROPIC_BASE_URL = 'https://openrouter.ai/api/v1'
      try {
        expect(anthropicModelList()[0]).toBe('anthropic/claude-3-haiku')
        expect(anthropicDefaultModel()).toBe('anthropic/claude-3-haiku')
      } finally {
        if (previous === undefined) delete process.env.ANTHROPIC_BASE_URL
        else process.env.ANTHROPIC_BASE_URL = previous
      }
    })

    it('uses plain model names against the native Anthropic API', () => {
      const previous = process.env.ANTHROPIC_BASE_URL
      delete process.env.ANTHROPIC_BASE_URL
      try {
        expect(anthropicModelList().some(m => !m.startsWith('anthropic/'))).toBe(true)
        expect(anthropicDefaultModel()).toBeTruthy()
      } finally {
        if (previous !== undefined) process.env.ANTHROPIC_BASE_URL = previous
      }
    })
  })

  describe('Ollama model discovery', () => {
    it('listOllamaModels returns [] for an unreachable server', async () => {
      const models = await listOllamaModels('http://127.0.0.1:1') // nothing listens there
      expect(Array.isArray(models)).toBe(true)
      expect(models.length).toBe(0)
    })

    it('pickOllamaModel falls back to the default when nothing is installed', async () => {
      const model = await pickOllamaModel('http://127.0.0.1:1', 'llama3')
      expect(model).toBe('llama3')
    })
  })
})
