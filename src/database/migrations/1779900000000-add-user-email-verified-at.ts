import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUserEmailVerifiedAt1779900000000 implements MigrationInterface {
  name = 'AddUserEmailVerifiedAt1779900000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "user" ADD "email_verified_at" TIMESTAMP WITH TIME ZONE
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "user" DROP COLUMN "email_verified_at"
    `);
  }
}
