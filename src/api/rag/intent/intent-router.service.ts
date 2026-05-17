import { Injectable } from '@nestjs/common';
import { AiIntent } from '../enums/ai-intent.enum';
import { AiIntentExampleRepository } from '../repositories/ai-intent-example.repository';
import { EmbeddingService } from '../services/embedding.service';
import {
  IntentClassification,
  IntentNearestExample,
} from '../types/intent-classification.type';

const MIN_SIMILARITY = 0.72;
const MIN_MARGIN = 0.05;

@Injectable()
export class IntentRouterService {
  constructor(
    private readonly embeddingService: EmbeddingService,
    private readonly intentExampleRepository: AiIntentExampleRepository,
  ) {}

  async classify(message: string): Promise<IntentClassification> {
    const embedding = await this.embeddingService.embedSingle(message);
    const nearest = await this.intentExampleRepository.findNearest(
      embedding,
      8,
    );

    return this.decideIntent(nearest);
  }

  private decideIntent(rows: IntentNearestExample[]): IntentClassification {
    if (!rows.length) {
      return {
        intent: AiIntent.AMBIGUOUS,
        confidence: 0,
        reason: 'No intent examples found.',
        nearest: [],
      };
    }

    const scoreByIntent = new Map<AiIntent, number>();
    for (const row of rows) {
      scoreByIntent.set(
        row.intent,
        Math.max(scoreByIntent.get(row.intent) ?? 0, row.similarity),
      );
    }

    const ranked = [...scoreByIntent.entries()].sort((a, b) => b[1] - a[1]);
    const [bestIntent, bestScore] = ranked[0];
    const secondScore = ranked[1]?.[1] ?? 0;

    if (bestScore < MIN_SIMILARITY) {
      return {
        intent: AiIntent.AMBIGUOUS,
        confidence: bestScore,
        reason: 'Best similarity below threshold.',
        nearest: rows,
      };
    }

    if (bestScore - secondScore < MIN_MARGIN) {
      return {
        intent: AiIntent.AMBIGUOUS,
        confidence: bestScore,
        reason: 'Top intents are too close.',
        nearest: rows,
      };
    }

    return {
      intent: bestIntent,
      confidence: bestScore,
      reason: 'Intent selected by embedding similarity.',
      nearest: rows,
    };
  }
}
