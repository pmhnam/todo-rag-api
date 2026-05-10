import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateEmbeddingTables1722352657867 implements MigrationInterface {
  name = 'CreateEmbeddingTables1722352657867';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create embedding_source table
    await queryRunner.query(`
      CREATE TYPE "embedding_source_source_type_enum" AS ENUM ('todo', 'post', 'custom')
    `);

    await queryRunner.query(`
      CREATE TYPE "embedding_source_status_enum" AS ENUM ('pending', 'processing', 'completed', 'failed')
    `);

    await queryRunner.query(`
      CREATE TABLE "embedding_source" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "user_id" uuid NOT NULL,
        "source_type" "embedding_source_source_type_enum" NOT NULL,
        "source_id" uuid NOT NULL,
        "content_hash" character varying(64) NOT NULL,
        "metadata" jsonb,
        "status" "embedding_source_status_enum" NOT NULL DEFAULT 'pending',
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "created_by" character varying NOT NULL,
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updated_by" character varying NOT NULL,
        CONSTRAINT "PK_embedding_source_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_embedding_source_user_id" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
      )
    `);

    // Unique constraint: one embedding per source record
    await queryRunner.query(`
      CREATE UNIQUE INDEX "UQ_embedding_source_type_id" ON "embedding_source" ("source_type", "source_id")
    `);

    // Index for querying by user + type
    await queryRunner.query(`
      CREATE INDEX "IDX_embedding_source_user_type" ON "embedding_source" ("user_id", "source_type")
    `);

    // Create embedding_chunk table
    await queryRunner.query(`
      CREATE TABLE "embedding_chunk" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "source_id" uuid NOT NULL,
        "user_id" uuid NOT NULL,
        "content" text NOT NULL,
        "chunk_index" integer NOT NULL DEFAULT 0,
        "token_count" integer,
        "embedding" vector(1024),
        "metadata" jsonb,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "PK_embedding_chunk_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_embedding_chunk_source_id" FOREIGN KEY ("source_id") REFERENCES "embedding_source"("id") ON DELETE CASCADE ON UPDATE NO ACTION,
        CONSTRAINT "FK_embedding_chunk_user_id" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
      )
    `);

    // Index for filtering by user
    await queryRunner.query(`
      CREATE INDEX "IDX_embedding_chunk_user_id" ON "embedding_chunk" ("user_id")
    `);

    // Index for joining back to source
    await queryRunner.query(`
      CREATE INDEX "IDX_embedding_chunk_source_id" ON "embedding_chunk" ("source_id")
    `);

    // HNSW index for fast vector similarity search (cosine distance)
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
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_embedding_chunk_source_id"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_embedding_chunk_user_id"`,
    );
    await queryRunner.query(`DROP TABLE IF EXISTS "embedding_chunk"`);
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_embedding_source_user_type"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "UQ_embedding_source_type_id"`,
    );
    await queryRunner.query(`DROP TABLE IF EXISTS "embedding_source"`);
    await queryRunner.query(
      `DROP TYPE IF EXISTS "embedding_source_status_enum"`,
    );
    await queryRunner.query(
      `DROP TYPE IF EXISTS "embedding_source_source_type_enum"`,
    );
  }
}
