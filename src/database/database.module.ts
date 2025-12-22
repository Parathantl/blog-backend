import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (config: ConfigService) => {
        // Check if DATABASE_URL exists (for Railway/production)
        const databaseUrl = config.get<string>('DATABASE_URL');
        const isProduction = config.get<string>('NODE_ENV') === 'production';

        if (databaseUrl) {
          // Check if this is a local Docker/development connection
          const isLocalDb =
            databaseUrl.includes('localhost') ||
            databaseUrl.includes('@postgres:') ||
            databaseUrl.includes('127.0.0.1');

          return {
            type: 'postgres',
            url: databaseUrl,
            entities: [__dirname + '/../**/*.entity{.ts,.js}'],
            migrations: [__dirname + '/migrations/*{.ts,.js}'],
            // IMPORTANT: Only use synchronize in development, NEVER in production
            synchronize: isProduction
              ? false
              : config.get<boolean>('DB_SYNCHRONIZE', false),
            migrationsRun: isProduction, // Auto-run migrations in production
            ssl: isLocalDb
              ? false
              : {
                  rejectUnauthorized: false, // Railway requires this
                },
            logging: !isProduction,
          };
        } else {
          // Development: Use individual connection parameters
          return {
            type: 'postgres',
            host: config.get<string>('DB_HOST'),
            port: config.get<number>('DB_PORT'),
            username: config.get<string>('DB_USERNAME'),
            password: config.get<string>('DB_PASSWORD'),
            database: config.get<string>('DB_DATABASE'),
            entities: [__dirname + '/../**/*.entity{.ts,.js}'],
            migrations: [__dirname + '/migrations/*{.ts,.js}'],
            // IMPORTANT: Only use synchronize in development, NEVER in production
            synchronize: isProduction
              ? false
              : config.get<boolean>('DB_SYNCHRONIZE', false),
            migrationsRun: isProduction, // Auto-run migrations in production
            ssl: false, // Disable SSL for local development
            logging: !isProduction,
          };
        }
      },
      inject: [ConfigService],
    }),
  ],
})
export class DatabaseModule {}
