export type LlmConfig = {
  provider: string;
  // Ollama
  ollamaHost: string;
  ollamaPort: number;
  ollamaModel: string;
  // OpenAI (future)
  openaiApiKey?: string;
  openaiModel?: string;
  // Common
  maxTokens: number;
  temperature: number;
};
