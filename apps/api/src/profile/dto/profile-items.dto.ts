import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsUUID,
  Matches,
} from 'class-validator';
import {
  PROFILE_LIMITS,
  PROFILE_TECHNOLOGY_ICON_PATTERN,
} from '../profile-limits';
import { ProfileText } from './profile-text.decorator';

const L = PROFILE_LIMITS;

export class ProfileBiographyDto {
  @ProfileText(L.biography.title)
  title!: string;

  @ProfileText(L.biography.summary)
  summary!: string;

  @ProfileText(L.biography.leadEmphasis)
  leadEmphasis!: string;

  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(L.biography.paragraphs)
  @ProfileText(L.biography.paragraph, { each: true })
  paragraphs!: string[];
}

export class ProfileHighlightDto {
  @IsUUID()
  id!: string;

  @ProfileText(L.highlight.title)
  title!: string;

  @ProfileText(L.highlight.description)
  description!: string;
}

export class ProfileWhatIDoDto {
  @IsUUID()
  id!: string;

  @ProfileText(L.whatIDo.title)
  title!: string;

  @ProfileText(L.whatIDo.description)
  description!: string;
}

export class ProfileTechnologyDto {
  @IsUUID()
  id!: string;

  @ProfileText(L.technology.name)
  name!: string;

  @ProfileText(L.technology.category)
  category!: string;

  @Matches(PROFILE_TECHNOLOGY_ICON_PATTERN)
  icon!: string;
}

export class ProfileDiplomaDto {
  @IsUUID()
  id!: string;

  @ProfileText(L.diploma.title)
  title!: string;

  @ProfileText(L.diploma.provider)
  provider!: string;

  @ProfileText(L.diploma.level)
  level!: string;

  @ProfileText(L.diploma.shortDescription)
  shortDescription!: string;

  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(L.diploma.skills)
  @ProfileText(L.diploma.skill, { each: true })
  skills!: string[];
}

export class ProfileMotivationDto {
  @ProfileText(L.motivation.title)
  title!: string;

  @ProfileText(L.motivation.statement)
  statement!: string;

  @ProfileText(L.motivation.description)
  description!: string;
}
