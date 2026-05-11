export const EMBEDDING_PROVIDER = Symbol('EMBEDDING_PROVIDER');

export interface IEmbeddingProvider {
  embedBatch(texts: string[]): Promise<number[][]>;
  isHealthy(): Promise<boolean>;
}
