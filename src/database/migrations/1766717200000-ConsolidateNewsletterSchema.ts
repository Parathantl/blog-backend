import { MigrationInterface, QueryRunner } from 'typeorm';

export class ConsolidateNewsletterSchema1766717200000
  implements MigrationInterface
{
  name = 'ConsolidateNewsletterSchema1766717200000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Step 1: Drop existing newsletter tables to start fresh
    await queryRunner.query(`DROP TABLE IF EXISTS "newsletter_subscriber_categories" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "newsletter_subscribers" CASCADE`);

    // Step 2: Create newsletter_subscribers table with ALL columns
    await queryRunner.query(`
      CREATE TABLE "newsletter_subscribers" (
        "id" SERIAL NOT NULL,
        "email" character varying NOT NULL,
        "preference_token" character varying NOT NULL,
        "is_verified" boolean NOT NULL DEFAULT false,
        "verification_token" character varying,
        "verification_expires_at" TIMESTAMP,
        "unsubscribed_at" TIMESTAMP,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_newsletter_subscribers_email" UNIQUE ("email"),
        CONSTRAINT "UQ_newsletter_subscribers_preference_token" UNIQUE ("preference_token"),
        CONSTRAINT "PK_newsletter_subscribers" PRIMARY KEY ("id")
      )
    `);

    // Step 3: Create indexes on newsletter_subscribers
    await queryRunner.query(`
      CREATE INDEX "IDX_newsletter_subscribers_email"
      ON "newsletter_subscribers" ("email")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_newsletter_subscribers_preference_token"
      ON "newsletter_subscribers" ("preference_token")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_newsletter_subscribers_verification_token"
      ON "newsletter_subscribers" ("verification_token")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_newsletter_subscribers_unsubscribed_at"
      ON "newsletter_subscribers" ("unsubscribed_at")
    `);

    // Step 4: Create newsletter_subscriber_categories junction table
    await queryRunner.query(`
      CREATE TABLE "newsletter_subscriber_categories" (
        "subscriber_id" integer NOT NULL,
        "master_category_id" integer NOT NULL,
        CONSTRAINT "PK_newsletter_subscriber_categories" PRIMARY KEY ("subscriber_id", "master_category_id")
      )
    `);

    // Step 5: Create indexes on junction table
    await queryRunner.query(`
      CREATE INDEX "IDX_newsletter_subscriber_categories_subscriber"
      ON "newsletter_subscriber_categories" ("subscriber_id")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_newsletter_subscriber_categories_master_category"
      ON "newsletter_subscriber_categories" ("master_category_id")
    `);

    // Step 6: Add foreign key constraints
    await queryRunner.query(`
      ALTER TABLE "newsletter_subscriber_categories"
      ADD CONSTRAINT "FK_newsletter_subscriber_categories_subscriber"
      FOREIGN KEY ("subscriber_id")
      REFERENCES "newsletter_subscribers"("id")
      ON DELETE CASCADE
      ON UPDATE CASCADE
    `);

    await queryRunner.query(`
      ALTER TABLE "newsletter_subscriber_categories"
      ADD CONSTRAINT "FK_newsletter_subscriber_categories_master_category"
      FOREIGN KEY ("master_category_id")
      REFERENCES "master_categories"("id")
      ON DELETE CASCADE
      ON UPDATE CASCADE
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "newsletter_subscriber_categories" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "newsletter_subscribers" CASCADE`);
  }
}
