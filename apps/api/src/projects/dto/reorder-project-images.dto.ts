import { ArrayMaxSize, ArrayUnique, IsArray, IsUUID } from 'class-validator';
import { PROJECT_GALLERY_MAX } from '../project-gallery';

/** Ordre complet de la galerie : la permutation exacte est vérifiée par le service (422). */
export class ReorderProjectImagesDto {
  @IsArray()
  @ArrayMaxSize(PROJECT_GALLERY_MAX)
  @ArrayUnique()
  @IsUUID('all', { each: true })
  imageIds!: string[];
}
