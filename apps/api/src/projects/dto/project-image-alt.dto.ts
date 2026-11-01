import { Transform } from 'class-transformer';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { PROJECT_IMAGE_ALT_MAX } from '../project-gallery';

/** Texte alternatif d'une capture : champ texte du multipart d'upload et corps du PATCH. */
export class ProjectImageAltDto {
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  @IsNotEmpty()
  @MaxLength(PROJECT_IMAGE_ALT_MAX)
  alt!: string;
}
