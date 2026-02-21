import { MigrationInterface, QueryRunner } from 'typeorm';

export class ConvertJobsStatusAndTypeToEnum1771363000000
  implements MigrationInterface
{
  name = 'ConvertJobsStatusAndTypeToEnum1771363000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create ENUM types (TypeORM generates names as {table}_{column}_enum)
    await queryRunner.query(`
      CREATE TYPE "jobs_status_enum" AS ENUM (
        'PENDING',
        'PROCESSING',
        'DONE',
        'FAILED',
        'CANCELLED'
      )
    `);

    await queryRunner.query(`
      CREATE TYPE "jobs_type_enum" AS ENUM (
        'EMAIL_SEND'
      )
    `);

    // Drop existing indexes that use the columns we're changing
    await queryRunner.query(
      `DROP INDEX IF EXISTS "public"."IDX_jobs_status_available_at"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "public"."IDX_jobs_type_status_available_at"`,
    );

    // Alter columns to use ENUM types
    await queryRunner.query(`
      ALTER TABLE "jobs"
      ALTER COLUMN "status" TYPE "jobs_status_enum"
      USING "status"::"jobs_status_enum"
    `);

    await queryRunner.query(`
      ALTER TABLE "jobs"
      ALTER COLUMN "type" TYPE "jobs_type_enum"
      USING "type"::"jobs_type_enum"
    `);

    // Recreate indexes
    await queryRunner.query(
      `CREATE INDEX "IDX_jobs_status_available_at" ON "jobs" ("status", "available_at")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_jobs_type_status_available_at" ON "jobs" ("type", "status", "available_at")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop indexes
    await queryRunner.query(
      `DROP INDEX IF EXISTS "public"."IDX_jobs_type_status_available_at"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "public"."IDX_jobs_status_available_at"`,
    );

    // Convert columns back to varchar
    await queryRunner.query(`
      ALTER TABLE "jobs"
      ALTER COLUMN "status" TYPE character varying(20)
      USING "status"::text
    `);

    await queryRunner.query(`
      ALTER TABLE "jobs"
      ALTER COLUMN "type" TYPE character varying(50)
      USING "type"::text
    `);

    // Recreate indexes
    await queryRunner.query(
      `CREATE INDEX "IDX_jobs_status_available_at" ON "jobs" ("status", "available_at")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_jobs_type_status_available_at" ON "jobs" ("type", "status", "available_at")`,
    );

    // Drop ENUM types
    await queryRunner.query(`DROP TYPE IF EXISTS "jobs_type_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "jobs_status_enum"`);
  }
}
