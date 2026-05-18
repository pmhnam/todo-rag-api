import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddTodoArchiveFields1779800000000 implements MigrationInterface {
  name = 'AddTodoArchiveFields1779800000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TYPE "public"."todo_activity_type_enum" ADD VALUE IF NOT EXISTS 'TASK_ARCHIVED'
    `);
    await queryRunner.query(`
      ALTER TYPE "public"."todo_activity_type_enum" ADD VALUE IF NOT EXISTS 'TASK_UNARCHIVED'
    `);
    await queryRunner.query(`
      ALTER TABLE "todo" ADD "archived_at" TIMESTAMP WITH TIME ZONE
    `);
    await queryRunner.query(`
      ALTER TABLE "todo" ADD "archived_by" character varying
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_todo_project_archived_at" ON "todo" ("project_id", "archived_at")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP INDEX "public"."IDX_todo_project_archived_at"
    `);
    await queryRunner.query(`
      ALTER TABLE "todo" DROP COLUMN "archived_by"
    `);
    await queryRunner.query(`
      ALTER TABLE "todo" DROP COLUMN "archived_at"
    `);
  }
}
