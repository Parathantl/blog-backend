import {
  IsNotEmpty,
  IsArray,
  IsOptional,
  IsString,
  IsNumber,
} from 'class-validator';

export class CreatePostDto {
  @IsNotEmpty({ message: 'Title is mandatory' })
  @IsString()
  title: string;

  @IsNotEmpty()
  @IsString()
  content: string;

  @IsArray()
  @IsNumber({}, { each: true })
  @IsOptional()
  categoryIds: number[];

  @IsOptional()
  @IsString()
  mainImageUrl: string;
}
