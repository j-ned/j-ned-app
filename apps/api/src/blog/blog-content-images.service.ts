import type { UploadedFile } from '../common/http';
import { randomUUID } from 'node:crypto';
import { Logger } from '../common/logger';
import { and, ne, or, sql } from 'drizzle-orm';
import type { Database } from '../database/drizzle.types';
import { blogPosts } from '../database/schema/blog-posts';
import { ImageOptimizer } from '../storage/image-optimizer.service';
import { contentHash } from '../storage/s3-utils';
import { STORAGE_BUCKET, StorageService } from '../storage/storage.service';
import { contentImageKey, isContentImageKey } from './blog-content-image';

export type ContentImageResponse = {
  readonly url: string;
  readonly width: number;
  readonly height: number;
};

/** Images du corps des articles : téléversement sans rattachement, nettoyage à la suppression d'un article. */
export class BlogContentImagesService {
  private readonly logger = new Logger(BlogContentImagesService.name);

  constructor(
    private readonly db: Database,
    private readonly storage: StorageService,
    private readonly images: ImageOptimizer,
  ) {}

  /** AVIF ≤ 1 600 px sur S3, rien en base : utilisable avant le premier enregistrement de l'article. */
  async upload(file: UploadedFile): Promise<ContentImageResponse> {
    const image = await this.images.optimize(file.buffer);
    const key = contentImageKey(
      randomUUID(),
      contentHash(image.buffer),
      image.width,
      image.height,
    );
    await this.storage.upload(
      STORAGE_BUCKET,
      key,
      image.buffer,
      image.mimetype,
    );
    return {
      url: this.storage.getPublicUrl(STORAGE_BUCKET, key),
      width: image.width,
      height: image.height,
    };
  }

  /**
   * Supprime les objets dont aucun autre article ne cite la clé. Un échec S3 sur une clé est
   * journalisé sans interrompre les autres : au pire un orphelin, que l'ADR accepte.
   */
  async removeUnreferenced(
    keys: readonly string[],
    excludingPostId: string,
  ): Promise<void> {
    // Défense en profondeur : quel que soit l'appelant, seule une clé au format strict est
    // requêtée et supprimée (ni couverture, ni carte de partage, ni chemin bricolé).
    const candidates = keys.filter(isContentImageKey);
    if (candidates.length === 0) return;

    // Le format strict exclut `%` et `_` : LIKE sans échappement.
    const others = await this.db
      .select({ contentMarkdown: blogPosts.contentMarkdown })
      .from(blogPosts)
      .where(
        and(
          ne(blogPosts.id, excludingPostId),
          or(
            ...candidates.map(
              (key) => sql`${blogPosts.contentMarkdown} LIKE ${`%${key}%`}`,
            ),
          ),
        ),
      );
    // Toute mention compte, même hors d'une URL reconnue : dans le doute, on garde l'objet.
    const orphans = candidates.filter(
      (key) => !others.some((p) => p.contentMarkdown.includes(key)),
    );
    const results = await Promise.allSettled(
      orphans.map((key) => this.storage.delete(STORAGE_BUCKET, key)),
    );
    results.forEach((result, i) => {
      if (result.status === 'rejected') {
        this.logger.error(
          `Échec de suppression de l'image du corps ${orphans[i]}`,
          result.reason instanceof Error
            ? result.reason.stack
            : String(result.reason),
        );
      }
    });
  }
}
