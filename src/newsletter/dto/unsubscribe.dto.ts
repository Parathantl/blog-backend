import { IsEmail, IsNotEmpty } from 'class-validator';

export class UnsubscribeDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;
}
