import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateWorkspaceTables1780100000000 implements MigrationInterface {
  name = 'CreateWorkspaceTables1780100000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "workspace" (
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "created_by" character varying NOT NULL,
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_by" character varying NOT NULL,
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "name" character varying(255) NOT NULL,
        "description" text,
        "owner_id" uuid NOT NULL,
        "settings" jsonb,
        "deleted_at" TIMESTAMP WITH TIME ZONE,
        CONSTRAINT "PK_workspace_id" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`
      CREATE TABLE "workspace_member" (
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "created_by" character varying NOT NULL,
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_by" character varying NOT NULL,
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "workspace_id" uuid NOT NULL,
        "user_id" uuid NOT NULL,
        "permission" "public"."project_member_permission_enum" NOT NULL DEFAULT 'READ',
        "invited_by" uuid,
        CONSTRAINT "UQ_workspace_member_workspace_user" UNIQUE ("workspace_id", "user_id"),
        CONSTRAINT "PK_workspace_member_id" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`
      CREATE TYPE "public"."workspace_invitation_status_enum" AS ENUM ('PENDING', 'ACCEPTED', 'REVOKED', 'EXPIRED')
    `);
    await queryRunner.query(`
      CREATE TABLE "workspace_invitation" (
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "created_by" character varying NOT NULL,
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_by" character varying NOT NULL,
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "workspace_id" uuid NOT NULL,
        "email" character varying NOT NULL,
        "permission" "public"."project_member_permission_enum" NOT NULL,
        "token_hash" character varying NOT NULL,
        "status" "public"."workspace_invitation_status_enum" NOT NULL DEFAULT 'PENDING',
        "invited_by" uuid NOT NULL,
        "accepted_by" uuid,
        "accepted_at" TIMESTAMP WITH TIME ZONE,
        "expires_at" TIMESTAMP WITH TIME ZONE NOT NULL,
        CONSTRAINT "PK_workspace_invitation_id" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`ALTER TABLE "project" ADD "workspace_id" uuid`);
    await queryRunner.query(`
      ALTER TABLE "workspace" ADD CONSTRAINT "FK_workspace_owner_id" FOREIGN KEY ("owner_id") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
    `);
    await queryRunner.query(`
      ALTER TABLE "workspace_member" ADD CONSTRAINT "FK_workspace_member_workspace_id" FOREIGN KEY ("workspace_id") REFERENCES "workspace"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
    `);
    await queryRunner.query(`
      ALTER TABLE "workspace_member" ADD CONSTRAINT "FK_workspace_member_user_id" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
    `);
    await queryRunner.query(`
      ALTER TABLE "workspace_invitation" ADD CONSTRAINT "FK_workspace_invitation_workspace_id" FOREIGN KEY ("workspace_id") REFERENCES "workspace"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
    `);
    await queryRunner.query(`
      ALTER TABLE "workspace_invitation" ADD CONSTRAINT "FK_workspace_invitation_invited_by" FOREIGN KEY ("invited_by") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
    `);
    await queryRunner.query(`
      ALTER TABLE "project" ADD CONSTRAINT "FK_project_workspace_id" FOREIGN KEY ("workspace_id") REFERENCES "workspace"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      INSERT INTO "workspace" ("id", "name", "description", "owner_id", "created_by", "updated_by", "created_at", "updated_at")
      SELECT uuid_generate_v4(), COALESCE(u."name", u."email", 'Workspace') || ' Workspace', NULL, p."user_id", p."user_id", p."user_id", now(), now()
      FROM (SELECT DISTINCT "user_id" FROM "project" WHERE "deleted_at" IS NULL) p
      JOIN "user" u ON u."id" = p."user_id"
    `);
    await queryRunner.query(`
      UPDATE "project" p
      SET "workspace_id" = w."id"
      FROM "workspace" w
      WHERE w."owner_id" = p."user_id" AND p."workspace_id" IS NULL
    `);
    await queryRunner.query(`
      INSERT INTO "workspace_member" ("workspace_id", "user_id", "permission", "invited_by", "created_by", "updated_by")
      SELECT DISTINCT p."workspace_id", pm."user_id", MAX(pm."permission"::text)::"project_member_permission_enum", pm."invited_by", pm."created_by", pm."updated_by"
      FROM "project_member" pm
      JOIN "project" p ON p."id" = pm."project_id"
      WHERE p."workspace_id" IS NOT NULL
      GROUP BY p."workspace_id", pm."user_id", pm."invited_by", pm."created_by", pm."updated_by"
      ON CONFLICT ("workspace_id", "user_id") DO NOTHING
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_workspace_invitation_token_hash" ON "workspace_invitation" ("token_hash")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_workspace_invitation_workspace_status" ON "workspace_invitation" ("workspace_id", "status")
    `);
    await queryRunner.query(`
      CREATE UNIQUE INDEX "UQ_workspace_invitation_pending_email" ON "workspace_invitation" ("workspace_id", "email") WHERE "status" = 'PENDING'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX "public"."UQ_workspace_invitation_pending_email"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_workspace_invitation_workspace_status"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_workspace_invitation_token_hash"`,
    );
    await queryRunner.query(
      `ALTER TABLE "project" DROP CONSTRAINT "FK_project_workspace_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "workspace_invitation" DROP CONSTRAINT "FK_workspace_invitation_invited_by"`,
    );
    await queryRunner.query(
      `ALTER TABLE "workspace_invitation" DROP CONSTRAINT "FK_workspace_invitation_workspace_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "workspace_member" DROP CONSTRAINT "FK_workspace_member_user_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "workspace_member" DROP CONSTRAINT "FK_workspace_member_workspace_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "workspace" DROP CONSTRAINT "FK_workspace_owner_id"`,
    );
    await queryRunner.query(`ALTER TABLE "project" DROP COLUMN "workspace_id"`);
    await queryRunner.query(`DROP TABLE "workspace_invitation"`);
    await queryRunner.query(
      `DROP TYPE "public"."workspace_invitation_status_enum"`,
    );
    await queryRunner.query(`DROP TABLE "workspace_member"`);
    await queryRunner.query(`DROP TABLE "workspace"`);
  }
}
