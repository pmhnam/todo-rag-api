/**
 * Chat message format — compatible with Ollama/OpenAI API.
 */
export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

/**
 * Options for LLM generation.
 */
export interface LlmOptions {
  model?: string;
  maxTokens?: number;
  temperature?: number;
  topP?: number;
  stop?: string[];
}

/**
 * Response from LLM provider.
 */
export interface LlmResponse {
  content: string;
  model: string;
  tokenUsage?: {
    promptTokens?: number;
    completionTokens?: number;
    totalTokens?: number;
  };
  finishReason?: string;
}
