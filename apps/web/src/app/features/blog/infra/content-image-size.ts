// Clé posée par l'API : `blog-content/<uuid>-<empreinte sha256 sur 8 caractères>-<l>x<h>.avif`.
const CONTENT_IMAGE_URL =
  /^(?:https:\/\/api\.nedellec-julien\.fr)?(?:\/api)?\/storage\/portfolio-storage\/blog-content\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}-[0-9a-f]{8}-([1-9]\d*)x([1-9]\d*)\.avif$/;

export function contentImageSize(
  href: string,
): { readonly width: number; readonly height: number } | null {
  const match = CONTENT_IMAGE_URL.exec(href);
  return match ? { width: Number(match[1]), height: Number(match[2]) } : null;
}
