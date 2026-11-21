import type { ResizeOptions, Sharp } from 'sharp';
import { UnprocessableEntityException } from '../common/http-errors';

/** Largeur max stockée : les visuels s'affichent au plus en ~800 px CSS, 1600 couvre le retina 2×. */
export const IMAGE_MAX_WIDTH = 1600;
/**
 * Largeurs dérivées à la demande pour le `srcset` (`?variant=w<largeur>`), l'original à 1600 px
 * couvrant le haut de gamme. Liste fermée : une largeur libre laisserait n'importe qui remplir S3.
 * Doit rester alignée sur `RESPONSIVE_IMAGE_WIDTHS` côté web (`storage-image-loader.ts`).
 */
export const RESPONSIVE_IMAGE_WIDTHS = [480, 800, 1200] as const;
export type ResponsiveImageWidth = (typeof RESPONSIVE_IMAGE_WIDTHS)[number];
const AVIF_QUALITY = 60;
const AVIF_EFFORT = 4;
/** Carte de partage Open Graph : le 1,91:1 attendu par Facebook, LinkedIn et X, en JPEG (l'AVIF n'y est pas décodé). */
export const SHARE_CARD = { width: 1200, height: 630 } as const;
const SHARE_CARD_JPEG_QUALITY = 80;
/**
 * Portrait de la page Parcours (spec 021, D6) : cadre 4:5 de 20 rem, 640 px couvrent la DPR 2. Seule
 * image LCP de `/about` : sa taille fixe garde le poids proche de l'ancien `avatar.avif`.
 */
export const PORTRAIT = { width: 640, height: 800 } as const;

export type OptimizedImage = {
  readonly buffer: Buffer;
  readonly mimetype: 'image/avif';
  readonly ext: 'avif';
  readonly width: number;
  readonly height: number;
};

/**
 * Normalise toute image uploadée (JPEG, PNG, WebP, AVIF) en AVIF ≤ 1600 px, orientation EXIF
 * appliquée. Un JPEG d'appareil photo de 2,8 Mo devient ~70 Ko sans que l'admin ait à y penser.
 */
export class ImageOptimizer {
  /**
   * sharp (binaire natif, ~40 ms de chargement) n'est requis qu'à l'envoi d'une image par l'admin : le
   * démarrage à froid de la fonction, qui sert surtout des lectures, ne le paie pas.
   */
  private async loadSharp() {
    return (await import('sharp')).default;
  }

  async optimize(input: Buffer): Promise<OptimizedImage> {
    return this.renderAvif(input, {
      width: IMAGE_MAX_WIDTH,
      withoutEnlargement: true,
    });
  }

  /** Variante AVIF de l'image stockée à `width` px de large au plus, ratio conservé. */
  async toWidth(input: Buffer, width: ResponsiveImageWidth): Promise<Buffer> {
    const { buffer } = await this.renderAvif(input, {
      width,
      withoutEnlargement: true,
    });
    return buffer;
  }

  /**
   * Carte de partage JPEG 1200×630 (recadrage centré) pour `og:image` / `twitter:image` : les
   * crawlers sociaux ne lisent pas l'AVIF stocké, et exigent un ratio 1,91:1 pour la grande carte.
   */
  async toShareCard(input: Buffer): Promise<Buffer> {
    return this.render(input, (image) =>
      image
        .resize({ ...SHARE_CARD, fit: 'cover', position: 'attention' })
        .jpeg({ quality: SHARE_CARD_JPEG_QUALITY, progressive: true })
        .toBuffer(),
    );
  }

  /** Portrait AVIF 640×800 recadré sur la zone saillante (visage), orientation EXIF appliquée. */
  async toPortrait(input: Buffer): Promise<OptimizedImage> {
    return this.renderAvif(input, {
      ...PORTRAIT,
      fit: 'cover',
      position: 'attention',
    });
  }

  private async renderAvif(
    input: Buffer,
    resize: ResizeOptions,
  ): Promise<OptimizedImage> {
    return this.render(input, async (image) => {
      const { data, info } = await image
        .resize(resize)
        .avif({ quality: AVIF_QUALITY, effort: AVIF_EFFORT })
        .toBuffer({ resolveWithObject: true });
      return {
        buffer: data,
        mimetype: 'image/avif',
        ext: 'avif',
        width: info.width,
        height: info.height,
      };
    });
  }

  /** Décode `input` (orientation EXIF appliquée) ; tout échec de sharp devient un 422. */
  private async render<T>(
    input: Buffer,
    pipeline: (image: Sharp) => Promise<T>,
  ): Promise<T> {
    const sharp = await this.loadSharp();
    try {
      return await pipeline(sharp(input, { animated: false }).rotate());
    } catch {
      throw new UnprocessableEntityException(
        'Image illisible : fichier corrompu ou format non supporté',
      );
    }
  }
}
