import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Express } from 'express';
import { IStorageProvider, UploadResult } from '../storage.interface';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class LocalStorageProvider implements IStorageProvider {
  private uploadDir = './uploads';

  constructor(private configService: ConfigService) {
    // Ensure upload directory exists
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
    }
  }

  async uploadFile(
    file: Express.Multer.File,
    folder: string = '',
  ): Promise<UploadResult> {
    const filename = `${file.originalname.split('.')[0]}-${Date.now()}.${file.originalname.split('.').pop()}`;
    const folderPath = folder
      ? path.join(this.uploadDir, folder)
      : this.uploadDir;

    // Create folder if it doesn't exist
    if (!fs.existsSync(folderPath)) {
      fs.mkdirSync(folderPath, { recursive: true });
    }

    const filePath = path.join(folderPath, filename);

    // Write file to disk
    fs.writeFileSync(filePath, file.buffer);

    const appUrl = this.configService.get<string>(
      'APP_URL',
      'http://localhost:3001',
    );
    const relativePath = folder ? `${folder}/${filename}` : filename;

    return {
      url: `${appUrl}/uploads/${relativePath}`,
      publicId: relativePath,
      filename: file.originalname,
      size: file.size,
      format: file.originalname.split('.').pop() || 'unknown',
    };
  }

  async deleteFile(publicId: string): Promise<boolean> {
    try {
      const filePath = path.join(this.uploadDir, publicId);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error deleting local file:', error);
      return false;
    }
  }

  getFileUrl(publicId: string): string {
    const appUrl = this.configService.get<string>(
      'APP_URL',
      'http://localhost:3001',
    );
    return `${appUrl}/uploads/${publicId}`;
  }
}
