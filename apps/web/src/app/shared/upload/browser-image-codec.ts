import type { ImageCodec, ImageSize } from './prepare-image-upload';

// Un navigateur sans encodeur WebP rend du PNG sans le dire : ce n'est pas le format demandé.
const webpOnly = (blob: Blob | null): Blob | null => (blob?.type === 'image/webp' ? blob : null);

function encodeWithOffscreenCanvas(
  image: ImageBitmap,
  { width, height }: ImageSize,
  quality: number,
): Promise<Blob | null> {
  const canvas = new OffscreenCanvas(width, height);
  const context = canvas.getContext('2d');
  if (!context) return Promise.resolve(null);
  context.imageSmoothingQuality = 'high';
  context.drawImage(image, 0, 0, width, height);
  return canvas.convertToBlob({ type: 'image/webp', quality }).then(webpOnly);
}

function encodeWithCanvas(
  image: ImageBitmap,
  { width, height }: ImageSize,
  quality: number,
): Promise<Blob | null> {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext('2d');
  if (!context) return Promise.resolve(null);
  context.imageSmoothingQuality = 'high';
  context.drawImage(image, 0, 0, width, height);
  return new Promise((resolve) =>
    canvas.toBlob((blob) => resolve(webpOnly(blob)), 'image/webp', quality),
  );
}

export const BROWSER_IMAGE_CODEC: ImageCodec<ImageBitmap> = {
  decode: (file) => createImageBitmap(file),
  encodeWebp: (image, size, quality) =>
    typeof OffscreenCanvas === 'undefined'
      ? encodeWithCanvas(image, size, quality)
      : encodeWithOffscreenCanvas(image, size, quality),
};
