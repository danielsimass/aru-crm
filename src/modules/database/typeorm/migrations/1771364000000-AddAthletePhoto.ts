import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddAthletePhoto1771364000000 implements MigrationInterface {
  name = 'AddAthletePhoto1771364000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "athletes"
      ADD COLUMN "photo" varchar(512) NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "athletes"
      DROP COLUMN "photo"
    `);
  }
}
