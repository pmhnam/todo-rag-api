import { ChatMessage, LlmOptions, LlmResponse } from './llm.types';

/**
 * LLM Provider interface — Strategy Pattern.
 *
 * Implement this interface to add a new LLM provider (e.g., OpenAI, vLLM).
 * Register the implementation using the LLM_PROVIDER injection token.
 */
export interface ILlmProvider {
  /**
   * Multi-turn chat completion.
   */
  chat(messages: ChatMessage[], options?: LlmOptions): Promise<LlmResponse>;

  /**
   * Single-turn text generation.
   */
  generate(prompt: string, options?: LlmOptions): Promise<LlmResponse>;
}

/**
 * Injection token for LLM provider.
 * Used with @Inject(LLM_PROVIDER) to inject the active provider.
 */
export const LLM_PROVIDER = Symbol('LLM_PROVIDER');
