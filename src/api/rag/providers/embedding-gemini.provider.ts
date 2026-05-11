import { AllConfigType } from '@/config/config.type';
import { HttpService } from '@nestjs/axios';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { IEmbeddingProvider } from '../interfaces/embedding-provider.interface';

@Injectable()
export class GeminiEmbeddingProvider implements IEmbeddingProvider {
  private readonly logger = new Logger(GeminiEmbeddingProvider.name);
  private readonly apiKey: string | undefined;
  private readonly embedModel: string;
  private readonly timeout: number;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService<AllConfigType>,
  ) {
    this.apiKey = this.configService.get('llm.geminiApiKey', {
      infer: true,
    });
    this.embedModel = this.configService.get('llm.geminiEmbedModel', {
      infer: true,
    }) as string;
    this.timeout = this.configService.get('ollama.requestTimeout', {
      infer: true,
    }) as number;
  }

  async embedBatch(texts: string[]): Promise<number[][]> {
    if (!this.apiKey) {
      throw new Error('Gemini API Key is not configured for embeddings.');
    }

    const modelName = `models/${this.embedModel}`;
    const url = `https://generativelanguage.googleapis.com/v1beta/${modelName}:batchEmbedContents?key=${this.apiKey}`;

    this.logger.debug(
      `Gemini embed request: ${texts.length} texts, model=${this.embedModel}`,
    );

    try {
      const requests = texts.map((text) => ({
        model: modelName,
        content: {
          parts: [{ text }],
        },
      }));

      const { data } = await firstValueFrom(
        this.httpService.post<{ embeddings: { values: number[] }[] }>(
          url,
          { requests },
          { timeout: this.timeout },
        ),
      );

      this.logger.debug(
        `Gemini embed response: ${data.embeddings.length} embeddings, dim=${data.embeddings[0]?.values?.length}`,
      );

      return data.embeddings.map((e) => e.values);
    } catch (error: any) {
      this.logger.error(`Gemini embed failed: ${error.message}`);
      throw error;
    }
  }

  async isHealthy(): Promise<boolean> {
    return !!this.apiKey;
  }
}
