import { EmbeddingChunkEntity } from '@/api/rag/entities/embedding-chunk.entity';
import { RagCoreModule } from '@/api/rag/rag-core.module';
import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EMBEDDING_QUEUE } from './embedding-queue.constant';
import { EmbeddingQueueProcessor } from './embedding-queue.processor';

@Module({
  imports: [
    BullModule.registerQueue({
      name: EMBEDDING_QUEUE,
    }),
    TypeOrmModule.forFeature([EmbeddingChunkEntity]),
    RagCoreModule,
  ],
  providers: [EmbeddingQueueProcessor],
})
export class EmbeddingQueueModule {}
