import { Logger } from '@nestjs/common';
import { ILlmProvider } from '../interfaces/llm-provider.interface';
import { ChatMessage, LlmOptions, LlmResponse } from '../interfaces/llm.types';

export class FallbackLlmProvider implements ILlmProvider {
  private readonly logger = new Logger(FallbackLlmProvider.name);

  constructor(private readonly providers: ILlmProvider[]) {}

  async chat(
    messages: ChatMessage[],
    options?: LlmOptions,
  ): Promise<LlmResponse> {
    if (!this.providers.length) {
      throw new Error('No LLM providers configured for fallback');
    }

    let lastError: any;
    for (const provider of this.providers) {
      try {
        return await provider.chat(messages, options);
      } catch (error: any) {
        this.logger.warn(
          `Provider ${provider.constructor.name} failed: ${error.message}. Trying next provider...`,
        );
        lastError = error;
      }
    }
    this.logger.error('All fallback providers failed.');
    throw lastError;
  }

  async generate(prompt: string, options?: LlmOptions): Promise<LlmResponse> {
    if (!this.providers.length) {
      throw new Error('No LLM providers configured for fallback');
    }

    let lastError: any;
    for (const provider of this.providers) {
      try {
        return await provider.generate(prompt, options);
      } catch (error: any) {
        this.logger.warn(
          `Provider ${provider.constructor.name} failed: ${error.message}. Trying next provider...`,
        );
        lastError = error;
      }
    }
    this.logger.error('All fallback providers failed.');
    throw lastError;
  }
}
