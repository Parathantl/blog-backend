import { Injectable, Inject } from '@nestjs/common';
import { IStorageProvider, UploadResult } from './storage.interface';
import { Express } from 'express';

@Injectable()
export class StorageService {
  constructor(
    @Inject('STORAGE_PROVIDER')
    private readonly storageProvider: IStorageProvider,
  ) {}

  async uploadFile(
    file: Express.Multer.File,
    folder?: string,
  ): Promise<UploadResult> {
    return this.storageProvider.uploadFile(file, folder);
  }

  async deleteFile(publicId: string): Promise<boolean> {
    return this.storageProvider.deleteFile(publicId);
  }

  getFileUrl(publicId: string): string {
    return this.storageProvider.getFileUrl(publicId);
  }
}
