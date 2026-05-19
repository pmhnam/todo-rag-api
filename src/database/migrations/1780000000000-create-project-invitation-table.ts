import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateProjectInvitationTable1780000000000 implements MigrationInterface {
  name = 'CreateProjectInvitationTable1780000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TYPE "public"."project_invitation_permission_enum" AS ENUM ('READ', 'WRITE', 'WRITE_INVITE')
    `);
    await queryRunner.query(`
      CREATE TYPE "public"."project_invitation_status_enum" AS ENUM ('PENDING', 'ACCEPTED', 'REVOKED', 'EXPIRED')
    `);
    await queryRunner.query(`
      CREATE TABLE "project_invitation" (
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "created_by" character varying NOT NULL,
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_by" character varying NOT NULL,
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "project_id" uuid NOT NULL,
        "email" character varying NOT NULL,
        "permission" "public"."project_invitation_permission_enum" NOT NULL,
        "token_hash" character varying NOT NULL,
        "status" "public"."project_invitation_status_enum" NOT NULL DEFAULT 'PENDING',
        "invited_by" uuid NOT NULL,
        "accepted_by" uuid,
        "accepted_at" TIMESTAMP WITH TIME ZONE,
        "expires_at" TIMESTAMP WITH TIME ZONE NOT NULL,
        CONSTRAINT "PK_project_invitation_id" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`
      ALTER TABLE "project_invitation" ADD CONSTRAINT "FK_project_invitation_project_id" FOREIGN KEY ("project_id") REFERENCES "project"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
    `);
    await queryRunner.query(`
      ALTER TABLE "project_invitation" ADD CONSTRAINT "FK_project_invitation_invited_by" FOREIGN KEY ("invited_by") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_project_invitation_token_hash" ON "project_invitation" ("token_hash")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_project_invitation_project_status" ON "project_invitation" ("project_id", "status")
    `);
    await queryRunner.query(`
      CREATE UNIQUE INDEX "UQ_project_invitation_pending_email" ON "project_invitation" ("project_id", "email") WHERE "status" = 'PENDING'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX "public"."UQ_project_invitation_pending_email"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_project_invitation_project_status"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_project_invitation_token_hash"`,
    );
    await queryRunner.query(
      `ALTER TABLE "project_invitation" DROP CONSTRAINT "FK_project_invitation_invited_by"`,
    );
    await queryRunner.query(
      `ALTER TABLE "project_invitation" DROP CONSTRAINT "FK_project_invitation_project_id"`,
    );
    await queryRunner.query(`DROP TABLE "project_invitation"`);
    await queryRunner.query(
      `DROP TYPE "public"."project_invitation_status_enum"`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."project_invitation_permission_enum"`,
    );
  }
}
