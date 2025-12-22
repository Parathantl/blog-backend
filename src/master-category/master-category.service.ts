import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MasterCategory } from './entities/master-category.entity';
import { CreateMasterCategoryDto } from './dto/create-master-category.dto';
import { UpdateMasterCategoryDto } from './dto/update-master-category.dto';

@Injectable()
export class MasterCategoryService {
  constructor(
    @InjectRepository(MasterCategory)
    private readonly masterCategoryRepository: Repository<MasterCategory>,
  ) {}

  async create(
    createMasterCategoryDto: CreateMasterCategoryDto,
  ): Promise<MasterCategory> {
    const masterCategory = this.masterCategoryRepository.create(
      createMasterCategoryDto,
    );
    return await this.masterCategoryRepository.save(masterCategory);
  }

  async findAll(): Promise<MasterCategory[]> {
    return await this.masterCategoryRepository.find({
      relations: ['categories'],
      order: { displayOrder: 'ASC' },
    });
  }

  async findOne(id: number): Promise<MasterCategory> {
    const masterCategory = await this.masterCategoryRepository.findOne({
      where: { id },
      relations: ['categories'],
    });

    if (!masterCategory) {
      throw new NotFoundException(`Master category with ID ${id} not found`);
    }

    return masterCategory;
  }

  async findBySlug(slug: string): Promise<MasterCategory> {
    const masterCategory = await this.masterCategoryRepository.findOne({
      where: { slug },
      relations: ['categories'],
    });

    if (!masterCategory) {
      throw new NotFoundException(
        `Master category with slug ${slug} not found`,
      );
    }

    return masterCategory;
  }

  async update(
    id: number,
    updateMasterCategoryDto: UpdateMasterCategoryDto,
  ): Promise<MasterCategory> {
    const masterCategory = await this.findOne(id);
    Object.assign(masterCategory, updateMasterCategoryDto);
    return await this.masterCategoryRepository.save(masterCategory);
  }

  async remove(id: number): Promise<void> {
    const masterCategory = await this.findOne(id);
    await this.masterCategoryRepository.remove(masterCategory);
  }
}
