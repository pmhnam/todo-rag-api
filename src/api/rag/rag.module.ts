import { PostEntity } from '@/api/post/entities/post.entity';
import { ProjectModule } from '@/api/project/project.module';
import { TodoEntity } from '@/api/todo/entities/todo.entity';
import { TodoModule } from '@/api/todo/todo.module';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JiraIntegrationModule } from '../jira-integration/jira-integration.module';
import { AiSdkService } from './ai/ai-sdk.service';
import { IndexingController } from './controllers/indexing.controller';
import { RagController } from './controllers/rag.controller';
import { AiIntentExampleEntity } from './entities/ai-intent-example.entity';
import { AiIntentLogEntity } from './entities/ai-intent-log.entity';
import { RagConversationEntity } from './entities/rag-conversation.entity';
import { RagMessageEntity } from './entities/rag-message.entity';
import { OutputValidatorService } from './guard/output-validator.service';
import { RuleBasedGuardService } from './guard/rule-based-guard.service';
import { IntentLoggingService } from './intent/intent-logging.service';
import { IntentRouterService } from './intent/intent-router.service';
import { IntentSeederService } from './intent/intent-seeder.service';
import { LlmClassifierService } from './intent/llm-classifier.service';
import { RagCoreModule } from './rag-core.module';
import { AiIntentExampleRepository } from './repositories/ai-intent-example.repository';
import { AiIntentLogRepository } from './repositories/ai-intent-log.repository';
import { RagConversationRepository } from './repositories/rag-conversation.repository';
import { RagMessageRepository } from './repositories/rag-message.repository';
import { IndexingHelperService } from './services/indexing-helper.service';
import { RagPromptBuilderService } from './services/rag-prompt-builder.service';
import { RagService } from './services/rag.service';
import { SearchService } from './services/search.service';
import { TaskAgentService } from './services/task-agent.service';
import { TaskIntentClassifierService } from './services/task-intent-classifier.service';
import { TaskToolFactory } from './tools/task-tool.factory';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      RagConversationEntity,
      RagMessageEntity,
      AiIntentExampleEntity,
      AiIntentLogEntity,
      TodoEntity,
      PostEntity,
    ]),
    RagCoreModule,
    JiraIntegrationModule,
    TodoModule,
    ProjectModule,
  ],
  controllers: [RagController, IndexingController],
  providers: [
    IndexingHelperService,
    SearchService,
    RagService,
    TaskAgentService,
    RagPromptBuilderService,
    TaskIntentClassifierService,
    RuleBasedGuardService,
    IntentRouterService,
    LlmClassifierService,
    OutputValidatorService,
    IntentSeederService,
    IntentLoggingService,
    AiSdkService,
    TaskToolFactory,
    AiIntentExampleRepository,
    AiIntentLogRepository,
    RagConversationRepository,
    RagMessageRepository,
  ],
  exports: [RagCoreModule],
})
export class RagModule {}
