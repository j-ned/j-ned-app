// Aucune ligne en base : l'objet S3 est adressé par le Markdown qui le cite. Ses dimensions sont
// dans la clé, que le rendu Markdown du front relit pour poser `width`/`height` (pas de CLS).
export const CONTENT_IMAGE_PREFIX = 'blog-content/';

const UUID = '[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}';

// Seul format qu'on accepte de supprimer.
const KEY_PATTERN = `${CONTENT_IMAGE_PREFIX}${UUID}-[0-9a-f]{8}-[1-9]\\d*x[1-9]\\d*\\.avif`;
const KEY = new RegExp(`^${KEY_PATTERN}$`);

// Toute base d'URL du proxy (absolue, `/api/storage/…`, `/storage/…`), mais un format de clé strict :
// seule une clé de `contentImageKey` se supprime depuis un Markdown, jamais un autre objet.
const CITED_KEY = new RegExp(
  `/storage/portfolio-storage/(${KEY_PATTERN})(?![\\w.-])`,
  'g',
);

export function contentImageKey(
  id: string,
  hash: string,
  width: number,
  height: number,
): string {
  return `${CONTENT_IMAGE_PREFIX}${id}-${hash}-${width}x${height}.avif`;
}

export function contentImageKeysIn(markdown: string): string[] {
  const keys = Array.from(markdown.matchAll(CITED_KEY), (match) => match[1]);
  return [...new Set(keys.filter((key) => key !== undefined))];
}

export function isContentImageKey(key: string): boolean {
  return KEY.test(key);
}
