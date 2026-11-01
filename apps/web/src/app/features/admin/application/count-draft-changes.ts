const isPlainObject = (value: unknown): value is Readonly<Record<string, unknown>> =>
  typeof value === 'object' &&
  value !== null &&
  [Object.prototype, null].includes(Object.getPrototypeOf(value));

// `Object.keys` ignore les clés symboles dont Signal Forms marque les lignes répétées.
function sameValue(a: unknown, b: unknown): boolean {
  if (Object.is(a, b)) return true;
  if (Array.isArray(a) && Array.isArray(b)) {
    return a.length === b.length && a.every((item, index) => sameValue(item, b[index]));
  }
  if (a instanceof Set && b instanceof Set) {
    return a.size === b.size && [...a].every((item) => b.has(item));
  }
  if (isPlainObject(a) && isPlainObject(b)) {
    const keys = Object.keys(a);
    return keys.length === Object.keys(b).length && keys.every((key) => sameValue(a[key], b[key]));
  }
  return false;
}

export function countChangedFields<T extends object>(a: T, b: T): number {
  return (Object.keys(a) as (keyof T)[]).filter((key) => !sameValue(a[key], b[key])).length;
}
