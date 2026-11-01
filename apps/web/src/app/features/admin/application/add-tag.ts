import { normalizeTag, tagKey } from './tag-key';

/** `@MaxLength(50, { each: true })` des DTO d'articles et de projets de l'API. */
export const TAG_MAX_LENGTH = 50;

export type TagRefusal = 'empty' | 'duplicate' | 'too-long' | 'too-many';

export type TagRules = {
  /** Tags connus (catalogue, autres contenus) : leur graphie l'emporte sur la saisie. */
  readonly known: readonly string[];
  /** `@ArrayMaxSize` du DTO concerné. */
  readonly maxCount: number;
};

export type TagAddition =
  | {
      readonly success: true;
      readonly data: { readonly tags: readonly string[]; readonly added: string };
    }
  | { readonly success: false; readonly error: TagRefusal; readonly tag: string };

export function addTag(tags: readonly string[], raw: string, rules: TagRules): TagAddition {
  const typed = normalizeTag(raw);
  const key = tagKey(typed);
  const tag = rules.known.find((known) => tagKey(known) === key) ?? typed;
  const existing = tags.find((selected) => tagKey(selected) === key);

  if (tag === '') return { success: false, error: 'empty', tag };
  if (existing !== undefined) return { success: false, error: 'duplicate', tag: existing };
  if (tag.length > TAG_MAX_LENGTH) return { success: false, error: 'too-long', tag };
  if (tags.length >= rules.maxCount) return { success: false, error: 'too-many', tag };
  return { success: true, data: { tags: [...tags, tag], added: tag } };
}
