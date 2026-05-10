import { PostEntity } from '@/api/post/entities/post.entity';
import { TodoEntity } from '@/api/todo/entities/todo.entity';
import { EMBEDDING_QUEUE } from '@/background/queues/embedding-queue/embedding-queue.constant';
import { HttpModule } from '@nestjs/axios';
import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { IndexingController } from './controllers/indexing.controller';
import { RagController } from './controllers/rag.controller';
import { EmbeddingChunkEntity } from './entities/embedding-chunk.entity';
import { EmbeddingSourceEntity } from './entities/embedding-source.entity';
import { RagConversationEntity } from './entities/rag-conversation.entity';
import { RagMessageEntity } from './entities/rag-message.entity';
import { LlmProviderFactory } from './providers/llm-provider.factory';
import { OllamaProvider } from './providers/ollama.provider';
import { ChunkingService } from './services/chunking.service';
import { EmbeddingService } from './services/embedding.service';
import { IndexingHelperService } from './services/indexing-helper.service';
import { IndexingService } from './services/indexing.service';
import { LlmService } from './services/llm.service';
import { RagService } from './services/rag.service';
import { SearchService } from './services/search.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      EmbeddingSourceEntity,
      EmbeddingChunkEntity,
      RagConversationEntity,
      RagMessageEntity,
      TodoEntity,
      PostEntity,
    ]),
    HttpModule,
    BullModule.registerQueue({
      name: EMBEDDING_QUEUE,
    }),
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
    // LLM Providers
    OllamaProvider,
    LlmProviderFactory,
  ],
  exports: [IndexingService, EmbeddingService, ChunkingService],
})
export class RagModule {}
