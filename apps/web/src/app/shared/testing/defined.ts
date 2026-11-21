export function defined<T>(value: T | undefined): T {
  if (value === undefined) throw new Error('Expected a defined value, got undefined');
  return value;
}
