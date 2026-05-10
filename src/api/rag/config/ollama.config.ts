import { registerAs } from '@nestjs/config';
import { OllamaConfig } from './ollama-config.type';

export default registerAs<OllamaConfig>('ollama', () => ({
  baseUrl: process.env.OLLAMA_BASE_URL || 'http://localhost:11434',
  embedModel: process.env.OLLAMA_EMBED_MODEL || 'nomic-embed-text',
  embeddingDimension: process.env.OLLAMA_EMBED_DIMENSION
    ? parseInt(process.env.OLLAMA_EMBED_DIMENSION, 10)
    : 768,
  maxBatchSize: 32,
  requestTimeout: 30000, // 30s
}));
