import { IMAGE_UPLOAD_TARGET_BYTES } from './upload-limit';
import { UploadRejectedError } from './upload-rejected-error';

// L'API ré-encode en AVIF de 1600 px au plus : 2400 px laissent de la marge sans rien perdre à l'affichage.
export const MAX_IMAGE_SIDE = 2400;
const WEBP_QUALITIES: readonly number[] = [0.9, 0.8, 0.7, 0.6, 0.5, 0.4];

export const IMAGE_TOO_LARGE = "L'image dépasse 900\u00a0Ko, même compressée.";
export const IMAGE_UNREADABLE =
  "L'image dépasse 900\u00a0Ko et le navigateur n'a pas pu la compresser.";

export type ImageSize = { readonly width: number; readonly height: number };
export type DecodedImage = ImageSize & { close(): void };

export type ImageCodec<TImage extends DecodedImage> = {
  readonly decode: (file: Blob) => Promise<TImage>;
  // `null` : le navigateur ne sait pas produire de WebP.
  readonly encodeWebp: (image: TImage, size: ImageSize, quality: number) => Promise<Blob | null>;
};

export function scaleToFit({ width, height }: ImageSize, maxSide: number): ImageSize {
  const ratio = Math.min(1, maxSide / Math.max(width, height));
  return {
    width: Math.max(1, Math.round(width * ratio)),
    height: Math.max(1, Math.round(height * ratio)),
  };
}

const toWebpName = (name: string): string => `${name.replace(/\.[^.]*$/, '') || 'image'}.webp`;

// Un fichier déjà sous la limite part tel quel si le navigateur échoue : l'API le ré-encode de toute façon.
export async function prepareImageUpload<TImage extends DecodedImage>(
  file: File,
  codec: ImageCodec<TImage>,
): Promise<File> {
  const fitsLimit = file.size <= IMAGE_UPLOAD_TARGET_BYTES;
  let image: TImage;
  try {
    image = await codec.decode(file);
  } catch {
    if (fitsLimit) return file;
    throw new UploadRejectedError(IMAGE_UNREADABLE);
  }
  try {
    if (fitsLimit && Math.max(image.width, image.height) <= MAX_IMAGE_SIDE) return file;
    const encoded = await encodeUnderLimit(image, codec);
    if (encoded === 'too-large' || encoded === 'unsupported') {
      if (fitsLimit) return file;
      throw new UploadRejectedError(encoded === 'too-large' ? IMAGE_TOO_LARGE : IMAGE_UNREADABLE);
    }
    return new File([encoded], toWebpName(file.name), {
      type: 'image/webp',
      lastModified: file.lastModified,
    });
  } finally {
    image.close();
  }
}

async function encodeUnderLimit<TImage extends DecodedImage>(
  image: TImage,
  codec: ImageCodec<TImage>,
): Promise<Blob | 'too-large' | 'unsupported'> {
  const size = scaleToFit(image, MAX_IMAGE_SIDE);
  for (const quality of WEBP_QUALITIES) {
    const blob = await codec.encodeWebp(image, size, quality).catch(() => null);
    if (blob === null) return 'unsupported';
    if (blob.size <= IMAGE_UPLOAD_TARGET_BYTES) return blob;
  }
  return 'too-large';
}
