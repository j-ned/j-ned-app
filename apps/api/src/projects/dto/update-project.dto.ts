import { PartialType } from '../../common/partial-type';
import { Equals, IsOptional } from 'class-validator';
import { CreateProjectDto } from './create-project.dto';

// skipNullProperties: false : PartialType pose sinon un @IsOptional qui laisse passer null sur
// tous les champs, dont `kind` (NOT NULL) et les champs requis. Les champs qui acceptent null
// (liens, image) le déclarent eux-mêmes.
export class UpdateProjectDto extends PartialType(CreateProjectDto, {
  skipNullProperties: false,
}) {
  @IsOptional()
  @Equals(null)
  image?: null;
}
