import { EmbeddingChunkEntity } from '@/api/rag/entities/embedding-chunk.entity';
import { ChunkingService } from '@/api/rag/services/chunking.service';
import { EmbeddingService } from '@/api/rag/services/embedding.service';
import { IndexingService } from '@/api/rag/services/indexing.service';
import { HttpModule } from '@nestjs/axios';
import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EmbeddingSourceEntity } from '../../../api/rag/entities/embedding-source.entity';
import { EMBEDDING_QUEUE } from './embedding-queue.constant';
import { EmbeddingQueueProcessor } from './embedding-queue.processor';

@Module({
  imports: [
    BullModule.registerQueue({
      name: EMBEDDING_QUEUE,
    }),
    TypeOrmModule.forFeature([EmbeddingChunkEntity, EmbeddingSourceEntity]),
    HttpModule,
  ],
  providers: [
    EmbeddingQueueProcessor,
    EmbeddingService,
    ChunkingService,
    IndexingService,
  ],
})
export class EmbeddingQueueModule {}
