import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { MasterCategoryService } from './master-category.service';
import { CreateMasterCategoryDto } from './dto/create-master-category.dto';
import { UpdateMasterCategoryDto } from './dto/update-master-category.dto';

@Controller('master-categories')
export class MasterCategoryController {
  constructor(private readonly masterCategoryService: MasterCategoryService) {}

  @Post()
  @UseGuards(AuthGuard('jwt'))
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  create(@Body() createMasterCategoryDto: CreateMasterCategoryDto) {
    return this.masterCategoryService.create(createMasterCategoryDto);
  }

  @Get()
  findAll() {
    return this.masterCategoryService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.masterCategoryService.findOne(+id);
  }

  @Get('slug/:slug')
  findBySlug(@Param('slug') slug: string) {
    return this.masterCategoryService.findBySlug(slug);
  }

  @Patch(':id')
  @UseGuards(AuthGuard('jwt'))
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  update(
    @Param('id') id: string,
    @Body() updateMasterCategoryDto: UpdateMasterCategoryDto,
  ) {
    return this.masterCategoryService.update(+id, updateMasterCategoryDto);
  }

  @Delete(':id')
  @UseGuards(AuthGuard('jwt'))
  remove(@Param('id') id: string) {
    return this.masterCategoryService.remove(+id);
  }
}
