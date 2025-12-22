import { MigrationInterface, QueryRunner } from 'typeorm';

export class GenerateSlugsForExistingPosts1735000000000
  implements MigrationInterface
{
  name = 'GenerateSlugsForExistingPosts1735000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Update posts that have empty or null slugs
    // Generate slug from title (first 20 chars, lowercase, replace spaces with underscores)
    await queryRunner.query(`
            UPDATE posts
            SET slug = LOWER(
                REPLACE(
                    REGEXP_REPLACE(
                        SUBSTRING(title, 1, 20),
                        '[^a-zA-Z0-9\\s]',
                        '',
                        'g'
                    ),
                    ' ',
                    '_'
                )
            )
            WHERE slug IS NULL OR slug = '' OR TRIM(slug) = ''
        `);

    // Make slug NOT NULL after ensuring all posts have slugs
    await queryRunner.query(`
            ALTER TABLE posts
            ALTER COLUMN slug SET NOT NULL
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Make slug nullable again
    await queryRunner.query(`
            ALTER TABLE posts
            ALTER COLUMN slug DROP NOT NULL
        `);
  }
}
