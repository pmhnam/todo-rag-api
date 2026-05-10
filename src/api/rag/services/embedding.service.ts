import { AllConfigType } from '@/config/config.type';
import { HttpService } from '@nestjs/axios';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class EmbeddingService {
  private readonly logger = new Logger(EmbeddingService.name);
  private readonly baseUrl: string;
  private readonly maxBatchSize: number;
  private readonly timeout: number;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService<AllConfigType>,
  ) {
    const host = this.configService.get('tei.host', { infer: true });
    const port = this.configService.get('tei.port', { infer: true });
    this.baseUrl = `http://${host}:${port}`;
    this.maxBatchSize = this.configService.get('tei.maxBatchSize', {
      infer: true,
    });
    this.timeout = this.configService.get('tei.requestTimeout', {
      infer: true,
    });
  }

  /**
   * Generate embeddings for multiple texts via TEI /embed endpoint.
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
   * Internal: send a single batch to TEI.
   */
  private async embedBatch(texts: string[]): Promise<number[][]> {
    const url = `${this.baseUrl}/embed`;

    this.logger.debug(`TEI embed request: ${texts.length} texts, url=${url}`);

    try {
      const { data } = await firstValueFrom(
        this.httpService.post<number[][]>(
          url,
          { inputs: texts, truncate: true },
          { timeout: this.timeout },
        ),
      );

      this.logger.debug(
        `TEI embed response: ${data.length} embeddings, dim=${data[0]?.length}`,
      );

      return data;
    } catch (error) {
      this.logger.error(`TEI embed failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Check if TEI server is healthy.
   */
  async isHealthy(): Promise<boolean> {
    try {
      await firstValueFrom(
        this.httpService.get(`${this.baseUrl}/health`, { timeout: 5000 }),
      );
      return true;
    } catch {
      return false;
    }
  }
}
