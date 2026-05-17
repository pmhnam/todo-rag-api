import { AllConfigType } from '@/config/config.type';
import { HttpService } from '@nestjs/axios';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as http from 'http';
import * as https from 'https';
import * as readline from 'readline';
import { firstValueFrom } from 'rxjs';
import { ILlmProvider } from '../interfaces/llm-provider.interface';
import { ChatMessage, LlmOptions, LlmResponse } from '../interfaces/llm.types';

@Injectable()
export class OpenRouterProvider implements ILlmProvider {
  private readonly logger = new Logger(OpenRouterProvider.name);
  private readonly baseUrl: string;
  private readonly defaultModel: string;
  private readonly apiKey: string | undefined;
  private readonly httpAgent = new http.Agent({ keepAlive: true });
  private readonly httpsAgent = new https.Agent({ keepAlive: true });

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService<AllConfigType>,
  ) {
    this.baseUrl = this.configService.get('llm.openrouterBaseUrl', {
      infer: true,
    }) as string;
    this.defaultModel = this.configService.get('llm.openrouterModel', {
      infer: true,
    }) as string;
    this.apiKey = this.configService.get('llm.openrouterApiKey', {
      infer: true,
    });
  }

  async chat(
    messages: ChatMessage[],
    options?: LlmOptions,
  ): Promise<LlmResponse> {
    const model = options?.model || this.defaultModel;
    const url = `${this.baseUrl}/chat/completions`;

    if (!this.apiKey) {
      throw new Error('OpenRouter API Key is not configured');
    }

    this.logger.debug(
      `OpenRouter chat request: model=${model}, messages=${messages.length}`,
    );

    try {
      const { data: stream } = await firstValueFrom(
        this.httpService.post(
          url,
          {
            model,
            messages,
            stream: true,
            max_tokens:
              options?.maxTokens ||
              this.configService.get('llm.maxTokens', { infer: true }),
            temperature:
              options?.temperature ||
              this.configService.get('llm.temperature', { infer: true }),
            top_p: options?.topP,
            stop: options?.stop,
          },
          {
            headers: {
              Authorization: `Bearer ${this.apiKey}`,
              'HTTP-Referer': 'https://nestjs-boilerplate.local', // OpenRouter specific
              'X-Title': 'NestJS RAG', // OpenRouter specific
            },
            responseType: 'stream',
            timeout: 300000, // 5 minutes timeout
            httpAgent: this.httpAgent,
            httpsAgent: this.httpsAgent,
          },
        ),
      );

      let fullContent = '';

      const rl = readline.createInterface({
        input: stream,
        crlfDelay: Infinity,
      });

      for await (const line of rl) {
        if (!line.trim()) continue;
        if (line.trim() === 'data: [DONE]') break;
        if (line.startsWith('data: ')) {
          try {
            const parsed = JSON.parse(line.substring(6));
            const contentChunk = parsed.choices?.[0]?.delta?.content;
            if (contentChunk) {
              fullContent += contentChunk;
            }
          } catch (_error) {
            this.logger.warn(`Failed to parse stream line: ${line}`);
          }
        }
      }

      return {
        content: fullContent,
        model: model,
        tokenUsage: {
          promptTokens: 0, // OpenRouter stream doesn't easily expose this by default without specific headers/chunks
          completionTokens: 0,
          totalTokens: 0,
        },
        finishReason: 'stop',
      };
    } catch (error: any) {
      this.logger.error(`OpenRouter chat failed: ${error.message}`);
      throw error;
    }
  }

  async generate(prompt: string, options?: LlmOptions): Promise<LlmResponse> {
    const messages: ChatMessage[] = [{ role: 'user', content: prompt }];
    return this.chat(messages, options);
  }
}
