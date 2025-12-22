import { AppDataSource } from './data-source';

async function revertMigration() {
  try {
    console.log('🔄 Initializing database connection...');
    await AppDataSource.initialize();
    console.log('✅ Database connected');

    console.log('🔄 Reverting last migration...');
    await AppDataSource.undoLastMigration();
    console.log('✅ Migration reverted successfully');

    await AppDataSource.destroy();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error reverting migration:', error);
    await AppDataSource.destroy();
    process.exit(1);
  }
}

revertMigration();
