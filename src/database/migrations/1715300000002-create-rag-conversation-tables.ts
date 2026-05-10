import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateRagConversationTables1715300000002
  implements MigrationInterface
{
  name = 'CreateRagConversationTables1715300000002';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create rag_conversation table
    await queryRunner.query(`
      CREATE TABLE "rag_conversation" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "user_id" uuid NOT NULL,
        "title" character varying(255),
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "created_by" character varying NOT NULL,
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updated_by" character varying NOT NULL,
        CONSTRAINT "PK_rag_conversation_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_rag_conversation_user_id" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_rag_conversation_user_id" ON "rag_conversation" ("user_id")
    `);

    // Create rag_message table
    await queryRunner.query(`
      CREATE TABLE "rag_message" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "conversation_id" uuid NOT NULL,
        "role" character varying(20) NOT NULL,
        "content" text NOT NULL,
        "context_chunks" jsonb,
        "token_count" integer,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "PK_rag_message_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_rag_message_conversation_id" FOREIGN KEY ("conversation_id") REFERENCES "rag_conversation"("id") ON DELETE CASCADE ON UPDATE NO ACTION
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_rag_message_conversation_id" ON "rag_message" ("conversation_id")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_rag_message_conversation_id"`,
    );
    await queryRunner.query(`DROP TABLE IF EXISTS "rag_message"`);
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_rag_conversation_user_id"`,
    );
    await queryRunner.query(`DROP TABLE IF EXISTS "rag_conversation"`);
  }
}
