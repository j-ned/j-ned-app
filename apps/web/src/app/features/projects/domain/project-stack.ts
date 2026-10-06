export function projectStack(tags: readonly string[], size: number): readonly string[] {
  return tags.slice(0, size);
}
