import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MasterCategoryService } from './master-category.service';
import { MasterCategoryController } from './master-category.controller';
import { MasterCategory } from './entities/master-category.entity';

@Module({
  imports: [TypeOrmModule.forFeature([MasterCategory])],
  controllers: [MasterCategoryController],
  providers: [MasterCategoryService],
  exports: [MasterCategoryService],
})
export class MasterCategoryModule {}
