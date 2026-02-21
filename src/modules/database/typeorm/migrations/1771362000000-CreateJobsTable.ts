import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateJobsTable1771362000000 implements MigrationInterface {
  name = 'CreateJobsTable1771362000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "jobs" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "type" character varying(50) NOT NULL,
        "status" character varying(20) NOT NULL,
        "payload" jsonb,
        "dedupe_key" character varying(255),
        "attempts" integer NOT NULL DEFAULT 0,
        "max_attempts" integer NOT NULL DEFAULT 3,
        "last_error" text,
        "available_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "locked_at" TIMESTAMP WITH TIME ZONE,
        "locked_by" character varying(100),
        "done_at" TIMESTAMP WITH TIME ZONE,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_jobs" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_jobs_dedupe_key" UNIQUE ("dedupe_key")
      )
    `);

    await queryRunner.query(
      `CREATE INDEX "IDX_jobs_status_available_at" ON "jobs" ("status", "available_at")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_jobs_type_status_available_at" ON "jobs" ("type", "status", "available_at")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_jobs_locked_at" ON "jobs" ("locked_at")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "public"."IDX_jobs_locked_at"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_jobs_type_status_available_at"`,
    );
    await queryRunner.query(`DROP INDEX "public"."IDX_jobs_status_available_at"`);
    await queryRunner.query(`DROP TABLE "jobs"`);
  }
}
