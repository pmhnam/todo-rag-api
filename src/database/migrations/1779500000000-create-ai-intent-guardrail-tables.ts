import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateAiIntentGuardrailTables1779500000000 implements MigrationInterface {
  name = 'CreateAiIntentGuardrailTables1779500000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS vector`);
    await queryRunner.query(`
      CREATE TABLE "ai_intent_examples" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "intent" character varying NOT NULL,
        "text" text NOT NULL,
        "embedding" vector(1024) NOT NULL,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "PK_ai_intent_examples_id" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`
      CREATE UNIQUE INDEX "UQ_ai_intent_examples_intent_text"
      ON "ai_intent_examples" ("intent", "text")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_ai_intent_examples_embedding_hnsw"
      ON "ai_intent_examples"
      USING hnsw ("embedding" vector_cosine_ops)
    `);

    await queryRunner.query(`
      CREATE TABLE "ai_intent_logs" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "user_id" uuid,
        "message" text NOT NULL,
        "predicted_intent" character varying NOT NULL,
        "confidence" double precision,
        "nearest_examples" jsonb,
        "final_tool_called" character varying,
        "accepted" boolean NOT NULL DEFAULT false,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "PK_ai_intent_logs_id" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_ai_intent_logs_user_created_at"
      ON "ai_intent_logs" ("user_id", "created_at")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_ai_intent_logs_user_created_at"`,
    );
    await queryRunner.query(`DROP TABLE IF EXISTS "ai_intent_logs"`);
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_ai_intent_examples_embedding_hnsw"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "UQ_ai_intent_examples_intent_text"`,
    );
    await queryRunner.query(`DROP TABLE IF EXISTS "ai_intent_examples"`);
  }
}
