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
  Res,
} from '@nestjs/common';
import { PostService } from './post.service';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { Request, Response } from 'express';
import { User } from 'src/auth/entities/user.entity';
import { AuthGuard } from '@nestjs/passport';
// import { CurrentUser } from 'src/auth/user-decorator';
import { CurrentUserGuard } from 'src/auth/current-user-guard';
import { Express } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { ConfigService } from '@nestjs/config';

@Controller('post')
export class PostController {
  constructor(
    private readonly postService: PostService,
    private readonly configService: ConfigService,
  ) {}

  buildFilePath(file: any): string {
    const appUrl = this.configService.get<string>('APP_URL');
    return `${appUrl}/post/images/${file.filename}`;
  }

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
      storage: diskStorage({
        destination: './uploads',
        filename: (req, file, cb) => {
          const filename: string = file.originalname.split('.')[0];
          const fileExtension = file.originalname.split('.')[1];
          const newFilename = `${filename}-${Date.now()}.${fileExtension}`;
          cb(null, newFilename);
        },
      }),
      fileFilter: (req, file, cb) => {
        if (!file.originalname.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
          return cb(new BadRequestException('Only image files (jpg, jpeg, png, gif, webp) are allowed'), false);
        }
        cb(null, true);
      },
      limits: {
        fileSize: 5 * 1024 * 1024, // 5MB max file size
      },
    }),
  )
  uploadPhoto(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('Please upload a file');
    } else {
      const response = {
        filePath: this.buildFilePath(file),
      };
      return response;
    }
  }

  @Get('images/:filename')
  async getImage(@Param('filename') filename: string, @Res() res: Response) {
    res.sendFile(filename, { root: './uploads' });
  }

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
