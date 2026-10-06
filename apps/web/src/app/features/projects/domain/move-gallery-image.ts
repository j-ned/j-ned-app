export function moveGalleryImage(
  ids: readonly string[],
  index: number,
  delta: -1 | 1,
): readonly string[] {
  const target = index + delta;
  if (index < 0 || index >= ids.length || target < 0 || target >= ids.length) return [...ids];
  return ids.map((id, i) => (i === index ? ids[target] : i === target ? ids[index] : id));
}
