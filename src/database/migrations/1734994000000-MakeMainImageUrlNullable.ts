import { MigrationInterface, QueryRunner } from 'typeorm';

export class MakeMainImageUrlNullable1734994000000
  implements MigrationInterface
{
  name = 'MakeMainImageUrlNullable1734994000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Drop old foreign key constraint from single-category system if it exists
    await queryRunner.query(`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'FK_168bf21b341e2ae340748e2541d'
        ) THEN
          ALTER TABLE "posts" DROP CONSTRAINT "FK_168bf21b341e2ae340748e2541d";
        END IF;
      END $$;
    `);

    // Drop old categoryId column from posts table if it exists
    await queryRunner.query(`
      ALTER TABLE "posts" DROP COLUMN IF EXISTS "categoryId"
    `);

    // Make mainImageUrl nullable
    await queryRunner.query(`
      ALTER TABLE "posts" ALTER COLUMN "mainImageUrl" DROP NOT NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Revert mainImageUrl to NOT NULL (only if all values are non-null)
    await queryRunner.query(`
      ALTER TABLE "posts" ALTER COLUMN "mainImageUrl" SET NOT NULL
    `);

    // Note: We don't restore the old categoryId column or constraint
    // as that would break the multi-category system
  }
}
