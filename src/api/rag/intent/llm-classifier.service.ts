import { Injectable, Logger } from '@nestjs/common';
import { z } from 'zod';
import { AI_INTENT_VALUES, AiIntent } from '../enums/ai-intent.enum';
import { LlmService } from '../services/llm.service';
import {
  IntentClassification,
  IntentNearestExample,
} from '../types/intent-classification.type';

const ClassificationSchema = z.object({
  intent: z.enum(AI_INTENT_VALUES),
  confidence: z.number().min(0).max(1),
  reason: z.string(),
});

@Injectable()
export class LlmClassifierService {
  private readonly logger = new Logger(LlmClassifierService.name);

  constructor(private readonly llmService: LlmService) {}

  async classify(
    message: string,
    options: { nearestExamples?: IntentNearestExample[] } = {},
  ): Promise<IntentClassification> {
    const prompt = this.buildPrompt(message, options.nearestExamples || []);

    try {
      const result = await this.llmService.generate(prompt, {
        temperature: 0,
        maxTokens: 250,
      });
      const parsedJson = this.parseJson(result.content);
      const parsed = ClassificationSchema.parse(parsedJson);

      return {
        intent: parsed.intent,
        confidence: parsed.confidence,
        reason: parsed.reason,
        nearest: options.nearestExamples,
      };
    } catch (error: any) {
      this.logger.warn(`LLM intent classifier failed: ${error.message}`);
      return {
        intent: AiIntent.AMBIGUOUS,
        confidence: 0,
        reason: 'LLM classifier failed to produce valid JSON.',
        nearest: options.nearestExamples,
      };
    }
  }

  private buildPrompt(
    message: string,
    nearestExamples: IntentNearestExample[],
  ): string {
    return `You are an intent classifier for a Todo application.

Allowed domain:
- tasks
- projects
- task comments
- dashboard/statistics
- status
- tags

Disallowed domain:
- writing code
- writing HTML/CSS/JS
- general knowledge
- translation
- essay writing
- weather
- crypto prices
- anything not directly related to this Todo app

Classify the user message into exactly one intent:
TASK_CREATE, TASK_UPDATE, TASK_DELETE, TASK_SEARCH,
PROJECT_MANAGE, COMMENT_CREATE, COMMENT_SEARCH,
TAG_MANAGE, STATUS_UPDATE, DASHBOARD_QUERY,
TODO_HELP, OUT_OF_SCOPE, AMBIGUOUS.

Rules:
- Return JSON only.
- Never answer the user request.
- If unrelated to Todo app, return OUT_OF_SCOPE.
- If unclear but possibly related to Todo app, return AMBIGUOUS.

User message:
${message}

Nearest examples:
${JSON.stringify(nearestExamples)}

Expected output shape:
{"intent":"TASK_CREATE","confidence":0.9,"reason":"..."}`;
  }

  private parseJson(value: string): unknown {
    const trimmed = value.trim();
    const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
    return JSON.parse(fenced?.[1] || trimmed);
  }
}
