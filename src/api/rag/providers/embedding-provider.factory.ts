import { AllConfigType } from '@/config/config.type';
import { ConfigService } from '@nestjs/config';
import {
  EMBEDDING_PROVIDER,
  IEmbeddingProvider,
} from '../interfaces/embedding-provider.interface';
import { GeminiEmbeddingProvider } from './embedding-gemini.provider';
import { OllamaEmbeddingProvider } from './embedding-ollama.provider';

export const EmbeddingProviderFactory = {
  provide: EMBEDDING_PROVIDER,
  useFactory: (
    configService: ConfigService<AllConfigType>,
    ollamaProvider: OllamaEmbeddingProvider,
    geminiProvider: GeminiEmbeddingProvider,
  ): IEmbeddingProvider => {
    const provider = configService.get('llm.embeddingProvider', {
      infer: true,
    });
    if (provider === 'gemini') {
      return geminiProvider;
    }
    return ollamaProvider;
  },
  inject: [ConfigService, OllamaEmbeddingProvider, GeminiEmbeddingProvider],
};
