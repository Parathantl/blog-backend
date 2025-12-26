import {
  IsEmail,
  IsNotEmpty,
  IsArray,
  ArrayMinSize,
  IsInt,
} from 'class-validator';

export class SubscribeDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsArray()
  @ArrayMinSize(1, { message: 'Please select at least one category' })
  @IsInt({ each: true })
  masterCategoryIds: number[];
}
