import { IsNotEmpty, IsOptional, IsBoolean, IsNumber } from 'class-validator';

export class CreateMasterCategoryDto {
  @IsNotEmpty()
  name: string;

  @IsNotEmpty()
  slug: string;

  @IsOptional()
  description?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsNumber()
  displayOrder?: number;
}
