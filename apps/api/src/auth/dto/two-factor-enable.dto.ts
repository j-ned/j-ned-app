import { IsString, Length } from 'class-validator';

export class TwoFactorEnableDto {
  @IsString()
  @Length(6, 6)
  code!: string;
}
