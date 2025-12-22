import { DataSource, DataSourceOptions } from 'typeorm';
import { config } from 'dotenv';

// Load environment variables
config({
  path:
    process.env.NODE_ENV === 'production'
      ? '.env.production'
      : '.env.development',
});

// Determine database configuration
const databaseUrl = process.env.DATABASE_URL;

let dataSourceOptions: DataSourceOptions;

if (databaseUrl) {
  const isLocalDb =
    databaseUrl.includes('localhost') ||
    databaseUrl.includes('@postgres:') ||
    databaseUrl.includes('127.0.0.1');

  dataSourceOptions = {
    type: 'postgres',
    url: databaseUrl,
    entities: [__dirname + '/../**/*.entity{.ts,.js}'],
    migrations: [__dirname + '/migrations/*{.ts,.js}'],
    synchronize: false, // NEVER use synchronize in production
    ssl: isLocalDb
      ? false
      : {
          rejectUnauthorized: false,
        },
    logging: process.env.NODE_ENV !== 'production',
  };
} else {
  dataSourceOptions = {
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'password',
    database: process.env.DB_DATABASE || 'blog',
    entities: [__dirname + '/../**/*.entity{.ts,.js}'],
    migrations: [__dirname + '/migrations/*{.ts,.js}'],
    synchronize: false, // NEVER use synchronize in production
    ssl: false,
    logging: process.env.NODE_ENV !== 'production',
  };
}

// Create and export DataSource
export const AppDataSource = new DataSource(dataSourceOptions);
