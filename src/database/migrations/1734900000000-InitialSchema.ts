import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1734900000000 implements MigrationInterface {
  name = 'InitialSchema1734900000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create users table if it doesn't exist
    await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "users" (
                "id" SERIAL NOT NULL,
                "firstname" character varying NOT NULL,
                "lastname" character varying NOT NULL,
                "email" character varying NOT NULL,
                "password" character varying NOT NULL,
                "profilePic" character varying DEFAULT NULL,
                CONSTRAINT "PK_users" PRIMARY KEY ("id")
            )
        `);

    // Create categories table if it doesn't exist
    await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "categories" (
                "id" SERIAL NOT NULL,
                "title" character varying NOT NULL,
                "description" character varying NOT NULL,
                "slug" character varying,
                "displayOrder" integer NOT NULL DEFAULT '1',
                "masterCategoryId" integer,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_categories" PRIMARY KEY ("id")
            )
        `);

    // Create posts table if it doesn't exist
    await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "posts" (
                "id" SERIAL NOT NULL,
                "title" character varying NOT NULL,
                "content" character varying NOT NULL,
                "slug" character varying NOT NULL,
                "createdOn" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                "modifiedOn" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                "mainImageUrl" character varying,
                "userId" integer NOT NULL,
                CONSTRAINT "PK_posts" PRIMARY KEY ("id")
            )
        `);

    // Add foreign key constraint from posts to users (only if it doesn't exist)
    await queryRunner.query(`
            DO $$
            BEGIN
                IF NOT EXISTS (
                    SELECT 1 FROM pg_constraint WHERE conname = 'FK_168bf21b341e2ae340748e2541d'
                ) THEN
                    ALTER TABLE "posts"
                    ADD CONSTRAINT "FK_168bf21b341e2ae340748e2541d"
                    FOREIGN KEY ("userId")
                    REFERENCES "users"("id")
                    ON DELETE NO ACTION
                    ON UPDATE NO ACTION;
                END IF;
            END $$;
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remove foreign key constraint
    await queryRunner.query(
      `ALTER TABLE "posts" DROP CONSTRAINT IF EXISTS "FK_168bf21b341e2ae340748e2541d"`,
    );

    // Drop tables (order matters due to dependencies)
    await queryRunner.query(`DROP TABLE IF EXISTS "posts"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "categories"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "users"`);
  }
}
