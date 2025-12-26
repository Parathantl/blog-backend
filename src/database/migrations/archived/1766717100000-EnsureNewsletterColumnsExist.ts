import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class EnsureNewsletterColumnsExist1766717100000
  implements MigrationInterface
{
  name = 'EnsureNewsletterColumnsExist1766717100000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Check if table exists first
    const tableExists = await queryRunner.hasTable('newsletter_subscribers');

    if (!tableExists) {
      // Create the entire table if it doesn't exist
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

      // Create indexes
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
    } else {
      // Table exists, check and add missing columns
      const table = await queryRunner.getTable('newsletter_subscribers');

      // Check and add preference_token
      if (!table.findColumnByName('preference_token')) {
        await queryRunner.addColumn(
          'newsletter_subscribers',
          new TableColumn({
            name: 'preference_token',
            type: 'character varying',
            isNullable: true, // Temporarily nullable for existing rows
          }),
        );

        // Generate preference tokens for existing rows
        await queryRunner.query(`
          UPDATE "newsletter_subscribers"
          SET "preference_token" = gen_random_uuid()::text
          WHERE "preference_token" IS NULL
        `);

        // Make it NOT NULL and UNIQUE
        await queryRunner.query(`
          ALTER TABLE "newsletter_subscribers"
          ALTER COLUMN "preference_token" SET NOT NULL
        `);

        await queryRunner.query(`
          ALTER TABLE "newsletter_subscribers"
          ADD CONSTRAINT "UQ_newsletter_subscribers_preference_token" UNIQUE ("preference_token")
        `);

        await queryRunner.query(`
          CREATE INDEX "IDX_newsletter_subscribers_preference_token"
          ON "newsletter_subscribers" ("preference_token")
        `);
      }

      // Check and add is_verified
      if (!table.findColumnByName('is_verified')) {
        await queryRunner.addColumn(
          'newsletter_subscribers',
          new TableColumn({
            name: 'is_verified',
            type: 'boolean',
            default: false,
            isNullable: false,
          }),
        );
      }

      // Check and add verification_token
      if (!table.findColumnByName('verification_token')) {
        await queryRunner.addColumn(
          'newsletter_subscribers',
          new TableColumn({
            name: 'verification_token',
            type: 'character varying',
            isNullable: true,
          }),
        );

        await queryRunner.query(`
          CREATE INDEX "IDX_newsletter_subscribers_verification_token"
          ON "newsletter_subscribers" ("verification_token")
        `);
      }

      // Check and add verification_expires_at
      if (!table.findColumnByName('verification_expires_at')) {
        await queryRunner.addColumn(
          'newsletter_subscribers',
          new TableColumn({
            name: 'verification_expires_at',
            type: 'TIMESTAMP',
            isNullable: true,
          }),
        );
      }

      // Check and add unsubscribed_at
      if (!table.findColumnByName('unsubscribed_at')) {
        await queryRunner.addColumn(
          'newsletter_subscribers',
          new TableColumn({
            name: 'unsubscribed_at',
            type: 'TIMESTAMP',
            isNullable: true,
          }),
        );

        await queryRunner.query(`
          CREATE INDEX "IDX_newsletter_subscribers_unsubscribed_at"
          ON "newsletter_subscribers" ("unsubscribed_at")
        `);
      }

      // Check and add created_at
      if (!table.findColumnByName('created_at')) {
        await queryRunner.addColumn(
          'newsletter_subscribers',
          new TableColumn({
            name: 'created_at',
            type: 'TIMESTAMP',
            default: 'now()',
            isNullable: false,
          }),
        );
      }

      // Check and add updated_at
      if (!table.findColumnByName('updated_at')) {
        await queryRunner.addColumn(
          'newsletter_subscribers',
          new TableColumn({
            name: 'updated_at',
            type: 'TIMESTAMP',
            default: 'now()',
            isNullable: false,
          }),
        );
      }
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // This migration is meant to fix missing columns, so down migration is minimal
    // We don't want to drop columns that might have been created by other migrations
  }
}
