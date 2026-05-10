export type LlmConfig = {
  provider: string;
  // Ollama
  ollamaBaseUrl: string;
  ollamaModel: string;
  // OpenRouter
  openrouterBaseUrl: string;
  openrouterApiKey?: string;
  openrouterModel: string;
  // OpenAI (future)
  openaiApiKey?: string;
  openaiModel?: string;
  // Common
  maxTokens: number;
  temperature: number;
};
