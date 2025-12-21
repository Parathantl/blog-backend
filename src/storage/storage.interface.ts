import { Express } from 'express';

export interface UploadResult {
  url: string;
  publicId?: string;
  filename: string;
  size: number;
  format: string;
}

export interface IStorageProvider {
  /**
   * Upload a file to the storage provider
   * @param file - The file to upload
   * @param folder - Optional folder/path for organization
   * @returns Upload result with URL and metadata
   */
  uploadFile(file: Express.Multer.File, folder?: string): Promise<UploadResult>;

  /**
   * Delete a file from the storage provider
   * @param publicId - The file identifier (URL or public ID)
   * @returns Success boolean
   */
  deleteFile(publicId: string): Promise<boolean>;

  /**
   * Get the public URL for a file
   * @param publicId - The file identifier
   * @returns The public URL
   */
  getFileUrl(publicId: string): string;
}
