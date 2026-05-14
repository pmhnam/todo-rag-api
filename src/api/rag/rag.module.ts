import { PostEntity } from '@/api/post/entities/post.entity';
import { TodoEntity } from '@/api/todo/entities/todo.entity';
import { TodoModule } from '@/api/todo/todo.module';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JiraIntegrationModule } from '../jira-integration/jira-integration.module';
import { AiSdkService } from './ai/ai-sdk.service';
import { IndexingController } from './controllers/indexing.controller';
import { RagController } from './controllers/rag.controller';
import { RagConversationEntity } from './entities/rag-conversation.entity';
import { RagMessageEntity } from './entities/rag-message.entity';
import { RagCoreModule } from './rag-core.module';
import { RagConversationRepository } from './repositories/rag-conversation.repository';
import { RagMessageRepository } from './repositories/rag-message.repository';
import { IndexingHelperService } from './services/indexing-helper.service';
import { RagPromptBuilderService } from './services/rag-prompt-builder.service';
import { RagService } from './services/rag.service';
import { SearchService } from './services/search.service';
import { TaskAgentService } from './services/task-agent.service';
import { TaskToolFactory } from './tools/task-tool.factory';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      RagConversationEntity,
      RagMessageEntity,
      TodoEntity,
      PostEntity,
    ]),
    RagCoreModule,
    JiraIntegrationModule,
    TodoModule,
  ],
  controllers: [RagController, IndexingController],
  providers: [
    IndexingHelperService,
    SearchService,
    RagService,
    TaskAgentService,
    RagPromptBuilderService,
    AiSdkService,
    TaskToolFactory,
    RagConversationRepository,
    RagMessageRepository,
  ],
  exports: [RagCoreModule],
})
export class RagModule {}
