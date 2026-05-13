import { Injectable } from '@nestjs/common';
import { RagContextChunk, SearchResult } from '../types/rag.types';

@Injectable()
export class RagPromptBuilderService {
  buildContext(results: SearchResult[]): string {
    if (results.length === 0) return '';

    return results
      .map((result, index) => `[Source ${index + 1}] ${result.content}`)
      .join('\n\n');
  }

  buildContextChunks(results: SearchResult[]): RagContextChunk[] {
    return results.map((result) => ({
      chunkId: result.chunkId,
      sourceId: result.sourceId,
      distance: result.distance,
      contentPreview: result.content.slice(0, 200),
    }));
  }
}
