import { MigrationInterface, QueryRunner } from 'typeorm';

export class RestoreEmbeddingVectorColumn1779100000000 implements MigrationInterface {
  name = 'RestoreEmbeddingVectorColumn1779100000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS vector`);
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_embedding_chunk_embedding_hnsw"`,
    );
    await queryRunner.query(`
      ALTER TABLE "embedding_chunk"
      ALTER COLUMN "embedding" TYPE vector(1024)
      USING "embedding"::vector(1024)
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_embedding_chunk_embedding_hnsw"
      ON "embedding_chunk"
      USING hnsw ("embedding" vector_cosine_ops)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_embedding_chunk_embedding_hnsw"`,
    );
    await queryRunner.query(`
      ALTER TABLE "embedding_chunk"
      ALTER COLUMN "embedding" TYPE text
      USING "embedding"::text
    `);
  }
}
