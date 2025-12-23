import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateNewsletterTables1735100000000 implements MigrationInterface {
  name = 'CreateNewsletterTables1735100000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create newsletter_subscribers table
    await queryRunner.query(`
      CREATE TABLE "newsletter_subscribers" (
        "id" SERIAL NOT NULL,
        "email" character varying NOT NULL,
        "isVerified" boolean NOT NULL DEFAULT false,
        "verificationToken" character varying,
        "verificationTokenExpiry" TIMESTAMP,
        "verifiedAt" TIMESTAMP,
        "isActive" boolean NOT NULL DEFAULT false,
        "subscribedAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_newsletter_subscribers_email" UNIQUE ("email"),
        CONSTRAINT "PK_newsletter_subscribers" PRIMARY KEY ("id")
      )
    `);

    // Create subscriber_master_categories junction table
    await queryRunner.query(`
      CREATE TABLE "subscriber_master_categories" (
        "subscriber_id" integer NOT NULL,
        "master_category_id" integer NOT NULL,
        CONSTRAINT "PK_subscriber_master_categories" PRIMARY KEY ("subscriber_id", "master_category_id")
      )
    `);

    // Create index on subscriber_master_categories
    await queryRunner.query(`
      CREATE INDEX "IDX_subscriber_master_categories_subscriber"
      ON "subscriber_master_categories" ("subscriber_id")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_subscriber_master_categories_master_category"
      ON "subscriber_master_categories" ("master_category_id")
    `);

    // Add foreign key constraints
    await queryRunner.query(`
      ALTER TABLE "subscriber_master_categories"
      ADD CONSTRAINT "FK_subscriber_master_categories_subscriber"
      FOREIGN KEY ("subscriber_id")
      REFERENCES "newsletter_subscribers"("id")
      ON DELETE CASCADE
      ON UPDATE CASCADE
    `);

    await queryRunner.query(`
      ALTER TABLE "subscriber_master_categories"
      ADD CONSTRAINT "FK_subscriber_master_categories_master_category"
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

    // Create index on isActive for filtering active subscribers
    await queryRunner.query(`
      CREATE INDEX "IDX_newsletter_subscribers_isActive"
      ON "newsletter_subscribers" ("isActive")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop foreign key constraints
    await queryRunner.query(`
      ALTER TABLE "subscriber_master_categories"
      DROP CONSTRAINT "FK_subscriber_master_categories_master_category"
    `);

    await queryRunner.query(`
      ALTER TABLE "subscriber_master_categories"
      DROP CONSTRAINT "FK_subscriber_master_categories_subscriber"
    `);

    // Drop indexes
    await queryRunner.query(`
      DROP INDEX "IDX_subscriber_master_categories_master_category"
    `);

    await queryRunner.query(`
      DROP INDEX "IDX_subscriber_master_categories_subscriber"
    `);

    await queryRunner.query(`
      DROP INDEX "IDX_newsletter_subscribers_isActive"
    `);

    await queryRunner.query(`
      DROP INDEX "IDX_newsletter_subscribers_email"
    `);

    // Drop tables
    await queryRunner.query(`DROP TABLE "subscriber_master_categories"`);
    await queryRunner.query(`DROP TABLE "newsletter_subscribers"`);
  }
}
