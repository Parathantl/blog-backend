import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { StorageService } from './storage.service';
import { CloudinaryProvider } from './providers/cloudinary.provider';
import { LocalStorageProvider } from './providers/local.provider';

@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: 'STORAGE_PROVIDER',
      useFactory: (configService: ConfigService) => {
        const storageProvider = configService.get<string>(
          'STORAGE_PROVIDER',
          'local',
        );

        switch (storageProvider) {
          case 'cloudinary':
            return new CloudinaryProvider(configService);
          case 'local':
          default:
            return new LocalStorageProvider(configService);
          // Easy to add more providers:
          // case 's3':
          //   return new S3Provider(configService);
          // case 'backblaze':
          //   return new BackblazeProvider(configService);
        }
      },
      inject: [ConfigService],
    },
    StorageService,
  ],
  exports: [StorageService],
})
export class StorageModule {}
