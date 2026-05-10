import { AllConfigType } from '@/config/config.type';
import { HttpService } from '@nestjs/axios';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class EmbeddingService {
  private readonly logger = new Logger(EmbeddingService.name);
  private readonly baseUrl: string;
  private readonly embedModel: string;
  private readonly maxBatchSize: number;
  private readonly timeout: number;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService<AllConfigType>,
  ) {
    this.baseUrl = this.configService.get('ollama.baseUrl', {
      infer: true,
    }) as string;
    this.embedModel = this.configService.get('ollama.embedModel', {
      infer: true,
    }) as string;
    this.maxBatchSize = this.configService.get('ollama.maxBatchSize', {
      infer: true,
    }) as number;
    this.timeout = this.configService.get('ollama.requestTimeout', {
      infer: true,
    }) as number;
  }

  /**
   * Generate embeddings for multiple texts via Ollama /api/embed endpoint.
   * Automatically batches if texts exceed maxBatchSize.
   */
  async embed(texts: string[]): Promise<number[][]> {
    if (texts.length === 0) return [];

    const allEmbeddings: number[][] = [];

    // Process in batches
    for (let i = 0; i < texts.length; i += this.maxBatchSize) {
      const batch = texts.slice(i, i + this.maxBatchSize);
      const batchEmbeddings = await this.embedBatch(batch);
      allEmbeddings.push(...batchEmbeddings);
    }

    return allEmbeddings;
  }

  /**
   * Generate embedding for a single text.
   */
  async embedSingle(text: string): Promise<number[]> {
    const results = await this.embedBatch([text]);
    return results[0];
  }

  /**
   * Internal: send a single batch to Ollama.
   */
  private async embedBatch(texts: string[]): Promise<number[][]> {
    const url = `${this.baseUrl}/api/embed`;

    this.logger.debug(
      `Ollama embed request: ${texts.length} texts, url=${url}`,
    );

    try {
      const { data } = await firstValueFrom(
        this.httpService.post<{ model: string; embeddings: number[][] }>(
          url,
          { model: this.embedModel, input: texts },
          { timeout: this.timeout },
        ),
      );

      this.logger.debug(
        `Ollama embed response: ${data.embeddings.length} embeddings, dim=${data.embeddings[0]?.length}`,
      );

      return data.embeddings;
    } catch (error) {
      this.logger.error(`Ollama embed failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Check if Ollama server is healthy.
   */
  async isHealthy(): Promise<boolean> {
    try {
      await firstValueFrom(
        this.httpService.get(`${this.baseUrl}/`, { timeout: 5000 }),
      );
      return true;
    } catch {
      return false;
    }
  }
}
