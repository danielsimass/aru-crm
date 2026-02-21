import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddLastSuccessToJobs1771363000000 implements MigrationInterface {
  name = 'AddLastSuccessToJobs1771363000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "jobs"
      ADD COLUMN "last_success" TEXT NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "jobs"
      DROP COLUMN "last_success"
    `);
  }
}
