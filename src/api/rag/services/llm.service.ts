import { Inject, Injectable, Logger } from '@nestjs/common';
import {
  ILlmProvider,
  LLM_PROVIDER,
} from '../interfaces/llm-provider.interface';
import { ChatMessage, LlmOptions, LlmResponse } from '../interfaces/llm.types';

/**
 * LLM Service — thin wrapper around the active LLM provider.
 * Uses the injected ILlmProvider (determined by LLM_PROVIDER config).
 */
@Injectable()
export class LlmService {
  private readonly logger = new Logger(LlmService.name);

  constructor(@Inject(LLM_PROVIDER) private readonly provider: ILlmProvider) {}

  /**
   * Multi-turn chat completion.
   */
  async chat(
    messages: ChatMessage[],
    options?: LlmOptions,
  ): Promise<LlmResponse> {
    this.logger.debug(`LLM chat: ${messages.length} messages`);
    return this.provider.chat(messages, options);
  }

  /**
   * Single-turn text generation.
   */
  async generate(prompt: string, options?: LlmOptions): Promise<LlmResponse> {
    this.logger.debug(`LLM generate: prompt length=${prompt.length}`);
    return this.provider.generate(prompt, options);
  }
}
