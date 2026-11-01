import { Transform, Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsPositive,
  Max,
  Min,
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import { ProfileText } from '../../profile/dto/profile-text.decorator';
import {
  WORKSHOP_GUIDE_OPERATIONS,
  type WorkshopGuideOperation,
} from '../workshop-guide-content';
import { WORKSHOP_GUIDE_LIMITS } from '../workshop-guide-limits';

const L = WORKSHOP_GUIDE_LIMITS;

/** Remarque renseignée : une chaîne vide ou blanche vaut « pas de remarque » (champ facultatif du formulaire). */
const hasNote = ({ note }: WorkshopGuideEntryDto): boolean =>
  typeof note === 'string' ? note.trim() !== '' : note != null;

/** Ligne « toutes matières » (spec 037) : seul `true` en fait une ; absent, `false` ou `null` non. */
const isAllMaterials = ({ allMaterials }: WorkshopGuideEntryDto): boolean =>
  allMaterials === true;

export class WorkshopGuideEntryDto {
  // Même garde que `enabled` : "true" n'est jamais converti.
  @Transform(({ obj, key }) => (obj as Record<string, unknown>)[key])
  @IsOptional()
  @IsBoolean()
  allMaterials?: boolean | null;

  @ValidateIf((entry: WorkshopGuideEntryDto) => !isAllMaterials(entry))
  @ProfileText(L.material)
  material?: string | null;

  @IsIn([...WORKSHOP_GUIDE_OPERATIONS])
  operation!: WorkshopGuideOperation;

  @ProfileText(L.insert)
  insert!: string;

  @ValidateIf(({ noseRadius }: WorkshopGuideEntryDto) => noseRadius != null)
  @IsNumber({
    maxDecimalPlaces: L.noseRadiusDecimals,
    allowNaN: false,
    allowInfinity: false,
  })
  @IsPositive()
  @Max(L.noseRadius)
  noseRadius?: number | null;

  @ValidateIf(hasNote)
  @ProfileText(L.note)
  note?: string | null;
}

/**
 * Remplacement complet du guide des plaquettes (spec 035 du front) : l'interrupteur, les lignes et
 * la `version` lue. Version 0 = aucun document encore enregistré.
 */
export class UpdateWorkshopGuideDto {
  @IsInt()
  @Min(0)
  version!: number;

  // La conversion implicite ferait de "false" un `true` : on valide la valeur reçue, telle quelle.
  @Transform(({ obj, key }) => (obj as Record<string, unknown>)[key])
  @IsBoolean()
  enabled!: boolean;

  // Même garde que `enabled` : "false" n'est jamais converti. Seul l'absent passe la validation.
  @Transform(({ obj, key }) => (obj as Record<string, unknown>)[key])
  @ValidateIf(
    ({ decoderEnabled }: UpdateWorkshopGuideDto) =>
      decoderEnabled !== undefined,
  )
  @IsBoolean()
  decoderEnabled?: boolean;

  @IsArray()
  @ArrayMaxSize(L.entries)
  @ValidateNested({ each: true })
  @Type(() => WorkshopGuideEntryDto)
  entries!: WorkshopGuideEntryDto[];
}
