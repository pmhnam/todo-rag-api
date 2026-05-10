import { AllConfigType } from '@/config/config.type';
import { ConfigService } from '@nestjs/config';
import {
  ILlmProvider,
  LLM_PROVIDER,
} from '../interfaces/llm-provider.interface';
import { OllamaProvider } from './ollama.provider';

/**
 * Factory provider for LLM_PROVIDER injection token.
 * Reads LLM_PROVIDER env var to determine which provider to use.
 *
 * To add a new provider:
 * 1. Create a new class implementing ILlmProvider
 * 2. Add a case here
 * 3. Add config fields to llm.config.ts
 */
export const LlmProviderFactory = {
  provide: LLM_PROVIDER,
  useFactory: (
    configService: ConfigService<AllConfigType>,
    ollamaProvider: OllamaProvider,
    // Add new providers here as constructor params
  ): ILlmProvider => {
    const provider = configService.get('llm.provider', { infer: true });

    switch (provider) {
      case 'ollama':
        return ollamaProvider;
      // case 'openai':
      //   return openaiProvider;
      default:
        return ollamaProvider;
    }
  },
  inject: [
    ConfigService,
    OllamaProvider,
    // Add new providers here
  ],
};
