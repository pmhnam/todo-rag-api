import { Injectable, Logger } from '@nestjs/common';

export interface ChunkResult {
  content: string;
  index: number;
}

@Injectable()
export class ChunkingService {
  private readonly logger = new Logger(ChunkingService.name);

  // Threshold: if content is shorter than this, treat as atomic (no split)
  private readonly atomicThreshold = 1000;
  private readonly chunkSize = 512;
  private readonly chunkOverlap = 50;

  /**
   * Enrich content with metadata context before embedding.
   * This helps the embedding model understand the semantic context.
   *
   * Example:
   *   Input: "Fix login bug on mobile"
   *   Enriched: "Todo Task [Priority: HIGH, Status: In Progress]: Fix login bug on mobile"
   */
  enrichContent(content: string, metadata: Record<string, any>): string {
    const parts: string[] = [];

    if (metadata.sourceType) {
      const typeLabel = this.getTypeLabel(metadata.sourceType);
      parts.push(typeLabel);
    }

    // Build context from metadata fields
    const contextParts: string[] = [];
    if (metadata.title) {
      contextParts.push(`Title: ${metadata.title}`);
    }
    if (metadata.priority) {
      contextParts.push(`Priority: ${metadata.priority}`);
    }
    if (metadata.status) {
      contextParts.push(`Status: ${metadata.status}`);
    }

    if (contextParts.length > 0) {
      parts.push(`[${contextParts.join(', ')}]`);
    }

    const prefix = parts.length > 0 ? `${parts.join(' ')}: ` : '';
    return `${prefix}${content}`;
  }

  /**
   * Smart text splitting:
   * - If content < atomicThreshold chars: return as single chunk (no split)
   * - If content >= atomicThreshold chars: recursive split by paragraph → sentence
   */
  splitText(text: string): ChunkResult[] {
    if (!text || text.trim().length === 0) {
      return [];
    }

    // Atomic: short content, don't split
    if (text.length < this.atomicThreshold) {
      return [{ content: text.trim(), index: 0 }];
    }

    // Recursive split for longer content
    return this.recursiveSplit(text);
  }

  private recursiveSplit(text: string): ChunkResult[] {
    const chunks: ChunkResult[] = [];

    // Step 1: Split by double newline (paragraphs)
    const paragraphs = text.split(/\n\n+/).filter((p) => p.trim().length > 0);

    let currentChunk = '';
    let chunkIndex = 0;

    for (const paragraph of paragraphs) {
      // If adding this paragraph would exceed chunk size
      if (
        currentChunk.length > 0 &&
        currentChunk.length + paragraph.length + 2 > this.chunkSize
      ) {
        // Save current chunk
        chunks.push({
          content: currentChunk.trim(),
          index: chunkIndex++,
        });

        // Start new chunk with overlap from end of previous
        const overlapText = this.getOverlapText(currentChunk);
        currentChunk = overlapText + paragraph;
      } else {
        // Add paragraph to current chunk
        currentChunk =
          currentChunk.length > 0
            ? `${currentChunk}\n\n${paragraph}`
            : paragraph;
      }

      // If single paragraph exceeds chunk size, split by sentences
      if (currentChunk.length > this.chunkSize) {
        const sentenceChunks = this.splitBySentences(currentChunk, chunkIndex);
        if (sentenceChunks.length > 1) {
          // Add all but last (which becomes the new currentChunk)
          for (let i = 0; i < sentenceChunks.length - 1; i++) {
            chunks.push(sentenceChunks[i]);
            chunkIndex = sentenceChunks[i].index + 1;
          }
          currentChunk = sentenceChunks[sentenceChunks.length - 1].content;
        }
      }
    }

    // Don't forget the last chunk
    if (currentChunk.trim().length > 0) {
      chunks.push({
        content: currentChunk.trim(),
        index: chunkIndex,
      });
    }

    this.logger.debug(
      `Split text (${text.length} chars) into ${chunks.length} chunks`,
    );

    return chunks;
  }

  private splitBySentences(text: string, startIndex: number): ChunkResult[] {
    const sentences = text.match(/[^.!?]+[.!?]+\s*/g) || [text];
    const chunks: ChunkResult[] = [];
    let currentChunk = '';
    let chunkIndex = startIndex;

    for (const sentence of sentences) {
      if (
        currentChunk.length > 0 &&
        currentChunk.length + sentence.length > this.chunkSize
      ) {
        chunks.push({
          content: currentChunk.trim(),
          index: chunkIndex++,
        });
        const overlapText = this.getOverlapText(currentChunk);
        currentChunk = overlapText + sentence;
      } else {
        currentChunk += sentence;
      }
    }

    if (currentChunk.trim().length > 0) {
      chunks.push({
        content: currentChunk.trim(),
        index: chunkIndex,
      });
    }

    return chunks;
  }

  /**
   * Extract overlap text from the end of a chunk.
   */
  private getOverlapText(text: string): string {
    if (text.length <= this.chunkOverlap) {
      return text;
    }
    return text.slice(-this.chunkOverlap);
  }

  /**
   * Approximate token count (rough: 1 token ≈ 4 chars for English, 2 chars for CJK).
   */
  estimateTokenCount(text: string): number {
    return Math.ceil(text.length / 3.5);
  }

  private getTypeLabel(sourceType: string): string {
    switch (sourceType) {
      case 'todo':
        return 'Todo Task';
      case 'post':
        return 'Blog Post';
      default:
        return 'Document';
    }
  }
}
