import { defaultMetadataStorage } from 'class-transformer/cjs/storage';
import { getMetadataStorage, IsOptional, ValidateIf } from 'class-validator';

type Constructor<T> = new (...args: never[]) => T;

export type PartialTypeOptions = {
  /**
   * `false` : un champ omis n'est pas validé, mais `null` l'est (`ValidateIf(value !== undefined)`) ;
   * par défaut, `IsOptional` laisse aussi passer `null`.
   */
  readonly skipNullProperties?: boolean;
};

const TRANSFORM_METADATA_KEYS = [
  '_excludeMetadatas',
  '_exposeMetadatas',
  '_transformMetadatas',
  '_typeMetadatas',
] as const;

/**
 * Classe dont chaque champ du DTO parent devient facultatif, règles de validation et de conversion
 * héritées : même comportement que `PartialType` de `@nestjs/mapped-types` (MIT), sans NestJS.
 */
export function PartialType<T>(
  parent: Constructor<T>,
  options: PartialTypeOptions = {},
): Constructor<Partial<T>> {
  class PartialClass {}

  const validation = getMetadataStorage();
  const keys = new Set<string>();
  for (const meta of validation.getTargetValidationMetadatas(
    parent,
    '',
    false,
    false,
  )) {
    const designType: unknown = Reflect.getMetadata(
      'design:type',
      parent.prototype as object,
      meta.propertyName,
    );
    if (designType) {
      Reflect.defineMetadata(
        'design:type',
        designType,
        PartialClass.prototype,
        meta.propertyName,
      );
    }
    validation.addValidationMetadata({ ...meta, target: PartialClass });
    keys.add(meta.propertyName);
  }

  const storage = defaultMetadataStorage as unknown as Record<
    (typeof TRANSFORM_METADATA_KEYS)[number],
    Map<unknown, Map<string, unknown>>
  >;
  for (const key of TRANSFORM_METADATA_KEYS) {
    const merged = new Map<string, unknown>();
    let current: unknown = parent;
    while (current && current !== Object) {
      for (const [property, meta] of storage[key].get(current) ?? []) {
        if (merged.has(property)) continue;
        merged.set(
          property,
          Array.isArray(meta)
            ? (meta as unknown[]).map((item) => ({
                ...(item as object),
                target: PartialClass,
              }))
            : { ...(meta as object), target: PartialClass },
        );
      }
      current = Object.getPrototypeOf(current) as unknown;
    }
    if (merged.size > 0) storage[key].set(PartialClass, merged);
  }

  for (const key of keys) {
    const decorator =
      options.skipNullProperties === false
        ? ValidateIf((_, value) => value !== undefined)
        : IsOptional();
    decorator(PartialClass.prototype, key);
  }

  Object.defineProperty(PartialClass, 'name', {
    value: `Partial${parent.name}`,
  });
  return PartialClass;
}
