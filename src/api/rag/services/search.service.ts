import { Uuid } from '@/common/types/common.type';
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EmbeddingChunkEntity } from '../entities/embedding-chunk.entity';
import { EmbeddingService } from './embedding.service';

export interface SearchResult {
  chunkId: Uuid;
  content: string;
  sourceId: Uuid;
  distance: number;
  metadata?: Record<string, any>;
}

@Injectable()
export class SearchService {
  private readonly logger = new Logger(SearchService.name);

  constructor(
    @InjectRepository(EmbeddingChunkEntity)
    private readonly chunkRepo: Repository<EmbeddingChunkEntity>,
    private readonly embeddingService: EmbeddingService,
  ) {}

  /**
   * Perform vector similarity search for a user's embeddings.
   * Uses cosine distance (<=>) with pgvector.
   */
  async search(
    userId: Uuid,
    query: string,
    topK: number = 5,
  ): Promise<SearchResult[]> {
    this.logger.debug(
      `Vector search: userId=${userId}, query="${query.slice(0, 50)}...", topK=${topK}`,
    );

    // 1. Embed the query
    const queryEmbedding = await this.embeddingService.embedSingle(query);

    // 2. Vector similarity search with user filter
    const vectorStr = `[${queryEmbedding.join(',')}]`;

    const results = await this.chunkRepo
      .createQueryBuilder('chunk')
      .select(['chunk.id', 'chunk.content', 'chunk.sourceId', 'chunk.metadata'])
      .addSelect(`chunk.embedding <=> '${vectorStr}'`, 'distance')
      .where('chunk.user_id = :userId', { userId })
      .andWhere('chunk.embedding IS NOT NULL')
      .orderBy(`chunk.embedding <=> '${vectorStr}'`, 'ASC')
      .limit(topK)
      .getRawAndEntities();

    // Map results with distance scores
    return results.entities.map((entity, idx) => ({
      chunkId: entity.id,
      content: entity.content,
      sourceId: entity.sourceId,
      distance: parseFloat(results.raw[idx]?.distance || '0'),
      metadata: entity.metadata,
    }));
  }

  /**
   * Build context string from search results.
   * This is the text that gets prepended to the LLM prompt.
   */
  buildContext(results: SearchResult[]): string {
    if (results.length === 0) {
      return '';
    }

    const contextParts = results.map((r, i) => {
      return `[Source ${i + 1}] ${r.content}`;
    });

    return contextParts.join('\n\n');
  }
}
