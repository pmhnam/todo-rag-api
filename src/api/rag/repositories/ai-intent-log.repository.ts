import { Uuid } from '@/common/types/common.type';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AiIntentLogEntity } from '../entities/ai-intent-log.entity';
import { AiIntent } from '../enums/ai-intent.enum';
import { IntentNearestExample } from '../types/intent-classification.type';

@Injectable()
export class AiIntentLogRepository {
  constructor(
    @InjectRepository(AiIntentLogEntity)
    private readonly repository: Repository<AiIntentLogEntity>,
  ) {}

  saveLog(data: {
    userId?: Uuid;
    message: string;
    predictedIntent: AiIntent;
    confidence?: number;
    nearestExamples?: IntentNearestExample[];
    finalToolCalled?: string;
    accepted: boolean;
  }): Promise<AiIntentLogEntity> {
    return this.repository.save(this.repository.create(data));
  }
}
