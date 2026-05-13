import { Uuid } from '@/common/types/common.type';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EmbeddingChunkEntity } from '../entities/embedding-chunk.entity';
import { SearchResult } from '../types/rag.types';

@Injectable()
export class EmbeddingChunkRepository {
  constructor(
    @InjectRepository(EmbeddingChunkEntity)
    private readonly repository: Repository<EmbeddingChunkEntity>,
  ) {}

  async vectorSearch(
    userId: Uuid,
    embedding: number[],
    topK: number,
  ): Promise<SearchResult[]> {
    const queryEmbedding = `[${embedding.join(',')}]`;
    const results = await this.repository
      .createQueryBuilder('chunk')
      .select(['chunk.id', 'chunk.content', 'chunk.sourceId', 'chunk.metadata'])
      .addSelect(
        'chunk.embedding <=> CAST(:queryEmbedding AS vector)',
        'distance',
      )
      .where('chunk.user_id = :userId', { userId })
      .andWhere('chunk.embedding IS NOT NULL')
      .orderBy('chunk.embedding <=> CAST(:queryEmbedding AS vector)', 'ASC')
      .setParameter('queryEmbedding', queryEmbedding)
      .limit(topK)
      .getRawAndEntities();

    return results.entities.map((entity, idx) => ({
      chunkId: entity.id,
      content: entity.content,
      sourceId: entity.sourceId,
      distance: parseFloat(results.raw[idx]?.distance || '0'),
      metadata: entity.metadata,
    }));
  }

  async deleteBySourceId(sourceId: Uuid): Promise<void> {
    await this.repository.delete({ sourceId });
  }
}
