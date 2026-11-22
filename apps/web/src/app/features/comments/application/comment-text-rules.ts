import {
  validate,
  type PathKind,
  type SchemaPath,
  type SchemaPathRules,
} from '@angular/forms/signals';
import {
  COMMENT_LIMITS,
  characterCount,
  hasForbiddenCharacter,
  hasVisibleCharacter,
} from '../domain/comment-text';
import { COMMENT_FORM_COPY } from './comment-copy';

const RULES = {
  name: {
    min: COMMENT_LIMITS.nameMin,
    max: COMMENT_LIMITS.nameMax,
    length: COMMENT_FORM_COPY.nameLength,
    characters: COMMENT_FORM_COPY.nameCharacters,
    invisible: COMMENT_FORM_COPY.nameInvisible,
  },
  body: {
    min: COMMENT_LIMITS.bodyMin,
    max: COMMENT_LIMITS.bodyMax,
    length: COMMENT_FORM_COPY.bodyLength,
    characters: COMMENT_FORM_COPY.bodyCharacters,
    invisible: COMMENT_FORM_COPY.bodyInvisible,
  },
} as const;

// Mêmes refus que l'API, dans le même ordre : un envoi valide ici n'est pas refusé là-bas pour ça.
export function textWithinApiRules<TPathKind extends PathKind>(
  path: SchemaPath<string, SchemaPathRules.Supported, TPathKind>,
  field: 'name' | 'body',
): void {
  const rule = RULES[field];
  validate(path, ({ value }) => {
    const text = value();
    if (text === '') return null;
    const count = characterCount(text);
    if (count < rule.min || count > rule.max) return { kind: 'length', message: rule.length };
    if (hasForbiddenCharacter(text, field)) {
      return { kind: 'characters', message: rule.characters };
    }
    return hasVisibleCharacter(text) ? null : { kind: 'invisible', message: rule.invisible };
  });
}
