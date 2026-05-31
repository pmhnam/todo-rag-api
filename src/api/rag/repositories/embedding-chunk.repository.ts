import { Uuid } from '@/common/types/common.type';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EmbeddingChunkEntity } from '../entities/embedding-chunk.entity';
import { SearchResult } from '../types/rag.types';

export type VectorSearchOptions = {
  projectId?: Uuid;
  maxDistance?: number;
  filterByProject?: boolean;
};

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
    options?: VectorSearchOptions,
  ): Promise<SearchResult[]> {
    const queryEmbedding = `[${embedding.join(',')}]`;
    const distanceExpr = 'chunk.embedding <=> CAST(:queryEmbedding AS vector)';
    const results = await this.repository
      .createQueryBuilder('chunk')
      .select(['chunk.id', 'chunk.content', 'chunk.sourceId', 'chunk.metadata'])
      .addSelect(distanceExpr, 'distance')
      .where('chunk.user_id = :userId', { userId })
      .andWhere('chunk.embedding IS NOT NULL')
      .orderBy(distanceExpr, 'ASC')
      .setParameter('queryEmbedding', queryEmbedding)
      .limit(topK);

    if (options?.filterByProject && options.projectId) {
      results.andWhere("chunk.metadata ->> 'projectId' = :projectId", {
        projectId: options.projectId,
      });
    }

    if (options?.maxDistance !== undefined) {
      results.andWhere(`${distanceExpr} <= :maxDistance`, {
        maxDistance: options.maxDistance,
      });
    }

    const queryResults = await results.getRawAndEntities();

    return queryResults.entities.map((entity, idx) => ({
      chunkId: entity.id,
      content: entity.content,
      sourceId: entity.sourceId,
      distance: parseFloat(queryResults.raw[idx]?.distance || '0'),
      metadata: entity.metadata,
    }));
  }

  async deleteBySourceId(sourceId: Uuid): Promise<void> {
    await this.repository.delete({ sourceId });
  }
}
