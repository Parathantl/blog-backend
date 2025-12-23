import { IsEmail, IsNotEmpty, IsArray, ArrayMinSize } from 'class-validator';

export class SubscribeDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsArray()
  @ArrayMinSize(1, { message: 'Please select at least one category' })
  masterCategoryIds: number[];
}
