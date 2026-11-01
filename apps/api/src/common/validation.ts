import { plainToInstance, type ClassConstructor } from 'class-transformer';
import { validate, type ValidationError } from 'class-validator';
import { BadRequestException } from './http-errors';

/**
 * Même validation que le `ValidationPipe` global de l'API NestJS : conversion vers la classe du DTO
 * (conversion implicite des types), liste blanche stricte (un champ inconnu est refusé), et messages
 * des contraintes aplatis, préfixés du chemin du parent pour les objets imbriqués.
 */
export async function validateDto<T extends object>(
  dto: ClassConstructor<T>,
  value: unknown,
): Promise<T> {
  const plain = isPlainObject(value) ? stripProtoKeys(value) : {};
  const instance = plainToInstance(dto, plain, {
    enableImplicitConversion: true,
  });
  const errors = await validate(instance, {
    whitelist: true,
    forbidNonWhitelisted: true,
  });
  // Corps qui n'est pas un objet (liste, valeur seule) : refusé même si le DTO n'exige rien.
  if (!isPlainObject(value) && value !== undefined && value !== null) {
    throw new BadRequestException([
      'Request body must be a JSON object',
      ...flatten(errors),
    ]);
  }
  if (errors.length > 0) throw new BadRequestException(flatten(errors));
  return instance;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function stripProtoKeys<T>(value: T): T {
  if (Array.isArray(value)) value.forEach(stripProtoKeys);
  else if (typeof value === 'object' && value !== null) {
    const record = value as Record<string, unknown>;
    delete record['__proto__'];
    for (const key of Object.keys(record)) stripProtoKeys(record[key]);
  }
  return value;
}

function flatten(errors: readonly ValidationError[]): string[] {
  return errors
    .flatMap((error) => withChildren(error))
    .flatMap((error) => Object.values(error.constraints ?? {}));
}

function withChildren(
  error: ValidationError,
  parentPath?: string,
): ValidationError[] {
  if (!error.children?.length) return [error];
  const path = parentPath ? `${parentPath}.${error.property}` : error.property;
  return error.children.flatMap((child) => [
    ...(child.children?.length ? withChildren(child, path) : []),
    {
      ...child,
      constraints: Object.fromEntries(
        Object.entries(child.constraints ?? {}).map(([key, message]) => [
          key,
          `${path}.${message}`,
        ]),
      ),
    },
  ]);
}
