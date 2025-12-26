import { IsArray, ArrayMinSize, IsInt } from 'class-validator';

export class UpdatePreferencesDto {
  @IsArray()
  @ArrayMinSize(1, { message: 'Please select at least one category' })
  @IsInt({ each: true })
  masterCategoryIds: number[];
}
