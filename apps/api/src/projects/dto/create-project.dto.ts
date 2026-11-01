import { Transform, Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
  Min,
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import {
  PROJECT_KINDS,
  type ProjectKind,
} from '../../database/schema/projects';
import {
  PROJECT_FACT_MAX,
  PROJECT_PITCH_MAX,
  toNullableText,
} from '../project-editorial';
import { composeDecorators } from '../../common/compose-decorators';
import { ArchitectureDecisionDto } from './architecture-decision.dto';
import { TechChoiceDto } from './tech-choice.dto';

/**
 * Champ éditorial facultatif (ADR-0010 §3) : trim, vide → null, null efface, borne après trim.
 * Garder le type `string | null` : il se reflète en `Object`, donc `enableImplicitConversion`
 * ne change pas `42` en `'42'` avant `@IsString` (un type `string` seul le ferait).
 */
function EditorialText(max: number): PropertyDecorator {
  return composeDecorators(
    Transform(({ value }: { value: unknown }) => toNullableText(value)),
    IsOptional(),
    ValidateIf((_, v) => v !== null),
    IsString(),
    MaxLength(max),
  );
}

export class CreateProjectDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  title!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  category!: string;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(20)
  @IsString({ each: true })
  @MaxLength(50, { each: true })
  tags?: string[];

  @IsString()
  @IsNotEmpty()
  @MaxLength(5000)
  description!: string;

  @EditorialText(PROJECT_PITCH_MAX)
  pitch?: string | null;

  @EditorialText(PROJECT_FACT_MAX)
  highlight?: string | null;

  @EditorialText(PROJECT_FACT_MAX)
  scope?: string | null;

  @IsOptional()
  @ValidateIf((_, v) => v !== null)
  @IsUrl()
  liveUrl?: string | null;

  @IsOptional()
  @ValidateIf((_, v) => v !== null)
  @IsUrl()
  repoUrl?: string | null;

  @IsOptional()
  @ValidateIf((_, v) => v !== null)
  @IsUrl()
  repoUrlFront?: string | null;

  @IsOptional()
  @ValidateIf((_, v) => v !== null)
  @IsUrl()
  repoUrlBack?: string | null;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(30)
  @ValidateNested({ each: true })
  @Type(() => TechChoiceDto)
  techChoices?: TechChoiceDto[];

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(30)
  @ValidateNested({ each: true })
  @Type(() => ArchitectureDecisionDto)
  architectureDecisions?: ArchitectureDecisionDto[];

  // Optionnel mais jamais null : la colonne est NOT NULL (ADR-0008 §4). Pas de @IsOptional,
  // qui laisserait passer null jusqu'à une erreur 500 en base.
  @ValidateIf((_, v) => v !== undefined)
  @IsIn([...PROJECT_KINDS])
  kind?: ProjectKind;

  @IsOptional()
  @IsBoolean()
  featured?: boolean;

  @IsOptional()
  @IsInt()
  @Min(0)
  order?: number;
}
