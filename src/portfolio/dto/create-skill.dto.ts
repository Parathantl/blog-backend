import { IsString, IsNumber, IsOptional, IsBoolean, Min, Max } from 'class-validator';

export class CreateSkillDto {
  @IsString()
  name: string;

  @IsString()
  category: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  proficiencyLevel?: number;

  @IsOptional()
  @IsString()
  iconUrl?: string;

  @IsOptional()
  @IsNumber()
  displayOrder?: number;

  @IsOptional()
  @IsBoolean()
  isVisible?: boolean;
}
