import { Module } from '@nestjs/common';
import { CategoryService } from './category.service';
import { CategoryController } from './category.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Category } from './entities/category.entity';

@Module({
  controllers: [CategoryController],
  providers: [CategoryService],
<<<<<<< HEAD
  imports: [TypeOrmModule.forFeature([Category])],
=======
  imports: [
    TypeOrmModule.forFeature([Category])
  ]
>>>>>>> 7918796 (feat: initial implementation for blog backend)
})
export class CategoryModule {}
