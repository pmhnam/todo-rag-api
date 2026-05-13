import { Uuid } from '@/common/types/common.type';
import { Injectable, Logger } from '@nestjs/common';
import { EmbeddingChunkRepository } from '../repositories/embedding-chunk.repository';
import { SearchResult } from '../types/rag.types';
import { EmbeddingService } from './embedding.service';
import { RagPromptBuilderService } from './rag-prompt-builder.service';

@Injectable()
export class SearchService {
  private readonly logger = new Logger(SearchService.name);

  constructor(
    private readonly embeddingChunkRepository: EmbeddingChunkRepository,
    private readonly embeddingService: EmbeddingService,
    private readonly ragPromptBuilderService: RagPromptBuilderService,
  ) {}

  async search(
    userId: Uuid,
    query: string,
    topK: number = 5,
  ): Promise<SearchResult[]> {
    this.logger.debug(
      `Vector search: userId=${userId}, query="${query.slice(0, 50)}...", topK=${topK}`,
    );

    const queryEmbedding = await this.embeddingService.embedSingle(query);
    return this.embeddingChunkRepository.vectorSearch(
      userId,
      queryEmbedding,
      topK,
    );
  }

  buildContext(results: SearchResult[]): string {
    return this.ragPromptBuilderService.buildContext(results);
  }
}
