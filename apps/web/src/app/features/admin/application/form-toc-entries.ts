import { countChangedFields } from './count-draft-changes';

export type FormTocEntry = {
  readonly id: string;
  readonly label: string;
  readonly state: 'modifié' | '';
};

export type FormTocSection<T extends object> = {
  readonly id: string;
  readonly label: string;
  readonly fields: readonly (keyof T)[];
};

const pick = <T extends object>(value: T, fields: readonly (keyof T)[]): Partial<T> =>
  Object.fromEntries(fields.map((field) => [field, value[field]])) as Partial<T>;

export function toFormTocEntries<T extends object>(
  sections: readonly FormTocSection<T>[],
  edited: T,
  baseline: T,
): readonly FormTocEntry[] {
  return sections.map(({ id, label, fields }) => ({
    id,
    label,
    state: countChangedFields(pick(edited, fields), pick(baseline, fields)) > 0 ? 'modifié' : '',
  }));
}
