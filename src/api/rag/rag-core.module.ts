import { EMBEDDING_QUEUE } from '@/background/queues/embedding-queue/embedding-queue.constant';
import { HttpModule } from '@nestjs/axios';
import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EmbeddingChunkEntity } from './entities/embedding-chunk.entity';
import { EmbeddingSourceEntity } from './entities/embedding-source.entity';
import { GeminiEmbeddingProvider } from './providers/embedding-gemini.provider';
import { OllamaEmbeddingProvider } from './providers/embedding-ollama.provider';
import { EmbeddingProviderFactory } from './providers/embedding-provider.factory';
import { LlmProviderFactory } from './providers/llm-provider.factory';
import { OllamaProvider } from './providers/ollama.provider';
import { OpenRouterProvider } from './providers/openrouter.provider';
import { EmbeddingChunkRepository } from './repositories/embedding-chunk.repository';
import { EmbeddingSourceRepository } from './repositories/embedding-source.repository';
import { ChunkingService } from './services/chunking.service';
import { EmbeddingService } from './services/embedding.service';
import { IndexingService } from './services/indexing.service';
import { LlmService } from './services/llm.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([EmbeddingSourceEntity, EmbeddingChunkEntity]),
    HttpModule,
    BullModule.registerQueue({
      name: EMBEDDING_QUEUE,
    }),
  ],
  providers: [
    EmbeddingService,
    ChunkingService,
    IndexingService,
    LlmService,
    EmbeddingChunkRepository,
    EmbeddingSourceRepository,
    OllamaEmbeddingProvider,
    GeminiEmbeddingProvider,
    EmbeddingProviderFactory,
    OllamaProvider,
    OpenRouterProvider,
    LlmProviderFactory,
  ],
  exports: [
    EmbeddingService,
    ChunkingService,
    IndexingService,
    LlmService,
    EmbeddingChunkRepository,
    EmbeddingSourceRepository,
  ],
})
export class RagCoreModule {}
