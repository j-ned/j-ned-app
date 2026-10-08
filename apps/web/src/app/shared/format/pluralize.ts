// Usage français : le singulier vaut pour 0 et 1, le pluriel à partir de 2.
export const pluralize = (count: number, singular: string, plural: string): string =>
  count > 1 ? plural : singular;
