import { AllConfigType } from '@/config/config.type';
import { ConfigService } from '@nestjs/config';
import {
  ILlmProvider,
  LLM_PROVIDER,
} from '../interfaces/llm-provider.interface';
import { FallbackLlmProvider } from './fallback-llm.provider';
import { OllamaProvider } from './ollama.provider';
import { OpenRouterProvider } from './openrouter.provider';

/**
 * Factory provider for LLM_PROVIDER injection token.
 * Reads LLM_PROVIDER env var to determine which provider to use.
 */
export const LlmProviderFactory = {
  provide: LLM_PROVIDER,
  useFactory: (
    configService: ConfigService<AllConfigType>,
    ollamaProvider: OllamaProvider,
    openrouterProvider: OpenRouterProvider,
  ): ILlmProvider => {
    const provider = configService.get('llm.provider', { infer: true });

    switch (provider) {
      case 'openrouter':
        // Primary: OpenRouter. Fallback: Ollama
        return new FallbackLlmProvider([openrouterProvider, ollamaProvider]);
      case 'ollama':
        return ollamaProvider;
      default:
        return ollamaProvider;
    }
  },
  inject: [ConfigService, OllamaProvider, OpenRouterProvider],
};
