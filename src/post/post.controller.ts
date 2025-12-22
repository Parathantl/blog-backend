import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UsePipes,
  UseInterceptors,
  ClassSerializerInterceptor,
  ValidationPipe,
  Req,
  Query,
  UseGuards,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { PostService } from './post.service';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { Request } from 'express';
import { User } from 'src/auth/entities/user.entity';
import { AuthGuard } from '@nestjs/passport';
// import { CurrentUser } from 'src/auth/user-decorator';
import { CurrentUserGuard } from 'src/auth/current-user-guard';
import { Express } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';
import { StorageService } from '../storage/storage.service';

@Controller('post')
export class PostController {
  constructor(
    private readonly postService: PostService,
    private readonly storageService: StorageService,
  ) {}

  @Post()
  @UsePipes(ValidationPipe)
  @UseGuards(AuthGuard('jwt')) // For Guard the routes
  create(
    @Body() createPostDto: CreatePostDto,
    @Req() req: Request,
    // @CurrentUser() user: User,
  ) {
    return this.postService.create(createPostDto, req.user as User);
  }

  @Get()
  @UseInterceptors(ClassSerializerInterceptor)
  @UseGuards(CurrentUserGuard)
  findAll(@Query() query: any) {
    return this.postService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.postService.findOne(+id);
  }

  @Get('/slug/:slug')
  findBySlug(@Param('slug') slug: string) {
    return this.postService.findBySlug(slug);
  }

  @Post('upload-photo')
  @UseInterceptors(
    FileInterceptor('file', {
      fileFilter: (req, file, cb) => {
        if (!file.originalname.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
          return cb(
            new BadRequestException(
              'Only image files (jpg, jpeg, png, gif, webp) are allowed',
            ),
            false,
          );
        }
        cb(null, true);
      },
      limits: {
        fileSize: 5 * 1024 * 1024, // 5MB max file size
      },
    }),
  )
  async uploadPhoto(
    @UploadedFile() file: Express.Multer.File,
    @Query('folder') folder?: string,
  ) {
    if (!file) {
      throw new BadRequestException('Please upload a file');
    }

    // Validate and sanitize folder name
    const allowedFolders = ['blog', 'posts', 'projects', 'profiles'];
    const uploadFolder = folder && allowedFolders.includes(folder) ? folder : 'blog';

    try {
      // Upload to configured storage provider (Cloudinary, S3, Local, etc.)
      const uploadResult = await this.storageService.uploadFile(file, uploadFolder);

      return {
        filePath: uploadResult.url,
        publicId: uploadResult.publicId,
        size: uploadResult.size,
        format: uploadResult.format,
      };
    } catch (error) {
      console.error('Upload error:', error);
      throw new BadRequestException('Failed to upload file');
    }
  }

  // Note: Images are now served directly from storage provider (Cloudinary, S3, etc.)
  // No need for local image serving endpoint

  @Patch(':slug')
  @UseGuards(AuthGuard('jwt')) // For Guard the routes
  update(@Param('slug') slug: string, @Body() updatePostDto: UpdatePostDto) {
    return this.postService.update(slug, updatePostDto);
  }

  @Delete(':id')
  @UseGuards(AuthGuard('jwt')) // For Guard the routes
  remove(@Param('id') id: string) {
    return this.postService.remove(+id);
  }
}
