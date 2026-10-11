export function moveItem<T>(items: readonly T[], index: number, delta: -1 | 1): T[] {
  const target = index + delta;
  if (index < 0 || index >= items.length || target < 0 || target >= items.length) return [...items];
  return items.map((item, i) => (i === index ? items[target] : i === target ? items[index] : item));
}
