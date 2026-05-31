import { Uuid } from '@/common/types/common.type';

export type RagContextChunk = {
  chunkId: Uuid;
  sourceId: Uuid;
  distance: number;
  contentPreview: string;
  metadata?: SearchResultMetadata;
};

export type SearchResultMetadata = Record<string, unknown>;

export interface SearchResult {
  chunkId: Uuid;
  content: string;
  sourceId: Uuid;
  distance: number;
  metadata?: SearchResultMetadata;
}

export type SearchOptions = {
  projectId?: Uuid;
  maxDistance?: number;
  filterByProject?: boolean;
  enableQueryRewrite?: boolean;
};
