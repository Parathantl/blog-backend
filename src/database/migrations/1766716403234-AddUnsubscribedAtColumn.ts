import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUnsubscribedAtColumn1766716403234
  implements MigrationInterface
{
  name = 'AddUnsubscribedAtColumn1766716403234';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Check if column exists before adding it (idempotent migration)
    const hasColumn = await queryRunner.query(`
            SELECT column_name
            FROM information_schema.columns
            WHERE table_name = 'newsletter_subscribers'
            AND column_name = 'unsubscribed_at'
        `);

    if (hasColumn.length === 0) {
      // Add unsubscribed_at column to track when users unsubscribe
      await queryRunner.query(`
                ALTER TABLE "newsletter_subscribers"
                ADD COLUMN "unsubscribed_at" TIMESTAMP DEFAULT NULL
            `);
    }

    // Check if index exists before creating it
    const hasIndex = await queryRunner.query(`
            SELECT indexname
            FROM pg_indexes
            WHERE tablename = 'newsletter_subscribers'
            AND indexname = 'IDX_newsletter_subscribers_unsubscribed_at'
        `);

    if (hasIndex.length === 0) {
      // Create index on unsubscribed_at for faster filtering
      await queryRunner.query(`
                CREATE INDEX "IDX_newsletter_subscribers_unsubscribed_at"
                ON "newsletter_subscribers" ("unsubscribed_at")
            `);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop index
    await queryRunner.query(`
            DROP INDEX "IDX_newsletter_subscribers_unsubscribed_at"
        `);

    // Drop column
    await queryRunner.query(`
            ALTER TABLE "newsletter_subscribers"
            DROP COLUMN "unsubscribed_at"
        `);
  }
}
