import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AiIntentExampleEntity } from './entities/ai-intent-example.entity';
import { AiIntentLogEntity } from './entities/ai-intent-log.entity';
import { OutputValidatorService } from './guard/output-validator.service';
import { RuleBasedGuardService } from './guard/rule-based-guard.service';
import { IntentClassifierService } from './intent/intent-classifier.service';
import { IntentLoggingService } from './intent/intent-logging.service';
import { IntentRouterService } from './intent/intent-router.service';
import { IntentSeederService } from './intent/intent-seeder.service';
import { LlmClassifierService } from './intent/llm-classifier.service';
import { RagCoreModule } from './rag-core.module';
import { AiIntentExampleRepository } from './repositories/ai-intent-example.repository';
import { AiIntentLogRepository } from './repositories/ai-intent-log.repository';

@Module({
  imports: [
    TypeOrmModule.forFeature([AiIntentExampleEntity, AiIntentLogEntity]),
    RagCoreModule,
  ],
  providers: [
    IntentClassifierService,
    RuleBasedGuardService,
    IntentRouterService,
    LlmClassifierService,
    OutputValidatorService,
    IntentSeederService,
    IntentLoggingService,
    AiIntentExampleRepository,
    AiIntentLogRepository,
  ],
  exports: [
    IntentClassifierService,
    OutputValidatorService,
    IntentLoggingService,
    IntentSeederService,
  ],
})
export class RagIntentModule {}
