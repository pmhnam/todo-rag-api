import { Uuid } from '@/common/types/common.type';
import { Injectable, Logger } from '@nestjs/common';
import { AiIntentLogRepository } from '../repositories/ai-intent-log.repository';
import { IntentClassification } from '../types/intent-classification.type';

@Injectable()
export class IntentLoggingService {
  private readonly logger = new Logger(IntentLoggingService.name);

  constructor(private readonly intentLogRepository: AiIntentLogRepository) {}

  async log(data: {
    userId?: Uuid;
    message: string;
    classification: IntentClassification;
    finalToolCalled?: string;
    accepted: boolean;
  }): Promise<void> {
    try {
      await this.intentLogRepository.saveLog({
        userId: data.userId,
        message: data.message,
        predictedIntent: data.classification.intent,
        confidence: data.classification.confidence,
        nearestExamples: data.classification.nearest,
        finalToolCalled: data.finalToolCalled,
        accepted: data.accepted,
      });
    } catch (error: any) {
      this.logger.warn(`Failed to write intent log: ${error.message}`);
    }
  }
}
