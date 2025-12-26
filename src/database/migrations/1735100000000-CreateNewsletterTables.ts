import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateNewsletterTables1735100000000 implements MigrationInterface {
  name = 'CreateNewsletterTables1735100000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create newsletter_subscribers table
    await queryRunner.query(`
      CREATE TABLE "newsletter_subscribers" (
        "id" SERIAL NOT NULL,
        "email" character varying NOT NULL,
        "preference_token" character varying NOT NULL,
        "is_verified" boolean NOT NULL DEFAULT false,
        "verification_token" character varying,
        "verification_expires_at" TIMESTAMP,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_newsletter_subscribers_email" UNIQUE ("email"),
        CONSTRAINT "UQ_newsletter_subscribers_preference_token" UNIQUE ("preference_token"),
        CONSTRAINT "PK_newsletter_subscribers" PRIMARY KEY ("id")
      )
    `);

    // Create newsletter_subscriber_categories junction table
    await queryRunner.query(`
      CREATE TABLE "newsletter_subscriber_categories" (
        "subscriber_id" integer NOT NULL,
        "master_category_id" integer NOT NULL,
        CONSTRAINT "PK_newsletter_subscriber_categories" PRIMARY KEY ("subscriber_id", "master_category_id")
      )
    `);

    // Create index on newsletter_subscriber_categories
    await queryRunner.query(`
      CREATE INDEX "IDX_newsletter_subscriber_categories_subscriber"
      ON "newsletter_subscriber_categories" ("subscriber_id")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_newsletter_subscriber_categories_master_category"
      ON "newsletter_subscriber_categories" ("master_category_id")
    `);

    // Add foreign key constraints
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

    // Create index on email for faster lookups
    await queryRunner.query(`
      CREATE INDEX "IDX_newsletter_subscribers_email"
      ON "newsletter_subscribers" ("email")
    `);

    // Create index on preference_token for faster lookups
    await queryRunner.query(`
      CREATE INDEX "IDX_newsletter_subscribers_preference_token"
      ON "newsletter_subscribers" ("preference_token")
    `);

    // Create index on verification_token for faster lookups
    await queryRunner.query(`
      CREATE INDEX "IDX_newsletter_subscribers_verification_token"
      ON "newsletter_subscribers" ("verification_token")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop foreign key constraints
    await queryRunner.query(`
      ALTER TABLE "newsletter_subscriber_categories"
      DROP CONSTRAINT "FK_newsletter_subscriber_categories_master_category"
    `);

    await queryRunner.query(`
      ALTER TABLE "newsletter_subscriber_categories"
      DROP CONSTRAINT "FK_newsletter_subscriber_categories_subscriber"
    `);

    // Drop indexes
    await queryRunner.query(`
      DROP INDEX "IDX_newsletter_subscribers_verification_token"
    `);

    await queryRunner.query(`
      DROP INDEX "IDX_newsletter_subscribers_preference_token"
    `);

    await queryRunner.query(`
      DROP INDEX "IDX_newsletter_subscribers_email"
    `);

    await queryRunner.query(`
      DROP INDEX "IDX_newsletter_subscriber_categories_master_category"
    `);

    await queryRunner.query(`
      DROP INDEX "IDX_newsletter_subscriber_categories_subscriber"
    `);

    // Drop tables
    await queryRunner.query(`DROP TABLE "newsletter_subscriber_categories"`);
    await queryRunner.query(`DROP TABLE "newsletter_subscribers"`);
  }
}
