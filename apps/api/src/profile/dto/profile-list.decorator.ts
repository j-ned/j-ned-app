import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  ArrayUnique,
  IsArray,
  IsObject,
  ValidateNested,
} from 'class-validator';
import { composeDecorators } from '../../common/compose-decorators';

/** Liste ordonnée d'éléments à `id` : 1 à `max` éléments, `id` uniques, chacun validé. */
export function ProfileItemList(
  max: number,
  item: () => new () => { id: string },
): PropertyDecorator {
  return composeDecorators(
    IsArray(),
    ArrayMinSize(1),
    ArrayMaxSize(max),
    ArrayUnique((entry: { id?: unknown }) => entry?.id),
    ValidateNested({ each: true }),
    Type(item),
  );
}

/** Section objet obligatoire, validée en profondeur (clés inconnues refusées par la pipe). */
export function ProfileSection(
  section: () => new () => object,
): PropertyDecorator {
  return composeDecorators(IsObject(), ValidateNested(), Type(section));
}
