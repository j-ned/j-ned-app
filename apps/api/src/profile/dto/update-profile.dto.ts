import { IsInt, Min } from 'class-validator';
import { PROFILE_LIMITS } from '../profile-limits';
import {
  ProfileBiographyDto,
  ProfileDiplomaDto,
  ProfileHighlightDto,
  ProfileMotivationDto,
  ProfileTechnologyDto,
  ProfileWhatIDoDto,
} from './profile-items.dto';
import { ProfileItemList, ProfileSection } from './profile-list.decorator';
import { ProfileText } from './profile-text.decorator';

const L = PROFILE_LIMITS;

/**
 * Remplacement complet du parcours (ADR-0023 §2) : les huit clés de contenu et la `version` lue.
 * L'ordre des listes est l'ordre d'affichage.
 */
export class UpdateProfileDto {
  @IsInt()
  @Min(1)
  version!: number;

  @ProfileSection(() => ProfileBiographyDto)
  biography!: ProfileBiographyDto;

  @ProfileItemList(L.highlight.items, () => ProfileHighlightDto)
  highlights!: ProfileHighlightDto[];

  @ProfileText(L.sectionSummary)
  workSummary!: string;

  @ProfileItemList(L.whatIDo.items, () => ProfileWhatIDoDto)
  whatIDo!: ProfileWhatIDoDto[];

  @ProfileItemList(L.technology.items, () => ProfileTechnologyDto)
  technologies!: ProfileTechnologyDto[];

  @ProfileText(L.sectionSummary)
  diplomasSummary!: string;

  @ProfileItemList(L.diploma.items, () => ProfileDiplomaDto)
  diplomas!: ProfileDiplomaDto[];

  @ProfileSection(() => ProfileMotivationDto)
  motivation!: ProfileMotivationDto;
}
