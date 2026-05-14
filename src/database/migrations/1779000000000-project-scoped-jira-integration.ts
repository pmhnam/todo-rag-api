import { MigrationInterface, QueryRunner } from 'typeorm';

export class ProjectScopedJiraIntegration1779000000000 implements MigrationInterface {
  name = 'ProjectScopedJiraIntegration1779000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE "jira_integration"
            ADD "project_id" uuid
        `);
    await queryRunner.query(`
            UPDATE "jira_integration" ji
            SET "project_id" = (
                SELECT "id"
                FROM "project"
                WHERE "project"."user_id" = ji."user_id"
                  AND "project"."deleted_at" IS NULL
                ORDER BY "project"."created_at" ASC
                LIMIT 1
            )
            WHERE ji."project_id" IS NULL
        `);
    await queryRunner.query(`
            DELETE FROM "jira_integration"
            WHERE "project_id" IS NULL
        `);
    await queryRunner.query(`
            ALTER TABLE "jira_integration"
            ALTER COLUMN "project_id" SET NOT NULL
        `);
    await queryRunner.query(`
            ALTER TABLE "jira_integration" DROP CONSTRAINT IF EXISTS "REL_2735bdec8ff7d6c0430989b52b"
        `);
    await queryRunner.query(`
            DROP INDEX IF EXISTS "public"."UQ_jira_integration_user_id"
        `);
    await queryRunner.query(`
            CREATE UNIQUE INDEX "UQ_jira_integration_project_id" ON "jira_integration" ("project_id")
        `);
    await queryRunner.query(`
            ALTER TABLE "jira_integration"
            ADD CONSTRAINT "FK_jira_integration_project_id" FOREIGN KEY ("project_id") REFERENCES "project"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE "jira_integration" DROP CONSTRAINT IF EXISTS "FK_jira_integration_project_id"
        `);
    await queryRunner.query(`
            DROP INDEX IF EXISTS "public"."UQ_jira_integration_project_id"
        `);
    await queryRunner.query(`
            DELETE FROM "jira_integration" ji
            USING "jira_integration" older
            WHERE ji."user_id" = older."user_id"
              AND ji."created_at" > older."created_at"
        `);
    await queryRunner.query(`
            ALTER TABLE "jira_integration" DROP COLUMN "project_id"
        `);
    await queryRunner.query(`
            ALTER TABLE "jira_integration"
            ADD CONSTRAINT "REL_2735bdec8ff7d6c0430989b52b" UNIQUE ("user_id")
        `);
    await queryRunner.query(`
            CREATE UNIQUE INDEX "UQ_jira_integration_user_id" ON "jira_integration" ("user_id")
        `);
  }
}
