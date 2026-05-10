import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateTodoTable1778404968213 implements MigrationInterface {
  name = 'CreateTodoTable1778404968213';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            CREATE TYPE "public"."todo_priority_enum" AS ENUM('LOW', 'MEDIUM', 'HIGH')
        `);
    await queryRunner.query(`
            CREATE TYPE "public"."todo_jira_sync_status_enum" AS ENUM('NOT_LINKED', 'SYNCED', 'PENDING', 'FAILED')
        `);
    await queryRunner.query(`
            CREATE TABLE "todo" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "title" character varying(255) NOT NULL,
                "description" text,
                "status_id" uuid NOT NULL,
                "priority" "public"."todo_priority_enum" NOT NULL DEFAULT 'MEDIUM',
                "due_date" date,
                "user_id" uuid NOT NULL,
                "jira_issue_id" character varying(50),
                "jira_issue_key" character varying(50),
                "jira_issue_url" character varying(500),
                "jira_sync_status" "public"."todo_jira_sync_status_enum" NOT NULL DEFAULT 'NOT_LINKED',
                "jira_last_synced_at" TIMESTAMP WITH TIME ZONE,
                "deleted_at" TIMESTAMP WITH TIME ZONE,
                "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "created_by" character varying NOT NULL,
                "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "updated_by" character varying NOT NULL,
                CONSTRAINT "PK_todo_id" PRIMARY KEY ("id")
            )
        `);
    await queryRunner.query(`
            CREATE TABLE "todo_status" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "name" character varying(100) NOT NULL,
                "order" integer NOT NULL DEFAULT '0',
                "color" character varying(20),
                "user_id" uuid NOT NULL,
                "deleted_at" TIMESTAMP WITH TIME ZONE,
                "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "created_by" character varying NOT NULL,
                "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "updated_by" character varying NOT NULL,
                CONSTRAINT "PK_todo_status_id" PRIMARY KEY ("id")
            )
        `);
    await queryRunner.query(`
            CREATE TABLE "jira_status_mapping" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "todo_status_id" uuid NOT NULL,
                "jira_status_id" character varying(100) NOT NULL,
                "jira_status_name" character varying(100),
                "jira_integration_id" uuid NOT NULL,
                "deleted_at" TIMESTAMP WITH TIME ZONE,
                "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "created_by" character varying NOT NULL,
                "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "updated_by" character varying NOT NULL,
                CONSTRAINT "UQ_jira_status_mapping" UNIQUE ("todo_status_id", "jira_integration_id"),
                CONSTRAINT "PK_jira_status_mapping_id" PRIMARY KEY ("id")
            )
        `);
    await queryRunner.query(`
            CREATE TABLE "jira_integration" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "jira_domain" character varying(255) NOT NULL,
                "jira_email" character varying(255) NOT NULL,
                "jira_api_token" character varying NOT NULL,
                "jira_project_key" character varying(50),
                "user_id" uuid NOT NULL,
                "deleted_at" TIMESTAMP WITH TIME ZONE,
                "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "created_by" character varying NOT NULL,
                "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "updated_by" character varying NOT NULL,
                CONSTRAINT "REL_2735bdec8ff7d6c0430989b52b" UNIQUE ("user_id"),
                CONSTRAINT "PK_jira_integration_id" PRIMARY KEY ("id")
            )
        `);
    await queryRunner.query(`
            CREATE UNIQUE INDEX "UQ_jira_integration_user_id" ON "jira_integration" ("user_id")
        `);
    await queryRunner.query(`
            ALTER TABLE "todo"
            ADD CONSTRAINT "FK_todo_status_id" FOREIGN KEY ("status_id") REFERENCES "todo_status"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
    await queryRunner.query(`
            ALTER TABLE "todo"
            ADD CONSTRAINT "FK_todo_user_id" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
    await queryRunner.query(`
            ALTER TABLE "todo_status"
            ADD CONSTRAINT "FK_todo_status_user_id" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
    await queryRunner.query(`
            ALTER TABLE "jira_status_mapping"
            ADD CONSTRAINT "FK_jira_status_mapping_todo_status_id" FOREIGN KEY ("todo_status_id") REFERENCES "todo_status"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
    await queryRunner.query(`
            ALTER TABLE "jira_status_mapping"
            ADD CONSTRAINT "FK_jira_status_mapping_jira_integration_id" FOREIGN KEY ("jira_integration_id") REFERENCES "jira_integration"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
    await queryRunner.query(`
            ALTER TABLE "jira_integration"
            ADD CONSTRAINT "FK_jira_integration_user_id" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE "jira_integration" DROP CONSTRAINT "FK_jira_integration_user_id"
        `);
    await queryRunner.query(`
            ALTER TABLE "jira_status_mapping" DROP CONSTRAINT "FK_jira_status_mapping_jira_integration_id"
        `);
    await queryRunner.query(`
            ALTER TABLE "jira_status_mapping" DROP CONSTRAINT "FK_jira_status_mapping_todo_status_id"
        `);
    await queryRunner.query(`
            ALTER TABLE "todo_status" DROP CONSTRAINT "FK_todo_status_user_id"
        `);
    await queryRunner.query(`
            ALTER TABLE "todo" DROP CONSTRAINT "FK_todo_user_id"
        `);
    await queryRunner.query(`
            ALTER TABLE "todo" DROP CONSTRAINT "FK_todo_status_id"
        `);
    await queryRunner.query(`
            DROP INDEX "public"."UQ_jira_integration_user_id"
        `);
    await queryRunner.query(`
            DROP TABLE "jira_integration"
        `);
    await queryRunner.query(`
            DROP TABLE "jira_status_mapping"
        `);
    await queryRunner.query(`
            DROP TABLE "todo_status"
        `);
    await queryRunner.query(`
            DROP TABLE "todo"
        `);
    await queryRunner.query(`
            DROP TYPE "public"."todo_jira_sync_status_enum"
        `);
    await queryRunner.query(`
            DROP TYPE "public"."todo_priority_enum"
        `);
  }
}
