import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableIndex,
  TableForeignKey,
} from 'typeorm';

export class FixNewsletterJunctionTable1766717000000
  implements MigrationInterface
{
  name = 'FixNewsletterJunctionTable1766717000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Check if table exists, create only if it doesn't
    const tableExists = await queryRunner.hasTable(
      'newsletter_subscriber_categories',
    );

    if (!tableExists) {
      // Create newsletter_subscriber_categories junction table
      await queryRunner.createTable(
        new Table({
          name: 'newsletter_subscriber_categories',
          columns: [
            {
              name: 'subscriber_id',
              type: 'integer',
              isNullable: false,
            },
            {
              name: 'master_category_id',
              type: 'integer',
              isNullable: false,
            },
          ],
        }),
        true,
      );

      // Add primary key constraint
      await queryRunner.createPrimaryKey('newsletter_subscriber_categories', [
        'subscriber_id',
        'master_category_id',
      ]);

      // Create indexes
      await queryRunner.createIndex(
        'newsletter_subscriber_categories',
        new TableIndex({
          name: 'IDX_newsletter_subscriber_categories_subscriber',
          columnNames: ['subscriber_id'],
        }),
      );

      await queryRunner.createIndex(
        'newsletter_subscriber_categories',
        new TableIndex({
          name: 'IDX_newsletter_subscriber_categories_master_category',
          columnNames: ['master_category_id'],
        }),
      );

      // Add foreign key constraints
      await queryRunner.createForeignKey(
        'newsletter_subscriber_categories',
        new TableForeignKey({
          name: 'FK_newsletter_subscriber_categories_subscriber',
          columnNames: ['subscriber_id'],
          referencedTableName: 'newsletter_subscribers',
          referencedColumnNames: ['id'],
          onDelete: 'CASCADE',
          onUpdate: 'CASCADE',
        }),
      );

      await queryRunner.createForeignKey(
        'newsletter_subscriber_categories',
        new TableForeignKey({
          name: 'FK_newsletter_subscriber_categories_master_category',
          columnNames: ['master_category_id'],
          referencedTableName: 'master_categories',
          referencedColumnNames: ['id'],
          onDelete: 'CASCADE',
          onUpdate: 'CASCADE',
        }),
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const tableExists = await queryRunner.hasTable(
      'newsletter_subscriber_categories',
    );

    if (tableExists) {
      // Drop foreign key constraints
      await queryRunner.dropForeignKey(
        'newsletter_subscriber_categories',
        'FK_newsletter_subscriber_categories_master_category',
      );

      await queryRunner.dropForeignKey(
        'newsletter_subscriber_categories',
        'FK_newsletter_subscriber_categories_subscriber',
      );

      // Drop indexes
      await queryRunner.dropIndex(
        'newsletter_subscriber_categories',
        'IDX_newsletter_subscriber_categories_master_category',
      );

      await queryRunner.dropIndex(
        'newsletter_subscriber_categories',
        'IDX_newsletter_subscriber_categories_subscriber',
      );

      // Drop table
      await queryRunner.dropTable('newsletter_subscriber_categories');
    }
  }
}
