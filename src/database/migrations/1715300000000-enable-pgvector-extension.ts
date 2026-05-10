import { MigrationInterface, QueryRunner } from 'typeorm';

export class EnablePgvectorExtension1715300000000
  implements MigrationInterface
{
  name = 'EnablePgvectorExtension1715300000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS vector`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP EXTENSION IF EXISTS vector`);
  }
}
