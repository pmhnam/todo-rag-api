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

class InvalidClassificationJsonError extends Error {
  constructor(
    message = 'LLM classifier did not return valid classification JSON',
  ) {
    super(message);
  }
}

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
      this.logger.log(`LLM classifier raw output: ${result.content}`);
      const parsedJson = this.parseJson(result.content);
      const parsed = ClassificationSchema.parse(parsedJson);

      return {
        intent: parsed.intent,
        confidence: parsed.confidence,
        reason: parsed.reason,
        nearest: options.nearestExamples,
      };
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Unknown LLM classifier error';
      this.logger.warn(`LLM intent classifier failed: ${message}`);
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

You must return exactly one minified JSON object and nothing else.
Do not include markdown, explanations, chain-of-thought, prefixes, or suffixes.
If you cannot comply, return {"intent":"AMBIGUOUS","confidence":0,"reason":"Unable to classify."}.

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
- Return JSON only using this schema: {"intent":"TASK_CREATE","confidence":0.9,"reason":"short reason"}
- Never answer the user request.
- If unrelated to Todo app, return OUT_OF_SCOPE.
- If unclear but possibly related to Todo app, return AMBIGUOUS.
- The intent value must be one of: ${AI_INTENT_VALUES.join(', ')}.

User message:
${JSON.stringify(message)}

Nearest examples:
${JSON.stringify(nearestExamples)}

Valid output example:
{"intent":"TASK_CREATE","confidence":0.9,"reason":"..."}`;
  }

  private parseJson(value: string): unknown {
    const trimmed = value.trim();
    const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
    const candidate = fenced?.[1] || this.extractFirstJsonObject(trimmed);

    if (!candidate) {
      throw new InvalidClassificationJsonError();
    }

    try {
      return JSON.parse(candidate);
    } catch {
      throw new InvalidClassificationJsonError();
    }
  }

  private extractFirstJsonObject(value: string): string | undefined {
    const start = value.indexOf('{');
    if (start === -1) return undefined;

    let depth = 0;
    let inString = false;
    let escaped = false;

    for (let i = start; i < value.length; i += 1) {
      const char = value[i];

      if (escaped) {
        escaped = false;
        continue;
      }

      if (char === '\\') {
        escaped = true;
        continue;
      }

      if (char === '"') {
        inString = !inString;
        continue;
      }

      if (inString) continue;

      if (char === '{') depth += 1;
      if (char === '}') depth -= 1;

      if (depth === 0) {
        return value.slice(start, i + 1);
      }
    }

    return undefined;
  }
}
