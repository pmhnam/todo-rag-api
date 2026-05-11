import { registerAs } from '@nestjs/config';
import { LlmConfig } from './llm-config.type';

export default registerAs<LlmConfig>('llm', () => ({
  provider: process.env.LLM_PROVIDER || 'openrouter',
  embeddingProvider: process.env.EMBEDDING_PROVIDER || 'gemini',
  // Ollama specific
  ollamaBaseUrl: process.env.OLLAMA_BASE_URL || 'http://localhost:11434',
  ollamaModel: process.env.OLLAMA_MODEL || 'llama3',
  // OpenRouter specific
  openrouterBaseUrl:
    process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1',
  openrouterApiKey: process.env.OPENROUTER_API_KEY,
  openrouterModel: process.env.OPENROUTER_MODEL || 'google/gemma-2-9b-it:free',
  // Gemini specific
  geminiApiKey: process.env.GEMINI_API_KEY,
  geminiEmbedModel: process.env.GEMINI_EMBED_MODEL || 'text-embedding-004',
  // OpenAI specific (future)
  openaiApiKey: process.env.OPENAI_API_KEY,
  openaiModel: process.env.OPENAI_MODEL || 'gpt-4o-mini',
  // Common
  maxTokens: process.env.LLM_MAX_TOKENS
    ? parseInt(process.env.LLM_MAX_TOKENS, 10)
    : 2048,
  temperature: process.env.LLM_TEMPERATURE
    ? parseFloat(process.env.LLM_TEMPERATURE)
    : 0.7,
}));
