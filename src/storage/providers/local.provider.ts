import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Express } from 'express';
import { IStorageProvider, UploadResult } from '../storage.interface';
import * as fs from 'fs';
import * as path from 'path';
import * as sharp from 'sharp';

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
    const fileExt = file.originalname.split('.').pop()?.toLowerCase();
    const baseName = file.originalname.split('.')[0];
    const filename = `${baseName}-${Date.now()}.${fileExt}`;
    const folderPath = folder
      ? path.join(this.uploadDir, folder)
      : this.uploadDir;

    // Create folder if it doesn't exist
    if (!fs.existsSync(folderPath)) {
      fs.mkdirSync(folderPath, { recursive: true });
    }

    const filePath = path.join(folderPath, filename);

    // Optimize and compress image using sharp
    let optimizedBuffer: Buffer;
    let finalSize: number;

    try {
      const image = sharp(file.buffer);

      // Resize if image is too large (max width: 1920px, maintains aspect ratio)
      let processedImage = image.resize(1920, null, {
        withoutEnlargement: true, // Don't enlarge smaller images
        fit: 'inside',
      });

      // Compress based on format
      if (fileExt === 'jpg' || fileExt === 'jpeg') {
        processedImage = processedImage.jpeg({
          quality: 85,
          progressive: true,
        });
      } else if (fileExt === 'png') {
        processedImage = processedImage.png({
          quality: 85,
          compressionLevel: 9,
        });
      } else if (fileExt === 'webp') {
        processedImage = processedImage.webp({ quality: 85 });
      }

      optimizedBuffer = await processedImage.toBuffer();
      finalSize = optimizedBuffer.length;

      // Write optimized file to disk
      fs.writeFileSync(filePath, optimizedBuffer);

      // Log compression stats
      const compressionRatio = ((1 - finalSize / file.size) * 100).toFixed(1);
      console.log(
        `📸 Image optimized: ${file.originalname} | Original: ${(file.size / 1024).toFixed(1)}KB → Optimized: ${(finalSize / 1024).toFixed(1)}KB | Saved: ${compressionRatio}%`,
      );
    } catch (error) {
      // If sharp fails (non-image file), save original
      console.warn(
        'Sharp processing failed, saving original file:',
        error.message,
      );
      fs.writeFileSync(filePath, file.buffer);
      finalSize = file.size;
    }

    const appUrl = this.configService.get<string>(
      'APP_URL',
      'http://localhost:3001',
    );
    const relativePath = folder ? `${folder}/${filename}` : filename;

    return {
      url: `${appUrl}/uploads/${relativePath}`,
      publicId: relativePath,
      filename: file.originalname,
      size: finalSize,
      format: fileExt || 'unknown',
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
