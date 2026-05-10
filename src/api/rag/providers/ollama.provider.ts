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
export class OllamaProvider implements ILlmProvider {
  private readonly logger = new Logger(OllamaProvider.name);
  private readonly baseUrl: string;
  private readonly defaultModel: string;
  private readonly httpAgent = new http.Agent({ keepAlive: true });
  private readonly httpsAgent = new https.Agent({ keepAlive: true });

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService<AllConfigType>,
  ) {
    this.baseUrl = this.configService.get('llm.ollamaBaseUrl', {
      infer: true,
    }) as string;
    this.defaultModel = this.configService.get('llm.ollamaModel', {
      infer: true,
    }) as string;
  }

  async chat(
    messages: ChatMessage[],
    options?: LlmOptions,
  ): Promise<LlmResponse> {
    const model = options?.model || this.defaultModel;
    const url = `${this.baseUrl}/api/chat`;

    this.logger.debug(
      `Ollama chat request: model=${model}, messages=${messages.length}`,
    );

    try {
      const { data: stream } = await firstValueFrom(
        this.httpService.post(
          url,
          {
            model,
            messages,
            stream: true,
            options: {
              num_predict:
                options?.maxTokens ||
                this.configService.get('llm.maxTokens', { infer: true }),
              temperature:
                options?.temperature ||
                this.configService.get('llm.temperature', { infer: true }),
              top_p: options?.topP,
              stop: options?.stop,
            },
          },
          {
            responseType: 'stream',
            timeout: 300000, // 5 minutes timeout
            httpAgent: this.httpAgent,
            httpsAgent: this.httpsAgent,
          },
        ),
      );

      let fullContent = '';
      let lastData: any = {};

      const rl = readline.createInterface({
        input: stream,
        crlfDelay: Infinity,
      });

      for await (const line of rl) {
        if (!line.trim()) continue;
        try {
          const parsed = JSON.parse(line);
          if (parsed.message?.content) {
            fullContent += parsed.message.content;
          }
          if (parsed.done) {
            lastData = parsed;
          }
        } catch (e) {
          this.logger.warn(`Failed to parse stream line: ${line}`);
        }
      }

      return {
        content: fullContent,
        model: lastData.model || model,
        tokenUsage: {
          promptTokens: lastData.prompt_eval_count || 0,
          completionTokens: lastData.eval_count || 0,
          totalTokens:
            (lastData.prompt_eval_count || 0) + (lastData.eval_count || 0),
        },
        finishReason: lastData.done_reason || 'stop',
      };
    } catch (error) {
      this.logger.error(`Ollama chat failed: ${error.message}`);
      throw error;
    }
  }

  async generate(prompt: string, options?: LlmOptions): Promise<LlmResponse> {
    const model = options?.model || this.defaultModel;
    const url = `${this.baseUrl}/api/generate`;

    this.logger.debug(
      `Ollama generate request: model=${model}, prompt length=${prompt.length}`,
    );

    try {
      const { data: stream } = await firstValueFrom(
        this.httpService.post(
          url,
          {
            model,
            prompt,
            stream: true,
            options: {
              num_predict:
                options?.maxTokens ||
                this.configService.get('llm.maxTokens', { infer: true }),
              temperature:
                options?.temperature ||
                this.configService.get('llm.temperature', { infer: true }),
              top_p: options?.topP,
              stop: options?.stop,
            },
          },
          {
            responseType: 'stream',
            timeout: 300000, // 5 minutes timeout
            httpAgent: this.httpAgent,
            httpsAgent: this.httpsAgent,
          },
        ),
      );

      let fullContent = '';
      let lastData: any = {};

      const rl = readline.createInterface({
        input: stream,
        crlfDelay: Infinity,
      });

      for await (const line of rl) {
        if (!line.trim()) continue;
        try {
          const parsed = JSON.parse(line);
          if (parsed.response) {
            fullContent += parsed.response;
          }
          if (parsed.done) {
            lastData = parsed;
          }
        } catch (e) {
          this.logger.warn(`Failed to parse stream line: ${line}`);
        }
      }

      return {
        content: fullContent,
        model: lastData.model || model,
        tokenUsage: {
          promptTokens: lastData.prompt_eval_count || 0,
          completionTokens: lastData.eval_count || 0,
          totalTokens:
            (lastData.prompt_eval_count || 0) + (lastData.eval_count || 0),
        },
        finishReason: lastData.done_reason || 'stop',
      };
    } catch (error) {
      this.logger.error(`Ollama generate failed: ${error.message}`);
      throw error;
    }
  }
}
