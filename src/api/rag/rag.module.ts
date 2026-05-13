import { PostEntity } from '@/api/post/entities/post.entity';
import { TodoStatusEntity } from '@/api/todo/entities/todo-status.entity';
import { TodoEntity } from '@/api/todo/entities/todo.entity';
import { TodoModule } from '@/api/todo/todo.module';
import { EMBEDDING_QUEUE } from '@/background/queues/embedding-queue/embedding-queue.constant';
import { HttpModule } from '@nestjs/axios';
import { BullModule } from '@nestjs/bullmq';
import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JiraIntegrationModule } from '../jira-integration/jira-integration.module';
import { AiSdkService } from './ai/ai-sdk.service';
import { IndexingController } from './controllers/indexing.controller';
import { RagController } from './controllers/rag.controller';
import { EmbeddingChunkEntity } from './entities/embedding-chunk.entity';
import { EmbeddingSourceEntity } from './entities/embedding-source.entity';
import { RagConversationEntity } from './entities/rag-conversation.entity';
import { RagMessageEntity } from './entities/rag-message.entity';
import { GeminiEmbeddingProvider } from './providers/embedding-gemini.provider';
import { OllamaEmbeddingProvider } from './providers/embedding-ollama.provider';
import { EmbeddingProviderFactory } from './providers/embedding-provider.factory';
import { LlmProviderFactory } from './providers/llm-provider.factory';
import { OllamaProvider } from './providers/ollama.provider';
import { OpenRouterProvider } from './providers/openrouter.provider';
import { EmbeddingChunkRepository } from './repositories/embedding-chunk.repository';
import { EmbeddingSourceRepository } from './repositories/embedding-source.repository';
import { RagConversationRepository } from './repositories/rag-conversation.repository';
import { RagMessageRepository } from './repositories/rag-message.repository';
import { ChunkingService } from './services/chunking.service';
import { EmbeddingService } from './services/embedding.service';
import { IndexingHelperService } from './services/indexing-helper.service';
import { IndexingService } from './services/indexing.service';
import { LlmService } from './services/llm.service';
import { RagPromptBuilderService } from './services/rag-prompt-builder.service';
import { RagService } from './services/rag.service';
import { SearchService } from './services/search.service';
import { TaskAgentService } from './services/task-agent.service';
import { TaskToolFactory } from './tools/task-tool.factory';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      EmbeddingSourceEntity,
      EmbeddingChunkEntity,
      RagConversationEntity,
      RagMessageEntity,
      TodoEntity,
      TodoStatusEntity,
      PostEntity,
    ]),
    HttpModule,
    BullModule.registerQueue({
      name: EMBEDDING_QUEUE,
    }),
    JiraIntegrationModule,
    forwardRef(() => TodoModule),
  ],
  controllers: [RagController, IndexingController],
  providers: [
    // Services
    EmbeddingService,
    ChunkingService,
    IndexingService,
    IndexingHelperService,
    SearchService,
    LlmService,
    RagService,
    TaskAgentService,
    RagPromptBuilderService,
    AiSdkService,
    TaskToolFactory,
    EmbeddingChunkRepository,
    EmbeddingSourceRepository,
    RagConversationRepository,
    RagMessageRepository,
    // Embedding Providers
    OllamaEmbeddingProvider,
    GeminiEmbeddingProvider,
    EmbeddingProviderFactory,
    // LLM Providers
    OllamaProvider,
    OpenRouterProvider,
    LlmProviderFactory,
  ],
  exports: [IndexingService, EmbeddingService, ChunkingService, LlmService],
})
export class RagModule {}
