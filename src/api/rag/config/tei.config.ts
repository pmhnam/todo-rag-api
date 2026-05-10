import { registerAs } from '@nestjs/config';
import { TeiConfig } from './tei-config.type';

export default registerAs<TeiConfig>('tei', () => ({
  host: process.env.TEI_HOST || 'localhost',
  port: process.env.TEI_PORT ? parseInt(process.env.TEI_PORT, 10) : 8080,
  embeddingDimension: 1024, // BAAI/bge-m3 output dimension
  maxBatchSize: 32,
  requestTimeout: 30000, // 30s
}));
