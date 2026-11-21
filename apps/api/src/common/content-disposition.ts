/**
 * En-tête `Content-Disposition: attachment` pour un nom de fichier libre (RFC 6266). Un en-tête HTTP
 * ne porte que du Latin-1 et un guillemet y ferme la valeur : `filename` reçoit donc un repli ASCII,
 * et `filename*` le nom exact, que les navigateurs préfèrent.
 */
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
