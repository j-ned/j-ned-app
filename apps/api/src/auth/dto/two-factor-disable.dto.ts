import { IsString, MinLength } from 'class-validator';

export class TwoFactorDisableDto {
  @IsString()
  @MinLength(12)
  password!: string;
}
