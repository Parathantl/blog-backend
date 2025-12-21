import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { PortfolioService } from './portfolio.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { CreateSkillDto } from './dto/create-skill.dto';
import { UpdateSkillDto } from './dto/update-skill.dto';
import { CreateExperienceDto } from './dto/create-experience.dto';
import { UpdateExperienceDto } from './dto/update-experience.dto';
import { UpdateAboutDto } from './dto/update-about.dto';

@Controller('portfolio')
export class PortfolioController {
  constructor(private readonly portfolioService: PortfolioService) {}

  // Projects endpoints
  @Post('projects')
  @UseGuards(AuthGuard('jwt'))
  createProject(@Body() createProjectDto: CreateProjectDto) {
    return this.portfolioService.createProject(createProjectDto);
  }

  @Get('projects')
  findAllProjects() {
    return this.portfolioService.findAllProjects();
  }

  @Get('projects/featured')
  findFeaturedProjects() {
    return this.portfolioService.findFeaturedProjects();
  }

  @Get('projects/:id')
  findOneProject(@Param('id') id: string) {
    return this.portfolioService.findOneProject(+id);
  }

  @Patch('projects/:id')
  @UseGuards(AuthGuard('jwt'))
  updateProject(@Param('id') id: string, @Body() updateProjectDto: UpdateProjectDto) {
    return this.portfolioService.updateProject(+id, updateProjectDto);
  }

  @Delete('projects/:id')
  @UseGuards(AuthGuard('jwt'))
  removeProject(@Param('id') id: string) {
    return this.portfolioService.removeProject(+id);
  }

  // Skills endpoints
  @Post('skills')
  @UseGuards(AuthGuard('jwt'))
  createSkill(@Body() createSkillDto: CreateSkillDto) {
    return this.portfolioService.createSkill(createSkillDto);
  }

  @Get('skills')
  findAllSkills() {
    return this.portfolioService.findAllSkills();
  }

  @Get('skills/admin')
  @UseGuards(AuthGuard('jwt'))
  findAllSkillsAdmin() {
    return this.portfolioService.findAllSkillsAdmin();
  }

  @Get('skills/category/:category')
  findSkillsByCategory(@Param('category') category: string) {
    return this.portfolioService.findSkillsByCategory(category);
  }

  @Get('skills/:id')
  findOneSkill(@Param('id') id: string) {
    return this.portfolioService.findOneSkill(+id);
  }

  @Patch('skills/reorder')
  @UseGuards(AuthGuard('jwt'))
  reorderSkills(@Body() reorderDto: { skills: { id: number; displayOrder: number }[] }) {
    return this.portfolioService.reorderSkills(reorderDto.skills);
  }

  @Patch('skills/:id')
  @UseGuards(AuthGuard('jwt'))
  updateSkill(@Param('id') id: string, @Body() updateSkillDto: UpdateSkillDto) {
    return this.portfolioService.updateSkill(+id, updateSkillDto);
  }

  @Delete('skills/:id')
  @UseGuards(AuthGuard('jwt'))
  removeSkill(@Param('id') id: string) {
    return this.portfolioService.removeSkill(+id);
  }

  // Experience endpoints
  @Post('experience')
  @UseGuards(AuthGuard('jwt'))
  createExperience(@Body() createExperienceDto: CreateExperienceDto) {
    return this.portfolioService.createExperience(createExperienceDto);
  }

  @Get('experience')
  findAllExperience() {
    return this.portfolioService.findAllExperience();
  }

  @Get('experience/current')
  findCurrentExperience() {
    return this.portfolioService.findCurrentExperience();
  }

  @Get('experience/:id')
  findOneExperience(@Param('id') id: string) {
    return this.portfolioService.findOneExperience(+id);
  }

  @Patch('experience/:id')
  @UseGuards(AuthGuard('jwt'))
  updateExperience(@Param('id') id: string, @Body() updateExperienceDto: UpdateExperienceDto) {
    return this.portfolioService.updateExperience(+id, updateExperienceDto);
  }

  @Delete('experience/:id')
  @UseGuards(AuthGuard('jwt'))
  removeExperience(@Param('id') id: string) {
    return this.portfolioService.removeExperience(+id);
  }

  // About endpoints
  @Get('about')
  findAbout() {
    return this.portfolioService.findAbout();
  }

  @Patch('about')
  @UseGuards(AuthGuard('jwt'))
  updateAbout(@Body() updateAboutDto: UpdateAboutDto) {
    return this.portfolioService.updateAbout(updateAboutDto);
  }
}
