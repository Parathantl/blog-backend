import { Injectable } from '@nestjs/common';
import { CreateCategoryDto } from './dto/create-category.dto';
<<<<<<< HEAD
// import { UpdateCategoryDto } from './dto/update-category.dto';
=======
import { UpdateCategoryDto } from './dto/update-category.dto';
>>>>>>> 7918796 (feat: initial implementation for blog backend)
import { Category } from './entities/category.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Injectable()
export class CategoryService {
<<<<<<< HEAD
  constructor(
    @InjectRepository(Category) private readonly repo: Repository<Category>,
  ) {}
=======

  constructor(@InjectRepository(Category) private readonly repo: Repository<Category>) {

  }
>>>>>>> 7918796 (feat: initial implementation for blog backend)

  async create(createCategoryDto: CreateCategoryDto) {
    const category = new Category();
    Object.assign(category, createCategoryDto);
    this.repo.create(category);
    return await this.repo.save(category);
  }

  findAll() {
    return `This action returns all category`;
  }

  findOne(id: number) {
    return `This action returns a #${id} category`;
  }

  // update(id: number, updateCategoryDto: UpdateCategoryDto) {
  //   return `This action updates a #${id} category`;
  // }

  remove(id: number) {
    return `This action removes a #${id} category`;
  }
}
