import { AllConfigType } from '@/config/config.type';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  EMBEDDING_PROVIDER,
  IEmbeddingProvider,
} from '../interfaces/embedding-provider.interface';

@Injectable()
export class EmbeddingService {
  private readonly logger = new Logger(EmbeddingService.name);
  private readonly maxBatchSize: number;

  constructor(
    @Inject(EMBEDDING_PROVIDER)
    private readonly provider: IEmbeddingProvider,
    private readonly configService: ConfigService<AllConfigType>,
  ) {
    this.maxBatchSize = this.configService.get('ollama.maxBatchSize', {
      infer: true,
    }) as number;
  }

  /**
   * Generate embeddings for multiple texts.
   * Automatically batches if texts exceed maxBatchSize.
   */
  async embed(texts: string[]): Promise<number[][]> {
    if (texts.length === 0) return [];

    const allEmbeddings: number[][] = [];

    // Process in batches
    for (let i = 0; i < texts.length; i += this.maxBatchSize) {
      const batch = texts.slice(i, i + this.maxBatchSize);
      const batchEmbeddings = await this.provider.embedBatch(batch);
      allEmbeddings.push(...batchEmbeddings);
    }

    return allEmbeddings;
  }

  /**
   * Generate embedding for a single text.
   */
  async embedSingle(text: string): Promise<number[]> {
    const results = await this.provider.embedBatch([text]);
    return results[0];
  }

  /**
   * Check if embedding server is healthy.
   */
  async isHealthy(): Promise<boolean> {
    return this.provider.isHealthy();
  }
}
