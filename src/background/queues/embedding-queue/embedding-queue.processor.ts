import { ChunkingService } from '@/api/rag/services/chunking.service';
import { EmbeddingService } from '@/api/rag/services/embedding.service';
import { IndexingService } from '@/api/rag/services/indexing.service';
import { Uuid } from '@/common/types/common.type';
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Job } from 'bullmq';
import { Repository } from 'typeorm';
import { EmbeddingChunkEntity } from '../../../api/rag/entities/embedding-chunk.entity';
import { EmbeddingStatus } from '../../../api/rag/enums/embedding-status.enum';
import { EMBEDDING_QUEUE } from './embedding-queue.constant';

export interface EmbeddingJobData {
  sourceId: Uuid;
  userId: Uuid;
  content: string;
  metadata?: Record<string, any>;
}

@Processor(EMBEDDING_QUEUE)
export class EmbeddingQueueProcessor extends WorkerHost {
  private readonly logger = new Logger(EmbeddingQueueProcessor.name);

  constructor(
    private readonly embeddingService: EmbeddingService,
    private readonly chunkingService: ChunkingService,
    private readonly indexingService: IndexingService,
    @InjectRepository(EmbeddingChunkEntity)
    private readonly chunkRepo: Repository<EmbeddingChunkEntity>,
  ) {
    super();
  }

  async process(job: Job<EmbeddingJobData>): Promise<void> {
    const { sourceId, userId, content, metadata } = job.data;

    this.logger.log(`Processing embedding job for source ${sourceId}`);

    try {
      // 1. Update status to processing
      await this.indexingService.updateStatus(
        sourceId,
        EmbeddingStatus.PROCESSING,
      );

      // 2. Enrich content with metadata context
      const enrichedContent = this.chunkingService.enrichContent(
        content,
        metadata || {},
      );

      // 3. Split into chunks
      const chunks = this.chunkingService.splitText(enrichedContent);

      this.logger.debug(`Source ${sourceId}: ${chunks.length} chunks created`);

      // 4. Embed chunks in batches
      const chunkTexts = chunks.map((c) => c.content);
      const embeddings = await this.embeddingService.embed(chunkTexts);

      // 5. Save chunks with embeddings to DB
      const chunkEntities = chunks.map((chunk, idx) => {
        return this.chunkRepo.create({
          sourceId,
          userId,
          content: chunk.content,
          chunkIndex: chunk.index,
          tokenCount: this.chunkingService.estimateTokenCount(chunk.content),
          embedding: embeddings[idx],
          metadata: metadata,
        });
      });

      await this.chunkRepo.save(chunkEntities);

      // 6. Update status to completed
      await this.indexingService.updateStatus(
        sourceId,
        EmbeddingStatus.COMPLETED,
      );

      this.logger.log(
        `Embedding job completed for source ${sourceId}: ${chunkEntities.length} chunks embedded`,
      );
    } catch (error) {
      this.logger.error(
        `Embedding job failed for source ${sourceId}: ${error.message}`,
        error.stack,
      );

      // Update status to failed
      await this.indexingService.updateStatus(sourceId, EmbeddingStatus.FAILED);

      throw error; // BullMQ will handle retry
    }
  }
}
