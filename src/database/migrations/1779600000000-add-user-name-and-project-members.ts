import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUserNameAndProjectMembers1779600000000 implements MigrationInterface {
  name = 'AddUserNameAndProjectMembers1779600000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "user"
      ADD "name" character varying(100)
    `);
    await queryRunner.query(`
      UPDATE "user"
      SET "name" = COALESCE(NULLIF("username", ''), split_part("email", '@', 1), 'User')
      WHERE "name" IS NULL
    `);
    await queryRunner.query(`
      ALTER TABLE "user"
      ALTER COLUMN "name" SET NOT NULL
    `);
    await queryRunner.query(`
      CREATE TYPE "public"."project_member_permission_enum" AS ENUM('READ', 'WRITE', 'WRITE_INVITE')
    `);
    await queryRunner.query(`
      CREATE TABLE "project_member" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "project_id" uuid NOT NULL,
        "user_id" uuid NOT NULL,
        "permission" "public"."project_member_permission_enum" NOT NULL DEFAULT 'READ',
        "invited_by" uuid NOT NULL,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "created_by" character varying NOT NULL,
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_by" character varying NOT NULL,
        CONSTRAINT "PK_project_member_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_project_member_project_user" UNIQUE ("project_id", "user_id")
      )
    `);
    await queryRunner.query(`
      ALTER TABLE "project_member"
      ADD CONSTRAINT "FK_project_member_project_id" FOREIGN KEY ("project_id") REFERENCES "project"("id") ON DELETE CASCADE ON UPDATE NO ACTION
    `);
    await queryRunner.query(`
      ALTER TABLE "project_member"
      ADD CONSTRAINT "FK_project_member_user_id" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION
    `);
    await queryRunner.query(`
      ALTER TABLE "project_member"
      ADD CONSTRAINT "FK_project_member_invited_by" FOREIGN KEY ("invited_by") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "project_member" DROP CONSTRAINT "FK_project_member_invited_by"
    `);
    await queryRunner.query(`
      ALTER TABLE "project_member" DROP CONSTRAINT "FK_project_member_user_id"
    `);
    await queryRunner.query(`
      ALTER TABLE "project_member" DROP CONSTRAINT "FK_project_member_project_id"
    `);
    await queryRunner.query(`
      DROP TABLE "project_member"
    `);
    await queryRunner.query(`
      DROP TYPE "public"."project_member_permission_enum"
    `);
    await queryRunner.query(`
      ALTER TABLE "user" DROP COLUMN "name"
    `);
  }
}
