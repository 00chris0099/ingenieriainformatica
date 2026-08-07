// In-process memory store for AI Provider Configuration
declare global {
  // eslint-disable-next-line no-var
  var __aiConfigStore: any;
}

if (!global.__aiConfigStore) {
  global.__aiConfigStore = {
    activeProvider: 'gemini',
    activeModel: 'gemini-1.5-flash',
    systemPrompt: 'Eres un diseñador web senior y experto en e-commerce. Generas bloques y tiendas altamente conversivas.',
    providers: {
      gemini: {
        name: 'Google Gemini AI',
        configured: true,
        apiKey: process.env.GEMINI_API_KEY || 'AIzaSy...configured',
        models: ['gemini-1.5-flash', 'gemini-1.5-pro', 'gemini-2.0-flash'],
        selectedModel: 'gemini-1.5-flash',
      },
      openai: {
        name: 'OpenAI (GPT-4o)',
        configured: !!process.env.OPENAI_API_KEY,
        apiKey: process.env.OPENAI_API_KEY || '',
        models: ['gpt-4o', 'gpt-4o-mini', 'gpt-3.5-turbo'],
        selectedModel: 'gpt-4o-mini',
      },
      anthropic: {
        name: 'Anthropic Claude',
        configured: !!process.env.ANTHROPIC_API_KEY,
        apiKey: process.env.ANTHROPIC_API_KEY || '',
        models: ['claude-3-5-sonnet-20241022', 'claude-3-haiku-20240307'],
        selectedModel: 'claude-3-5-sonnet-20241022',
      },
      deepseek: {
        name: 'DeepSeek AI',
        configured: true,
        apiKey: process.env.DEEPSEEK_API_KEY || '',
        models: ['deepseek-chat', 'deepseek-coder', 'deepseek-r1'],
        selectedModel: 'deepseek-chat',
      },
      groq: {
        name: 'Groq Cloud (Fast Llama)',
        configured: true,
        apiKey: process.env.GROQ_API_KEY || '',
        models: ['llama-3.3-70b-versatile', 'mixtral-8x7b-32768'],
        selectedModel: 'llama-3.3-70b-versatile',
      },
      ollama: {
        name: 'Ollama / IA Local Custom',
        configured: true,
        baseUrl: 'http://localhost:11434',
        models: ['llama3', 'mistral', 'codellama'],
        selectedModel: 'llama3',
      },
    },
  };
}

export const aiConfigStore = global.__aiConfigStore;
