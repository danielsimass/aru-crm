import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateAthletesTable1771358425807 implements MigrationInterface {
    name = 'CreateAthletesTable1771358425807'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."athletes_dominant_hand_enum" AS ENUM('RIGHT', 'LEFT', 'AMBIDEXTROUS')`);
        await queryRunner.query(`CREATE TABLE "athletes" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "full_name" character varying(255) NOT NULL, "birth_date" date NOT NULL, "phone" character varying(50) NOT NULL, "guardian_name" character varying(255) NOT NULL, "guardian_phone" character varying(50) NOT NULL, "is_active" boolean NOT NULL DEFAULT true, "registration_date" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "email" character varying(255), "cpf" character varying(11), "height_cm" numeric(5,2), "weight_kg" numeric(5,2), "dominant_hand" "public"."athletes_dominant_hand_enum", "notes" text, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_3b92d2bd187b2b2d27d4c47f1c4" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_dfcb07146d2e0d620674cae1b2" ON "athletes" ("cpf") `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."IDX_dfcb07146d2e0d620674cae1b2"`);
        await queryRunner.query(`DROP TABLE "athletes"`);
        await queryRunner.query(`DROP TYPE "public"."athletes_dominant_hand_enum"`);
    }

}
