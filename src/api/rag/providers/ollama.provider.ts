import { AllConfigType } from '@/config/config.type';
import { HttpService } from '@nestjs/axios';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { ILlmProvider } from '../interfaces/llm-provider.interface';
import { ChatMessage, LlmOptions, LlmResponse } from '../interfaces/llm.types';

@Injectable()
export class OllamaProvider implements ILlmProvider {
  private readonly logger = new Logger(OllamaProvider.name);
  private readonly baseUrl: string;
  private readonly defaultModel: string;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService<AllConfigType>,
  ) {
    const host = this.configService.get('llm.ollamaHost', { infer: true });
    const port = this.configService.get('llm.ollamaPort', { infer: true });
    this.baseUrl = `http://${host}:${port}`;
    this.defaultModel = this.configService.get('llm.ollamaModel', {
      infer: true,
    });
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
      const { data } = await firstValueFrom(
        this.httpService.post(url, {
          model,
          messages,
          stream: false,
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
        }),
      );

      return {
        content: data.message?.content || '',
        model: data.model || model,
        tokenUsage: {
          promptTokens: data.prompt_eval_count,
          completionTokens: data.eval_count,
          totalTokens: (data.prompt_eval_count || 0) + (data.eval_count || 0),
        },
        finishReason: data.done_reason || 'stop',
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
      const { data } = await firstValueFrom(
        this.httpService.post(url, {
          model,
          prompt,
          stream: false,
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
        }),
      );

      return {
        content: data.response || '',
        model: data.model || model,
        tokenUsage: {
          promptTokens: data.prompt_eval_count,
          completionTokens: data.eval_count,
          totalTokens: (data.prompt_eval_count || 0) + (data.eval_count || 0),
        },
        finishReason: data.done_reason || 'stop',
      };
    } catch (error) {
      this.logger.error(`Ollama generate failed: ${error.message}`);
      throw error;
    }
  }
}
