import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class TechChoiceDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  techno!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  why!: string;
}
