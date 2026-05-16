import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddTodoPosition1779200000000 implements MigrationInterface {
  name = 'AddTodoPosition1779200000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "todo"
      ADD "position" integer NOT NULL DEFAULT 0
    `);

    await queryRunner.query(`
      WITH ranked AS (
        SELECT
          id,
          ROW_NUMBER() OVER (
            PARTITION BY project_id, status_id
            ORDER BY created_at ASC, id ASC
          ) - 1 AS position
        FROM "todo"
        WHERE deleted_at IS NULL
      )
      UPDATE "todo"
      SET "position" = ranked.position
      FROM ranked
      WHERE "todo"."id" = ranked.id
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "todo" DROP COLUMN "position"
    `);
  }
}
