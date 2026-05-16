import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateTodoActivityTable1779400000000 implements MigrationInterface {
  name = 'CreateTodoActivityTable1779400000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."todo_activity_type_enum" AS ENUM('TASK_CREATED','TASK_UPDATED','TASK_MOVED','TASK_DELETED','JIRA_LINKED','JIRA_UNLINKED','JIRA_SYNCED','JIRA_SYNC_PENDING','JIRA_SYNC_FAILED','COMMENT_ADDED','COMMENT_UPDATED','COMMENT_DELETED')`,
    );
    await queryRunner.query(`
      CREATE TABLE "todo_activity" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "todo_id" uuid NOT NULL,
        "user_id" uuid NOT NULL,
        "type" "public"."todo_activity_type_enum" NOT NULL,
        "message" character varying(500) NOT NULL,
        "metadata" jsonb,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "created_by" character varying NOT NULL,
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_by" character varying NOT NULL,
        CONSTRAINT "PK_todo_activity_id" PRIMARY KEY ("id")
      )`);
    await queryRunner.query(
      `CREATE INDEX "IDX_todo_activity_todo_created_at" ON "todo_activity" ("todo_id", "created_at")`,
    );
    await queryRunner.query(
      `ALTER TABLE "todo_activity" ADD CONSTRAINT "FK_todo_activity_todo_id" FOREIGN KEY ("todo_id") REFERENCES "todo"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "todo_activity" ADD CONSTRAINT "FK_todo_activity_user_id" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "todo_activity" DROP CONSTRAINT "FK_todo_activity_user_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "todo_activity" DROP CONSTRAINT "FK_todo_activity_todo_id"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_todo_activity_todo_created_at"`,
    );
    await queryRunner.query(`DROP TABLE "todo_activity"`);
    await queryRunner.query(`DROP TYPE "public"."todo_activity_type_enum"`);
  }
}
