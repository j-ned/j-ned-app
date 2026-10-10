export function trackedPath(url: string): string {
  const fragmentStart = url.indexOf('#');
  return fragmentStart === -1 ? url : url.slice(0, fragmentStart);
}
