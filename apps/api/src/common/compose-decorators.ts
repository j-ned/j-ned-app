/** Applique les décorateurs de propriété dans l'ordre donné (comme `applyDecorators` de NestJS). */
export function composeDecorators(
  ...decorators: PropertyDecorator[]
): PropertyDecorator {
  return (target, propertyKey) => {
    for (const decorator of decorators) decorator(target, propertyKey);
  };
}
