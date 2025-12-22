import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreatePortfolioAndAuthTables1734950000000
  implements MigrationInterface
{
  name = 'CreatePortfolioAndAuthTables1734950000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create projects table
    await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "projects" (
                "id" SERIAL NOT NULL,
                "title" character varying NOT NULL,
                "description" text NOT NULL,
                "longDescription" text NOT NULL,
                "technologies" text NOT NULL,
                "projectUrl" character varying,
                "githubUrl" character varying,
                "imageUrl" character varying,
                "galleryImages" text,
                "startDate" TIMESTAMP NOT NULL,
                "endDate" TIMESTAMP,
                "featured" boolean NOT NULL DEFAULT true,
                "displayOrder" integer NOT NULL DEFAULT '1',
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_projects" PRIMARY KEY ("id")
            )
        `);

    // Create skills table
    await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "skills" (
                "id" SERIAL NOT NULL,
                "name" character varying NOT NULL,
                "category" character varying NOT NULL,
                "proficiencyLevel" integer NOT NULL DEFAULT '50',
                "iconUrl" character varying,
                "displayOrder" integer NOT NULL DEFAULT '1',
                "isVisible" boolean NOT NULL DEFAULT true,
                CONSTRAINT "PK_skills" PRIMARY KEY ("id")
            )
        `);

    // Create experiences table
    await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "experiences" (
                "id" SERIAL NOT NULL,
                "company" character varying NOT NULL,
                "position" character varying NOT NULL,
                "description" text NOT NULL,
                "responsibilities" text NOT NULL,
                "technologies" text,
                "startDate" date NOT NULL,
                "endDate" date,
                "isCurrent" boolean NOT NULL DEFAULT false,
                "location" character varying,
                "companyUrl" character varying,
                "displayOrder" integer NOT NULL DEFAULT '1',
                CONSTRAINT "PK_experiences" PRIMARY KEY ("id")
            )
        `);

    // Create about table
    await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "about" (
                "id" SERIAL NOT NULL,
                "fullName" character varying NOT NULL,
                "tagline" character varying NOT NULL,
                "bio" text NOT NULL,
                "longBio" text NOT NULL,
                "profileImageUrl" character varying,
                "resumeUrl" character varying,
                "linkedinUrl" character varying,
                "githubUrl" character varying,
                "twitterUrl" character varying,
                "email" character varying,
                "phone" character varying,
                "location" character varying,
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_about" PRIMARY KEY ("id")
            )
        `);

    // Create contact_messages table
    await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "contact_messages" (
                "id" SERIAL NOT NULL,
                "name" character varying NOT NULL,
                "email" character varying NOT NULL,
                "subject" character varying,
                "message" text NOT NULL,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "isRead" boolean NOT NULL DEFAULT false,
                "isArchived" boolean NOT NULL DEFAULT false,
                CONSTRAINT "PK_contact_messages" PRIMARY KEY ("id")
            )
        `);

    // Create password_reset table
    await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "password_reset" (
                "id" SERIAL NOT NULL,
                "token" character varying NOT NULL,
                "userId" integer NOT NULL,
                "used" boolean NOT NULL DEFAULT false,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "expiresAt" TIMESTAMP NOT NULL,
                CONSTRAINT "PK_password_reset" PRIMARY KEY ("id")
            )
        `);

    // Add foreign key constraint for password_reset to users
    await queryRunner.query(`
            DO $$
            BEGIN
                IF NOT EXISTS (
                    SELECT 1 FROM pg_constraint WHERE conname = 'FK_password_reset_user'
                ) THEN
                    ALTER TABLE "password_reset"
                    ADD CONSTRAINT "FK_password_reset_user"
                    FOREIGN KEY ("userId")
                    REFERENCES "users"("id")
                    ON DELETE CASCADE
                    ON UPDATE NO ACTION;
                END IF;
            END $$;
        `);

    // Create index on password_reset token for faster lookups
    await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS "IDX_password_reset_token" ON "password_reset" ("token")
        `);

    // Create index on password_reset expiresAt for cleanup queries
    await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS "IDX_password_reset_expires" ON "password_reset" ("expiresAt")
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop indexes
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_password_reset_expires"`,
    );
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_password_reset_token"`);

    // Remove foreign key constraint
    await queryRunner.query(
      `ALTER TABLE "password_reset" DROP CONSTRAINT IF EXISTS "FK_password_reset_user"`,
    );

    // Drop tables
    await queryRunner.query(`DROP TABLE IF EXISTS "password_reset"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "contact_messages"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "about"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "experiences"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "skills"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "projects"`);
  }
}
