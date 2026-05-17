import { Injectable, Logger } from '@nestjs/common';
import { AiIntent } from '../enums/ai-intent.enum';
import { RuleBasedGuardService } from '../guard/rule-based-guard.service';
import { IntentClassification } from '../types/intent-classification.type';
import { IntentRouterService } from './intent-router.service';
import { LlmClassifierService } from './llm-classifier.service';

@Injectable()
export class IntentClassifierService {
  private readonly logger = new Logger(IntentClassifierService.name);

  constructor(
    private readonly ruleBasedGuardService: RuleBasedGuardService,
    private readonly intentRouterService: IntentRouterService,
    private readonly llmClassifierService: LlmClassifierService,
  ) {}

  async classify(message: string): Promise<IntentClassification> {
    const ruleResult = this.ruleBasedGuardService.check(message);
    if (ruleResult) return ruleResult;

    let classification: IntentClassification;
    try {
      classification = await this.intentRouterService.classify(message);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.warn(`Embedding intent router failed: ${message}`);
      classification = {
        intent: AiIntent.AMBIGUOUS,
        confidence: 0,
        reason: 'Embedding intent router failed.',
        nearest: [],
      };
    }

    if (classification.intent !== AiIntent.AMBIGUOUS) {
      return classification;
    }

    return this.llmClassifierService.classify(message, {
      nearestExamples: classification.nearest,
    });
  }
}
