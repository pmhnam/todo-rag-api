import { registerAs } from '@nestjs/config';
import { LlmConfig } from './llm-config.type';

export default registerAs<LlmConfig>('llm', () => ({
  provider: process.env.LLM_PROVIDER || 'ollama',
  // Ollama specific
  ollamaHost: process.env.OLLAMA_HOST || 'localhost',
  ollamaPort: process.env.OLLAMA_PORT
    ? parseInt(process.env.OLLAMA_PORT, 10)
    : 11434,
  ollamaModel: process.env.OLLAMA_MODEL || 'llama3',
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
