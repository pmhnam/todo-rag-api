import { EMBEDDING_QUEUE } from '@/background/queues/embedding-queue/embedding-queue.constant';
import { Uuid } from '@/common/types/common.type';
import { InjectQueue } from '@nestjs/bullmq';
import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Queue } from 'bullmq';
import * as crypto from 'crypto';
import { Repository } from 'typeorm';
import { EmbeddingChunkEntity } from '../entities/embedding-chunk.entity';
import { EmbeddingSourceEntity } from '../entities/embedding-source.entity';
import { EmbeddingStatus } from '../enums/embedding-status.enum';
import { SourceType } from '../enums/source-type.enum';

@Injectable()
export class IndexingService {
  private readonly logger = new Logger(IndexingService.name);

  constructor(
    @InjectRepository(EmbeddingSourceEntity)
    private readonly sourceRepo: Repository<EmbeddingSourceEntity>,
    @InjectRepository(EmbeddingChunkEntity)
    private readonly chunkRepo: Repository<EmbeddingChunkEntity>,
    @InjectQueue(EMBEDDING_QUEUE)
    private readonly embeddingQueue: Queue,
  ) {}

  /**
   * Index a specific DB record.
   * Creates an embedding_source entry and enqueues an embedding job.
   */
  async indexRecord(
    userId: Uuid,
    sourceType: SourceType,
    sourceId: Uuid,
    content: string,
    metadata?: Record<string, any>,
  ): Promise<EmbeddingSourceEntity> {
    const contentHash = this.hashContent(content);

    // Check if already indexed with same content
    let source = await this.sourceRepo.findOne({
      where: { sourceType, sourceId },
    });

    if (source) {
      if (source.contentHash === contentHash) {
        this.logger.debug(
          `Record ${sourceType}:${sourceId} already indexed with same content`,
        );
        return source;
      }

      // Content changed — re-index
      this.logger.debug(
        `Record ${sourceType}:${sourceId} content changed, re-indexing`,
      );
      await this.removeChunks(source.id);
      source.contentHash = contentHash;
      source.metadata = metadata;
      source.status = EmbeddingStatus.PENDING;
      source.updatedBy = userId;
      await this.sourceRepo.save(source);
    } else {
      // New record
      source = this.sourceRepo.create({
        userId,
        sourceType,
        sourceId,
        contentHash,
        metadata,
        status: EmbeddingStatus.PENDING,
        createdBy: userId,
        updatedBy: userId,
      });
      await this.sourceRepo.save(source);
    }

    // Enqueue embedding job
    await this.embeddingQueue.add('embed', {
      sourceId: source.id,
      userId,
      content,
      metadata: { ...metadata, sourceType },
    });

    this.logger.log(
      `Enqueued embedding job for ${sourceType}:${sourceId} (source: ${source.id})`,
    );

    return source;
  }

  /**
   * Re-index a record only if its content has changed.
   */
  async reindexIfChanged(
    userId: Uuid,
    sourceType: SourceType,
    sourceId: Uuid,
    content: string,
    metadata?: Record<string, any>,
  ): Promise<EmbeddingSourceEntity | null> {
    if (!content || content.trim().length === 0) {
      // No content to embed — remove existing index if any
      await this.removeIndex(sourceType, sourceId);
      return null;
    }

    return this.indexRecord(userId, sourceType, sourceId, content, metadata);
  }

  /**
   * Remove embedding for a source record.
   */
  async removeIndex(sourceType: SourceType, sourceId: Uuid): Promise<void> {
    const source = await this.sourceRepo.findOne({
      where: { sourceType, sourceId },
    });

    if (source) {
      // Chunks are cascade-deleted via FK
      await this.sourceRepo.remove(source);
      this.logger.log(`Removed index for ${sourceType}:${sourceId}`);
    }
  }

  /**
   * List all indexed sources for a user.
   */
  async findUserSources(
    userId: Uuid,
    sourceType?: SourceType,
  ): Promise<EmbeddingSourceEntity[]> {
    const where: any = { userId };
    if (sourceType) {
      where.sourceType = sourceType;
    }

    return this.sourceRepo.find({
      where,
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Update source status.
   */
  async updateStatus(sourceId: Uuid, status: EmbeddingStatus): Promise<void> {
    await this.sourceRepo.update(sourceId, { status });
  }

  /**
   * Get a source by ID.
   */
  async findSource(sourceId: Uuid): Promise<EmbeddingSourceEntity> {
    const source = await this.sourceRepo.findOne({
      where: { id: sourceId },
    });

    if (!source) {
      throw new NotFoundException(`Embedding source ${sourceId} not found`);
    }

    return source;
  }

  private async removeChunks(sourceId: Uuid): Promise<void> {
    await this.chunkRepo.delete({ sourceId });
  }

  private hashContent(content: string): string {
    return crypto.createHash('sha256').update(content).digest('hex');
  }
}
