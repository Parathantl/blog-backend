import { Injectable } from '@nestjs/common';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { Category } from './entities/category.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Injectable()
export class CategoryService {
  constructor(
    @InjectRepository(Category) private readonly repo: Repository<Category>,
  ) {}

  async create(createCategoryDto: CreateCategoryDto) {
    const category = new Category();
    Object.assign(category, createCategoryDto);
    this.repo.create(category);
    return await this.repo.save(category);
  }

  async findAll() {
    return await this.repo.find({
      order: { displayOrder: 'ASC' },
    });
  }

  async findByType(type: string) {
    return await this.repo.find({
      where: { type },
      order: { displayOrder: 'ASC' },
    });
  }

  async findBySlug(slug: string) {
    return await this.repo.findOne({
      where: { slug },
    });
  }

  async findOne(id: number) {
    return await this.repo.findOne({
      where: { id },
    });
  }

  async update(id: number, updateCategoryDto: UpdateCategoryDto) {
    const category = await this.findOne(id);
    if (category) {
      Object.assign(category, updateCategoryDto);
      return await this.repo.save(category);
    }
    return null;
  }

  async remove(id: number) {
    const category = await this.findOne(id);
    if (category) {
      await this.repo.remove(category);
      return { success: true };
    }
    return { success: false };
  }

  async reorderCategories(categories: { id: number; displayOrder: number }[]) {
    // Update all categories in parallel
    const promises = categories.map(({ id, displayOrder }) =>
      this.repo.update(id, { displayOrder })
    );
    await Promise.all(promises);
    return { success: true };
  }
}
