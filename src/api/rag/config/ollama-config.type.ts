export type OllamaConfig = {
  baseUrl: string;
  embedModel: string;
  embeddingDimension: number;
  maxBatchSize: number;
  requestTimeout: number;
};
