// Un en-tête ne porte que du Latin-1 et un guillemet y ferme la valeur (RFC 6266) : repli ASCII dans
// `filename`, nom exact dans `filename*`, que les navigateurs préfèrent.
export function attachmentDisposition(fileName: string): string {
  const fallback = fileName
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\x20-\x7e]|["\\]/g, '_');
  if (fallback === fileName) return `attachment; filename="${fileName}"`;
  const encoded = encodeURIComponent(fileName).replace(
    /['()*]/g,
    (char) => `%${char.charCodeAt(0).toString(16).toUpperCase()}`,
  );
  return `attachment; filename="${fallback}"; filename*=UTF-8''${encoded}`;
}
