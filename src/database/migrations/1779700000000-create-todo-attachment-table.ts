import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateTodoAttachmentTable1779700000000 implements MigrationInterface {
  name = 'CreateTodoAttachmentTable1779700000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TYPE "public"."todo_attachment_kind_enum" AS ENUM('IMAGE', 'VIDEO')
    `);
    await queryRunner.query(`
      CREATE TABLE "todo_attachment" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "todo_id" uuid NOT NULL,
        "comment_id" uuid,
        "user_id" uuid NOT NULL,
        "kind" "public"."todo_attachment_kind_enum" NOT NULL,
        "storage_key" character varying(700) NOT NULL,
        "url" character varying(1000) NOT NULL,
        "original_name" character varying(255) NOT NULL,
        "mime_type" character varying(100) NOT NULL,
        "size" bigint NOT NULL,
        "deleted_at" TIMESTAMP WITH TIME ZONE,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "created_by" character varying NOT NULL,
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_by" character varying NOT NULL,
        CONSTRAINT "UQ_todo_attachment_storage_key" UNIQUE ("storage_key"),
        CONSTRAINT "PK_todo_attachment_id" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_todo_attachment_todo_id" ON "todo_attachment" ("todo_id")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_todo_attachment_comment_id" ON "todo_attachment" ("comment_id")
    `);
    await queryRunner.query(`
      ALTER TABLE "todo_attachment"
      ADD CONSTRAINT "FK_todo_attachment_todo_id" FOREIGN KEY ("todo_id") REFERENCES "todo"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
    `);
    await queryRunner.query(`
      ALTER TABLE "todo_attachment"
      ADD CONSTRAINT "FK_todo_attachment_comment_id" FOREIGN KEY ("comment_id") REFERENCES "todo_comment"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
    `);
    await queryRunner.query(`
      ALTER TABLE "todo_attachment"
      ADD CONSTRAINT "FK_todo_attachment_user_id" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "todo_attachment" DROP CONSTRAINT "FK_todo_attachment_user_id"
    `);
    await queryRunner.query(`
      ALTER TABLE "todo_attachment" DROP CONSTRAINT "FK_todo_attachment_comment_id"
    `);
    await queryRunner.query(`
      ALTER TABLE "todo_attachment" DROP CONSTRAINT "FK_todo_attachment_todo_id"
    `);
    await queryRunner.query(`
      DROP INDEX "public"."IDX_todo_attachment_comment_id"
    `);
    await queryRunner.query(`
      DROP INDEX "public"."IDX_todo_attachment_todo_id"
    `);
    await queryRunner.query(`
      DROP TABLE "todo_attachment"
    `);
    await queryRunner.query(`
      DROP TYPE "public"."todo_attachment_kind_enum"
    `);
  }
}
