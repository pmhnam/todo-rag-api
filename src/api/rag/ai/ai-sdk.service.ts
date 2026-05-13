import { AllConfigType } from '@/config/config.type';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { ModelMessage } from 'ai';
import type { TaskAgentToolCall } from '../services/task-agent.service';

type AiModule = typeof import('ai');
type OpenRouterModule = typeof import('@openrouter/ai-sdk-provider');

@Injectable()
export class AiSdkService {
  constructor(private readonly configService: ConfigService<AllConfigType>) {}

  async getToolFactory(): Promise<AiModule['tool']> {
    const { tool } = await this.loadAiSdk();
    return tool;
  }

  async generateWithTools(params: {
    system: string;
    messages: ModelMessage[];
    tools: Record<string, unknown>;
  }): Promise<{ text: string; toolCalls: TaskAgentToolCall[] }> {
    const { generateText, stepCountIs } = await this.loadAiSdk();
    const model = await this.createModel();

    const result = await generateText({
      model,
      system: params.system,
      messages: params.messages,
      tools: params.tools,
      stopWhen: stepCountIs(5),
      maxOutputTokens: this.configService.get('llm.maxTokens', { infer: true }),
      temperature: this.configService.get('llm.temperature', { infer: true }),
    } as any);

    return {
      text: result.text,
      toolCalls: this.extractToolCalls(result.steps),
    };
  }

  private async createModel() {
    const { createOpenRouter } = await this.loadOpenRouterSdk();
    const apiKey = this.configService.get('llm.openrouterApiKey', {
      infer: true,
    });

    if (!apiKey) {
      throw new Error('OPENROUTER_API_KEY is not configured');
    }

    const openrouter = createOpenRouter({ apiKey });
    const modelName = this.configService.get('llm.openrouterModel', {
      infer: true,
    });

    return openrouter.chat(modelName);
  }

  private extractToolCalls(steps: any[] | undefined): TaskAgentToolCall[] {
    if (!steps?.length) return [];

    return steps.flatMap((step) => {
      const toolCalls = step.toolCalls || [];
      const toolResults = step.toolResults || [];

      return toolCalls.map((call) => {
        const result = toolResults.find(
          (item) => item.toolCallId === call.toolCallId,
        );

        return {
          toolName: call.toolName,
          input: call.input,
          output: result?.output,
        };
      });
    });
  }

  private async loadAiSdk(): Promise<AiModule> {
    return new Function('specifier', 'return import(specifier)')('ai');
  }

  private async loadOpenRouterSdk(): Promise<OpenRouterModule> {
    return new Function('specifier', 'return import(specifier)')(
      '@openrouter/ai-sdk-provider',
    );
  }
}
