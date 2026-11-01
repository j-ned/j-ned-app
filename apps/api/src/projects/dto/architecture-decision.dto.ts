import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class ArchitectureDecisionDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  decision!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  rationale!: string;
}
