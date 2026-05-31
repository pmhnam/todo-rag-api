import { Uuid } from '@/common/types/common.type';
import { Injectable, Logger } from '@nestjs/common';
import { EmbeddingChunkRepository } from '../repositories/embedding-chunk.repository';
import { SearchOptions, SearchResult } from '../types/rag.types';
import { EmbeddingService } from './embedding.service';
import { QueryReformulationService } from './query-reformulation.service';
import { RagPromptBuilderService } from './rag-prompt-builder.service';

@Injectable()
export class SearchService {
  private readonly logger = new Logger(SearchService.name);

  constructor(
    private readonly embeddingChunkRepository: EmbeddingChunkRepository,
    private readonly embeddingService: EmbeddingService,
    private readonly ragPromptBuilderService: RagPromptBuilderService,
    private readonly queryReformulationService: QueryReformulationService,
  ) {}

  async search(
    userId: Uuid,
    query: string,
    topK: number = 5,
    options?: SearchOptions,
  ): Promise<SearchResult[]> {
    const searchQuery = options?.enableQueryRewrite
      ? await this.queryReformulationService.rewrite(query)
      : query;
    this.logger.debug(
      `Vector search: userId=${userId}, query="${searchQuery.slice(0, 50)}...", topK=${topK}`,
    );

    const queryEmbedding = await this.embeddingService.embedSingle(searchQuery);
    return this.embeddingChunkRepository.vectorSearch(
      userId,
      queryEmbedding,
      topK,
      {
        projectId: options?.projectId,
        maxDistance: options?.maxDistance,
        filterByProject: options?.filterByProject,
      },
    );
  }

  buildContext(results: SearchResult[]): string {
    return this.ragPromptBuilderService.buildContext(results);
  }
}
