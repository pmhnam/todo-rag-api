import { MigrationInterface, QueryRunner } from 'typeorm';

export class Migrations1778646494910 implements MigrationInterface {
  name = 'Migrations1778646494910';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            CREATE TABLE "project" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "name" character varying(255) NOT NULL,
                "description" text,
                "user_id" uuid NOT NULL,
                "settings" jsonb,
                "deleted_at" TIMESTAMP WITH TIME ZONE,
                "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "created_by" character varying NOT NULL,
                "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "updated_by" character varying NOT NULL,
                CONSTRAINT "PK_project_id" PRIMARY KEY ("id")
            )
        `);
    await queryRunner.query(`
            ALTER TABLE "todo"
            ADD "project_id" uuid
        `);
    await queryRunner.query(`
            ALTER TABLE "todo"
            ADD "tags" character varying array
        `);
    await queryRunner.query(`
            ALTER TABLE "todo"
            ADD "external_links" jsonb
        `);
    await queryRunner.query(`
            ALTER TABLE "todo"
            ADD "ai_summary" text
        `);
    await queryRunner.query(`
            ALTER TABLE "todo"
            ADD "generated_by_ai" boolean DEFAULT false
        `);
    await queryRunner.query(`
            ALTER TABLE "todo_status"
            ADD "project_id" uuid
        `);
    await queryRunner.query(`
            ALTER TABLE "rag_conversation"
            ALTER COLUMN "created_at"
            SET DEFAULT now()
        `);
    await queryRunner.query(`
            ALTER TABLE "rag_conversation"
            ALTER COLUMN "updated_at"
            SET DEFAULT now()
        `);
    await queryRunner.query(`
            ALTER TABLE "rag_message"
            ALTER COLUMN "created_at"
            SET DEFAULT now()
        `);
    await queryRunner.query(`
            ALTER TABLE "embedding_source"
            ALTER COLUMN "created_at"
            SET DEFAULT now()
        `);
    await queryRunner.query(`
            ALTER TABLE "embedding_source"
            ALTER COLUMN "updated_at"
            SET DEFAULT now()
        `);
    await queryRunner.query(`
            ALTER TABLE "embedding_chunk" DROP COLUMN "embedding"
        `);
    await queryRunner.query(`
            ALTER TABLE "embedding_chunk"
            ADD "embedding" text
        `);
    await queryRunner.query(`
            ALTER TABLE "embedding_chunk"
            ALTER COLUMN "created_at"
            SET DEFAULT now()
        `);
    await queryRunner.query(`
            ALTER TABLE "todo"
            ADD CONSTRAINT "FK_todo_project_id" FOREIGN KEY ("project_id") REFERENCES "project"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
    await queryRunner.query(`
            ALTER TABLE "project"
            ADD CONSTRAINT "FK_project_user_id" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
    await queryRunner.query(`
            ALTER TABLE "todo_status"
            ADD CONSTRAINT "FK_todo_status_project_id" FOREIGN KEY ("project_id") REFERENCES "project"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE "todo_status" DROP CONSTRAINT "FK_todo_status_project_id"
        `);
    await queryRunner.query(`
            ALTER TABLE "project" DROP CONSTRAINT "FK_project_user_id"
        `);
    await queryRunner.query(`
            ALTER TABLE "todo" DROP CONSTRAINT "FK_todo_project_id"
        `);
    await queryRunner.query(`
            ALTER TABLE "embedding_chunk"
            ALTER COLUMN "created_at"
            SET DEFAULT CURRENT_TIMESTAMP
        `);
    await queryRunner.query(`
            ALTER TABLE "embedding_chunk" DROP COLUMN "embedding"
        `);
    await queryRunner.query(`
            ALTER TABLE "embedding_chunk"
            ADD "embedding" vector
        `);
    await queryRunner.query(`
            ALTER TABLE "embedding_source"
            ALTER COLUMN "updated_at"
            SET DEFAULT CURRENT_TIMESTAMP
        `);
    await queryRunner.query(`
            ALTER TABLE "embedding_source"
            ALTER COLUMN "created_at"
            SET DEFAULT CURRENT_TIMESTAMP
        `);
    await queryRunner.query(`
            ALTER TABLE "rag_message"
            ALTER COLUMN "created_at"
            SET DEFAULT CURRENT_TIMESTAMP
        `);
    await queryRunner.query(`
            ALTER TABLE "rag_conversation"
            ALTER COLUMN "updated_at"
            SET DEFAULT CURRENT_TIMESTAMP
        `);
    await queryRunner.query(`
            ALTER TABLE "rag_conversation"
            ALTER COLUMN "created_at"
            SET DEFAULT CURRENT_TIMESTAMP
        `);
    await queryRunner.query(`
            ALTER TABLE "todo_status" DROP COLUMN "project_id"
        `);
    await queryRunner.query(`
            ALTER TABLE "todo" DROP COLUMN "generated_by_ai"
        `);
    await queryRunner.query(`
            ALTER TABLE "todo" DROP COLUMN "ai_summary"
        `);
    await queryRunner.query(`
            ALTER TABLE "todo" DROP COLUMN "external_links"
        `);
    await queryRunner.query(`
            ALTER TABLE "todo" DROP COLUMN "tags"
        `);
    await queryRunner.query(`
            ALTER TABLE "todo" DROP COLUMN "project_id"
        `);
    await queryRunner.query(`
            DROP TABLE "project"
        `);
  }
}
