import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateAthletesEmailAndGuardianFields1771361000000
  implements MigrationInterface
{
  name = 'UpdateAthletesEmailAndGuardianFields1771361000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Make guardian fields nullable (for athletes 18+)
    await queryRunner.query(`
      ALTER TABLE "athletes"
      ALTER COLUMN "guardian_name" DROP NOT NULL
    `);
    await queryRunner.query(`
      ALTER TABLE "athletes"
      ALTER COLUMN "guardian_phone" DROP NOT NULL
    `);

    // Make email NOT NULL (assuming no null emails exist, or set a default)
    // First, update any null emails to a placeholder (shouldn't happen in practice)
    await queryRunner.query(`
      UPDATE "athletes"
      SET "email" = 'no-email-' || id::text || '@placeholder.local'
      WHERE "email" IS NULL
    `);

    // Then make it NOT NULL
    await queryRunner.query(`
      ALTER TABLE "athletes"
      ALTER COLUMN "email" SET NOT NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Revert email to nullable
    await queryRunner.query(`
      ALTER TABLE "athletes"
      ALTER COLUMN "email" DROP NOT NULL
    `);

    // Revert guardian fields to NOT NULL
    await queryRunner.query(`
      ALTER TABLE "athletes"
      ALTER COLUMN "guardian_name" SET NOT NULL
    `);
    await queryRunner.query(`
      ALTER TABLE "athletes"
      ALTER COLUMN "guardian_phone" SET NOT NULL
    `);
  }
}
