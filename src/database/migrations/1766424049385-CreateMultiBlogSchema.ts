import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateMultiBlogSchema1766424049385 implements MigrationInterface {
  name = 'CreateMultiBlogSchema1766424049385';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create master_categories table
    await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "master_categories" (
                "id" SERIAL NOT NULL,
                "name" character varying NOT NULL,
                "slug" character varying NOT NULL,
                "description" character varying,
                "isActive" boolean NOT NULL DEFAULT true,
                "displayOrder" integer NOT NULL DEFAULT '1',
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "UQ_master_categories_name" UNIQUE ("name"),
                CONSTRAINT "PK_master_categories" PRIMARY KEY ("id")
            )
        `);

    // Add masterCategoryId to categories table if it doesn't exist
    await queryRunner.query(`
            ALTER TABLE "categories"
            ADD COLUMN IF NOT EXISTS "masterCategoryId" integer
        `);

    // Add timestamps to categories if they don't exist
    await queryRunner.query(`
            ALTER TABLE "categories"
            ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP DEFAULT now()
        `);

    await queryRunner.query(`
            ALTER TABLE "categories"
            ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP DEFAULT now()
        `);

    // Create post_categories junction table
    await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "post_categories" (
                "postId" integer NOT NULL,
                "categoryId" integer NOT NULL,
                CONSTRAINT "PK_post_categories" PRIMARY KEY ("postId", "categoryId")
            )
        `);

    // Add foreign key constraints
    await queryRunner.query(`
            DO $$
            BEGIN
                IF NOT EXISTS (
                    SELECT 1 FROM pg_constraint WHERE conname = 'FK_categories_master_category'
                ) THEN
                    ALTER TABLE "categories"
                    ADD CONSTRAINT "FK_categories_master_category"
                    FOREIGN KEY ("masterCategoryId")
                    REFERENCES "master_categories"("id")
                    ON DELETE SET NULL
                    ON UPDATE NO ACTION;
                END IF;
            END $$;
        `);

    await queryRunner.query(`
            DO $$
            BEGIN
                IF NOT EXISTS (
                    SELECT 1 FROM pg_constraint WHERE conname = 'FK_post_categories_post'
                ) THEN
                    ALTER TABLE "post_categories"
                    ADD CONSTRAINT "FK_post_categories_post"
                    FOREIGN KEY ("postId")
                    REFERENCES "posts"("id")
                    ON DELETE CASCADE
                    ON UPDATE CASCADE;
                END IF;
            END $$;
        `);

    await queryRunner.query(`
            DO $$
            BEGIN
                IF NOT EXISTS (
                    SELECT 1 FROM pg_constraint WHERE conname = 'FK_post_categories_category'
                ) THEN
                    ALTER TABLE "post_categories"
                    ADD CONSTRAINT "FK_post_categories_category"
                    FOREIGN KEY ("categoryId")
                    REFERENCES "categories"("id")
                    ON DELETE CASCADE
                    ON UPDATE CASCADE;
                END IF;
            END $$;
        `);

    // Seed master categories
    await queryRunner.query(`
            INSERT INTO "master_categories" ("name", "slug", "description", "isActive", "displayOrder")
            VALUES
                ('Tech', 'tech', 'Technical blog posts about programming, web development, and technology', true, 1),
                ('Tamil', 'tamil', 'Tamil language blog posts - தமிழில் எழுதப்பட்ட பதிவுகள்', true, 2)
            ON CONFLICT ("name") DO NOTHING
        `);

    // Migrate existing post-category relationships if categoryId exists in posts table
    await queryRunner.query(`
            DO $$
            BEGIN
                IF EXISTS (
                    SELECT 1 FROM information_schema.columns
                    WHERE table_name = 'posts' AND column_name = 'categoryId'
                ) THEN
                    INSERT INTO "post_categories" ("postId", "categoryId")
                    SELECT id, "categoryId"
                    FROM "posts"
                    WHERE "categoryId" IS NOT NULL
                    ON CONFLICT DO NOTHING;
                END IF;
            END $$;
        `);

    // Update existing categories to belong to Tech master category
    await queryRunner.query(`
            UPDATE "categories"
            SET "masterCategoryId" = (
                SELECT id FROM "master_categories" WHERE slug = 'tech' LIMIT 1
            )
            WHERE "masterCategoryId" IS NULL
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remove foreign key constraints
    await queryRunner.query(
      `ALTER TABLE "post_categories" DROP CONSTRAINT IF EXISTS "FK_post_categories_category"`,
    );
    await queryRunner.query(
      `ALTER TABLE "post_categories" DROP CONSTRAINT IF EXISTS "FK_post_categories_post"`,
    );
    await queryRunner.query(
      `ALTER TABLE "categories" DROP CONSTRAINT IF EXISTS "FK_categories_master_category"`,
    );

    // Drop tables
    await queryRunner.query(`DROP TABLE IF EXISTS "post_categories"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "master_categories"`);

    // Remove columns from categories
    await queryRunner.query(
      `ALTER TABLE "categories" DROP COLUMN IF EXISTS "masterCategoryId"`,
    );
    await queryRunner.query(
      `ALTER TABLE "categories" DROP COLUMN IF EXISTS "createdAt"`,
    );
    await queryRunner.query(
      `ALTER TABLE "categories" DROP COLUMN IF EXISTS "updatedAt"`,
    );
  }
}
