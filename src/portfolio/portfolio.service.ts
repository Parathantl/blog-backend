import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Project } from './entities/project.entity';
import { Skill } from './entities/skill.entity';
import { Experience } from './entities/experience.entity';
import { About } from './entities/about.entity';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { CreateSkillDto } from './dto/create-skill.dto';
import { UpdateSkillDto } from './dto/update-skill.dto';
import { CreateExperienceDto } from './dto/create-experience.dto';
import { UpdateExperienceDto } from './dto/update-experience.dto';
import { UpdateAboutDto } from './dto/update-about.dto';

@Injectable()
export class PortfolioService {
  constructor(
    @InjectRepository(Project)
    private projectRepository: Repository<Project>,
    @InjectRepository(Skill)
    private skillRepository: Repository<Skill>,
    @InjectRepository(Experience)
    private experienceRepository: Repository<Experience>,
    @InjectRepository(About)
    private aboutRepository: Repository<About>,
  ) {}

  // Projects
  async createProject(createProjectDto: CreateProjectDto): Promise<Project> {
    const project = this.projectRepository.create(createProjectDto);
    return await this.projectRepository.save(project);
  }

  async findAllProjects(): Promise<Project[]> {
    return await this.projectRepository.find({
      order: { displayOrder: 'ASC', createdAt: 'DESC' },
    });
  }

  async findFeaturedProjects(): Promise<Project[]> {
    return await this.projectRepository.find({
      where: { featured: true },
      order: { displayOrder: 'ASC', createdAt: 'DESC' },
    });
  }

  async findOneProject(id: number): Promise<Project> {
    const project = await this.projectRepository.findOne({ where: { id } });
    if (!project) {
      throw new NotFoundException(`Project with ID ${id} not found`);
    }
    return project;
  }

  async updateProject(id: number, updateProjectDto: UpdateProjectDto): Promise<Project> {
    const project = await this.findOneProject(id);
    Object.assign(project, updateProjectDto);
    return await this.projectRepository.save(project);
  }

  async removeProject(id: number): Promise<void> {
    const project = await this.findOneProject(id);
    await this.projectRepository.remove(project);
  }

  // Skills
  async createSkill(createSkillDto: CreateSkillDto): Promise<Skill> {
    const skill = this.skillRepository.create(createSkillDto);
    return await this.skillRepository.save(skill);
  }

  async findAllSkills(): Promise<Skill[]> {
    return await this.skillRepository.find({
      where: { isVisible: true },
      order: { displayOrder: 'ASC' },
    });
  }

  async findSkillsByCategory(category: string): Promise<Skill[]> {
    return await this.skillRepository.find({
      where: { category, isVisible: true },
      order: { displayOrder: 'ASC' },
    });
  }

  async findOneSkill(id: number): Promise<Skill> {
    const skill = await this.skillRepository.findOne({ where: { id } });
    if (!skill) {
      throw new NotFoundException(`Skill with ID ${id} not found`);
    }
    return skill;
  }

  async updateSkill(id: number, updateSkillDto: UpdateSkillDto): Promise<Skill> {
    const skill = await this.findOneSkill(id);
    Object.assign(skill, updateSkillDto);
    return await this.skillRepository.save(skill);
  }

  async removeSkill(id: number): Promise<void> {
    const skill = await this.findOneSkill(id);
    await this.skillRepository.remove(skill);
  }

  async findAllSkillsAdmin(): Promise<Skill[]> {
    return await this.skillRepository.find({
      order: { displayOrder: 'ASC' },
    });
  }

  async reorderSkills(skills: { id: number; displayOrder: number }[]): Promise<{ success: boolean }> {
    const promises = skills.map(({ id, displayOrder }) =>
      this.skillRepository.update(id, { displayOrder })
    );
    await Promise.all(promises);
    return { success: true };
  }

  // Experience
  async createExperience(createExperienceDto: CreateExperienceDto): Promise<Experience> {
    const experience = this.experienceRepository.create(createExperienceDto);
    return await this.experienceRepository.save(experience);
  }

  async findAllExperience(): Promise<Experience[]> {
    return await this.experienceRepository.find({
      order: { startDate: 'DESC' },
    });
  }

  async findCurrentExperience(): Promise<Experience[]> {
    return await this.experienceRepository.find({
      where: { isCurrent: true },
      order: { startDate: 'DESC' },
    });
  }

  async findOneExperience(id: number): Promise<Experience> {
    const experience = await this.experienceRepository.findOne({ where: { id } });
    if (!experience) {
      throw new NotFoundException(`Experience with ID ${id} not found`);
    }
    return experience;
  }

  async updateExperience(id: number, updateExperienceDto: UpdateExperienceDto): Promise<Experience> {
    const experience = await this.findOneExperience(id);
    Object.assign(experience, updateExperienceDto);
    return await this.experienceRepository.save(experience);
  }

  async removeExperience(id: number): Promise<void> {
    const experience = await this.findOneExperience(id);
    await this.experienceRepository.remove(experience);
  }

  // About
  async findAbout(): Promise<About> {
    let about = await this.aboutRepository.findOne({ where: { id: 1 } });
    if (!about) {
      about = this.aboutRepository.create({
        fullName: '',
        tagline: '',
        bio: '',
        longBio: '',
      });
      about = await this.aboutRepository.save(about);
    }
    return about;
  }

  async updateAbout(updateAboutDto: UpdateAboutDto): Promise<About> {
    let about = await this.aboutRepository.findOne({ where: { id: 1 } });
    if (!about) {
      about = this.aboutRepository.create(updateAboutDto);
    } else {
      Object.assign(about, updateAboutDto);
    }
    return await this.aboutRepository.save(about);
  }
}
