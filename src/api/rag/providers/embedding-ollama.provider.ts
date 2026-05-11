import { AllConfigType } from '@/config/config.type';
import { HttpService } from '@nestjs/axios';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { IEmbeddingProvider } from '../interfaces/embedding-provider.interface';

@Injectable()
export class OllamaEmbeddingProvider implements IEmbeddingProvider {
  private readonly logger = new Logger(OllamaEmbeddingProvider.name);
  private readonly baseUrl: string;
  private readonly embedModel: string;
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
    this.timeout = this.configService.get('ollama.requestTimeout', {
      infer: true,
    }) as number;
  }

  async embedBatch(texts: string[]): Promise<number[][]> {
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
    } catch (error: any) {
      this.logger.error(`Ollama embed failed: ${error.message}`);
      throw error;
    }
  }

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
