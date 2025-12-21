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

        if (databaseUrl) {
          // Check if this is a local Docker/development connection
          const isLocalDb = databaseUrl.includes('localhost') ||
                           databaseUrl.includes('@postgres:') ||
                           databaseUrl.includes('127.0.0.1');

          return {
            type: 'postgres',
            url: databaseUrl,
            entities: [__dirname + '/../**/*.entity{.ts,.js}'],
            synchronize: config.get<boolean>('DB_SYNCHRONIZE', false),
            ssl: isLocalDb ? false : {
              rejectUnauthorized: false, // Railway requires this
            },
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
            synchronize: config.get<boolean>('DB_SYNCHRONIZE', false),
            ssl: false, // Disable SSL for local development
          };
        }
      },
      inject: [ConfigService],
    }),
  ],
})
export class DatabaseModule {}
