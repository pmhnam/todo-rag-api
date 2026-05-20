import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddTodoAssignee1780200000000 implements MigrationInterface {
  name = 'AddTodoAssignee1780200000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "todo" ADD "assignee_id" uuid`);
    await queryRunner.query(
      `CREATE INDEX "IDX_todo_assignee_id" ON "todo" ("assignee_id")`,
    );
    await queryRunner.query(`
      ALTER TABLE "todo"
      ADD CONSTRAINT "FK_todo_assignee_id" FOREIGN KEY ("assignee_id") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE NO ACTION
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "todo" DROP CONSTRAINT "FK_todo_assignee_id"`,
    );
    await queryRunner.query(`DROP INDEX "public"."IDX_todo_assignee_id"`);
    await queryRunner.query(`ALTER TABLE "todo" DROP COLUMN "assignee_id"`);
  }
}
