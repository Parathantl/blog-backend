import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PortfolioService } from './portfolio.service';
import { PortfolioController } from './portfolio.controller';
import { Project } from './entities/project.entity';
import { Skill } from './entities/skill.entity';
import { Experience } from './entities/experience.entity';
import { About } from './entities/about.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Project, Skill, Experience, About]),
  ],
  controllers: [PortfolioController],
  providers: [PortfolioService],
  exports: [PortfolioService],
})
export class PortfolioModule {}
