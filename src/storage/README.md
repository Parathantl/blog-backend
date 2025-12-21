# Storage Module

A modular, provider-agnostic storage service for file uploads. Easily switch between different storage providers (Local, Cloudinary, S3, Backblaze, etc.) by changing a single environment variable.

## Architecture

```
storage/
├── storage.interface.ts      # Interface all providers must implement
├── storage.service.ts         # Main service used by controllers
├── storage.module.ts          # Module configuration
└── providers/
    ├── cloudinary.provider.ts # Cloudinary implementation
    ├── local.provider.ts      # Local disk storage
    └── [future providers]     # S3, Backblaze, etc.
```

## How It Works

1. **Interface** (`IStorageProvider`): Defines the contract all providers must follow
2. **Providers**: Implement the interface for specific storage solutions
3. **Service**: Wrapper that uses the configured provider
4. **Module**: Factory that creates the right provider based on config

## Usage

### In Controllers

```typescript
import { StorageService } from '../storage/storage.service';

@Controller('post')
export class PostController {
  constructor(private readonly storageService: StorageService) {}

  @Post('upload-photo')
  async uploadPhoto(@UploadedFile() file: Express.Multer.File) {
    // Upload to configured provider (Cloudinary, S3, Local, etc.)
    const result = await this.storageService.uploadFile(file, 'blog');

    return {
      filePath: result.url,
      publicId: result.publicId,
    };
  }

  @Delete('photo/:publicId')
  async deletePhoto(@Param('publicId') publicId: string) {
    const deleted = await this.storageService.deleteFile(publicId);
    return { success: deleted };
  }
}
```

### Import in Module

```typescript
import { StorageModule } from '../storage/storage.module';

@Module({
  imports: [StorageModule],
  // ...
})
export class PostModule {}
```

## Configuration

### Environment Variables

```env
# Storage Provider Selection
STORAGE_PROVIDER=cloudinary  # Options: local, cloudinary, s3, backblaze

# Cloudinary (if using cloudinary)
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# AWS S3 (if using s3)
# AWS_REGION=us-east-1
# AWS_ACCESS_KEY_ID=your-access-key
# AWS_SECRET_ACCESS_KEY=your-secret-key
# AWS_S3_BUCKET=your-bucket-name

# Backblaze B2 (if using backblaze)
# B2_APPLICATION_KEY_ID=your-key-id
# B2_APPLICATION_KEY=your-application-key
# B2_BUCKET_ID=your-bucket-id
# B2_BUCKET_NAME=your-bucket-name
```

## Available Providers

### 1. Local Storage (Development)
- **Provider**: `local`
- **Storage**: `./uploads` directory
- **URLs**: `http://localhost:3001/uploads/filename.jpg`
- **Use for**: Development, testing
- **Pros**: Simple, no external dependencies
- **Cons**: Files lost on Railway redeploy, not suitable for production

### 2. Cloudinary (Recommended for Production)
- **Provider**: `cloudinary`
- **Storage**: Cloudinary cloud
- **URLs**: `https://res.cloudinary.com/cloud-name/image/upload/...`
- **Use for**: Production, blogs, portfolios
- **Free Tier**: 10GB storage, 20GB bandwidth/month
- **Pros**:
  - Free tier is generous
  - Automatic image optimization
  - CDN included
  - Format conversion (WebP, AVIF)
  - URL-based transformations
- **Cons**: Vendor lock-in (but easy to migrate with this architecture)

### 3. AWS S3 (Coming Soon)
- **Provider**: `s3`
- **Storage**: AWS S3 bucket
- **Use for**: Enterprise, high traffic
- **Cost**: Pay per use (~$1-5/month for small sites)
- **Pros**: Industry standard, scalable, reliable
- **Cons**: More expensive than alternatives

### 4. Backblaze B2 (Coming Soon)
- **Provider**: `backblaze`
- **Storage**: Backblaze B2
- **Free Tier**: 10GB storage, 30GB bandwidth/month
- **Cost**: 1/5 the price of S3
- **Pros**: Cheapest option, S3-compatible API
- **Cons**: Less features than Cloudinary

## Adding New Providers

To add a new storage provider (e.g., S3):

### Step 1: Create Provider Class

Create `src/storage/providers/s3.provider.ts`:

```typescript
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3 } from '@aws-sdk/client-s3';
import { IStorageProvider, UploadResult } from '../storage.interface';

@Injectable()
export class S3Provider implements IStorageProvider {
  private s3Client: S3;

  constructor(private configService: ConfigService) {
    this.s3Client = new S3({
      region: configService.get('AWS_REGION'),
      credentials: {
        accessKeyId: configService.get('AWS_ACCESS_KEY_ID'),
        secretAccessKey: configService.get('AWS_SECRET_ACCESS_KEY'),
      },
    });
  }

  async uploadFile(file: Express.Multer.File, folder?: string): Promise<UploadResult> {
    // Implement S3 upload logic
  }

  async deleteFile(publicId: string): Promise<boolean> {
    // Implement S3 delete logic
  }

  getFileUrl(publicId: string): string {
    // Return S3 URL
  }
}
```

### Step 2: Register in Module

Update `src/storage/storage.module.ts`:

```typescript
import { S3Provider } from './providers/s3.provider';

@Module({
  providers: [
    {
      provide: 'STORAGE_PROVIDER',
      useFactory: (configService: ConfigService) => {
        const provider = configService.get('STORAGE_PROVIDER', 'local');

        switch (provider) {
          case 'cloudinary':
            return new CloudinaryProvider(configService);
          case 's3':
            return new S3Provider(configService);  // Add this
          case 'local':
          default:
            return new LocalStorageProvider(configService);
        }
      },
      inject: [ConfigService],
    },
    StorageService,
  ],
})
```

### Step 3: Update Environment

Add to `.env.example`:

```env
# AWS S3 Configuration
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_S3_BUCKET=your-bucket-name
```

### Step 4: Switch Provider

Change in `.env`:

```env
STORAGE_PROVIDER=s3
```

That's it! No controller changes needed.

## API Reference

### `StorageService.uploadFile(file, folder?)`

Upload a file to the configured storage provider.

**Parameters:**
- `file: Express.Multer.File` - The file to upload
- `folder?: string` - Optional folder/path for organization

**Returns:** `Promise<UploadResult>`

```typescript
{
  url: string;         // Public URL to access the file
  publicId?: string;   // Provider-specific identifier
  filename: string;    // Original filename
  size: number;        // File size in bytes
  format: string;      // File format (jpg, png, etc.)
}
```

### `StorageService.deleteFile(publicId)`

Delete a file from storage.

**Parameters:**
- `publicId: string` - The file identifier (URL or provider ID)

**Returns:** `Promise<boolean>` - Success status

### `StorageService.getFileUrl(publicId)`

Get the public URL for a file.

**Parameters:**
- `publicId: string` - The file identifier

**Returns:** `string` - The public URL

## Switching Providers

### Development → Production

**Local development:**
```env
STORAGE_PROVIDER=local
```

**Production on Railway:**
```env
STORAGE_PROVIDER=cloudinary
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```

### Migrating Between Providers

1. **Set up new provider** with environment variables
2. **Change `STORAGE_PROVIDER`** to new provider
3. **Redeploy**
4. **Migrate existing files** (optional):
   - Download from old provider
   - Upload to new provider
   - Update database URLs (if needed)

## Best Practices

1. **Use folders** to organize files:
   ```typescript
   await storageService.uploadFile(file, 'blog/posts');
   await storageService.uploadFile(file, 'blog/avatars');
   await storageService.uploadFile(file, 'portfolio/projects');
   ```

2. **Store publicId** in database for deletion:
   ```typescript
   const result = await storageService.uploadFile(file);
   post.imageUrl = result.url;
   post.imagePublicId = result.publicId; // Store this!
   ```

3. **Clean up on delete**:
   ```typescript
   // Delete post
   await postService.remove(id);
   // Also delete associated file
   await storageService.deleteFile(post.imagePublicId);
   ```

4. **Use local for development**, cloud for production:
   - Faster development
   - No quota concerns
   - Easy testing

## Troubleshooting

### "STORAGE_PROVIDER not found"
- Check `.env` file has `STORAGE_PROVIDER` set
- Restart your server after changing `.env`

### "Failed to upload file"
- Check provider credentials are correct
- Check file size limits
- Check file format is allowed
- Check provider quotas

### Images not loading in production
- Verify `STORAGE_PROVIDER=cloudinary` in Railway
- Check Cloudinary credentials in Railway variables
- Check browser network tab for actual error

## Future Providers to Add

- [ ] AWS S3
- [ ] Backblaze B2
- [ ] DigitalOcean Spaces
- [ ] Azure Blob Storage
- [ ] Google Cloud Storage
- [ ] Supabase Storage

## Migration Guide

See `CLOUDINARY_SETUP.md` for detailed Cloudinary setup instructions.
