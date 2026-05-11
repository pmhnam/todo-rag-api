export type LlmConfig = {
  provider: string;
  embeddingProvider: string;
  // Ollama
  ollamaBaseUrl: string;
  ollamaModel: string;
  // OpenRouter
  openrouterBaseUrl: string;
  openrouterApiKey?: string;
  openrouterModel: string;
  // Gemini
  geminiApiKey?: string;
  geminiEmbedModel: string;
  // OpenAI (future)
  openaiApiKey?: string;
  openaiModel?: string;
  // Common
  maxTokens: number;
  temperature: number;
};
