import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateCategoryDto {
  @IsNotEmpty()
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  description: string;

  @IsOptional()
  @IsString()
  slug: string;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  displayOrder: number;

  @IsNotEmpty()
  @IsNumber()
  @Type(() => Number)
  masterCategoryId: number;
}
