import { IsString, IsArray, IsOptional, IsBoolean, IsNumber, IsDateString } from 'class-validator';

export class CreateExperienceDto {
  @IsString()
  company: string;

  @IsString()
  position: string;

  @IsString()
  description: string;

  @IsArray()
  @IsString({ each: true })
  responsibilities: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  technologies?: string[];

  @IsDateString()
  startDate: Date;

  @IsOptional()
  @IsDateString()
  endDate?: Date;

  @IsOptional()
  @IsBoolean()
  isCurrent?: boolean;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsString()
  companyUrl?: string;

  @IsOptional()
  @IsNumber()
  displayOrder?: number;
}
