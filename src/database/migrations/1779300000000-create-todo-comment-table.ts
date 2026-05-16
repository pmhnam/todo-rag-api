import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateTodoCommentTable1779300000000 implements MigrationInterface {
  name = 'CreateTodoCommentTable1779300000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "todo_comment" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "todo_id" uuid NOT NULL,
        "user_id" uuid NOT NULL,
        "content" text NOT NULL,
        "deleted_at" TIMESTAMP WITH TIME ZONE,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "created_by" character varying NOT NULL,
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_by" character varying NOT NULL,
        CONSTRAINT "PK_todo_comment_id" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_todo_comment_todo_created_at" ON "todo_comment" ("todo_id", "created_at")
    `);
    await queryRunner.query(`
      ALTER TABLE "todo_comment"
      ADD CONSTRAINT "FK_todo_comment_todo_id" FOREIGN KEY ("todo_id") REFERENCES "todo"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
    `);
    await queryRunner.query(`
      ALTER TABLE "todo_comment"
      ADD CONSTRAINT "FK_todo_comment_user_id" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "todo_comment" DROP CONSTRAINT "FK_todo_comment_user_id"
    `);
    await queryRunner.query(`
      ALTER TABLE "todo_comment" DROP CONSTRAINT "FK_todo_comment_todo_id"
    `);
    await queryRunner.query(`
      DROP INDEX "public"."IDX_todo_comment_todo_created_at"
    `);
    await queryRunner.query(`
      DROP TABLE "todo_comment"
    `);
  }
}
