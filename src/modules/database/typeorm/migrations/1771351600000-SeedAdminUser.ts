import { MigrationInterface, QueryRunner } from 'typeorm';
import * as bcrypt from 'bcrypt';

export class SeedAdminUser1771351600000 implements MigrationInterface {
  name = 'SeedAdminUser1771351600000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const passwordHash = await bcrypt.hash('popkop123', 10);
    await queryRunner.query(
      `INSERT INTO "users" (
        "id",
        "email",
        "name",
        "username",
        "password",
        "role",
        "is_active",
        "is_first_login",
        "created_at",
        "updated_at"
      ) VALUES (
        uuid_generate_v4(),
        'simasdaniel98@gmail.com',
        'Daniel Simas',
        'admin',
        $1,
        'admin',
        true,
        false,
        now(),
        now()
      )`,
      [passwordHash],
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DELETE FROM "users" WHERE "username" = 'admin'`);
  }
}
