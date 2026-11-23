import type { UploadedFile } from '../common/http';
import { Logger } from '../common/logger';
import { eq } from 'drizzle-orm';
import type { Database, Transaction } from '../database/drizzle.types';
import {
  PROFILE_ROW_ID,
  profileContent,
  type ProfileContentRow,
} from '../database/schema/profile-content';
import { ImageOptimizer } from '../storage/image-optimizer.service';
import { contentHash } from '../storage/s3-utils';
import { STORAGE_BUCKET, StorageService } from '../storage/storage.service';
import type { ProfileDocument } from './profile-content';
import { inProfileTransaction } from './profile-lock';
import { lockProfileRow, toProfileDocument } from './profile-document';
import { updatedRow } from '../common/rows';

// Une page déjà servie cite encore l'ancienne clé : chaque changement fait glisser les clés (courante
// → précédente) et ne supprime que l'avant-dernière, au plus un fichier en trop, jamais d'image citée
// absente. Écriture des clés, suppression et réintroduction d'une clé (adressée par contenu) passent
// sous le verrou de la ligne : une suppression décidée sous verrou ne retire jamais un objet cité.
export class ProfilePortraitService {
  private readonly logger = new Logger(ProfilePortraitService.name);

  constructor(
    private readonly db: Database,
    private readonly storage: Pick<
      StorageService,
      'upload' | 'delete' | 'getPublicUrl'
    >,
    private readonly images: Pick<ImageOptimizer, 'toPortrait'>,
  ) {}

  // Recadrage hors verrou ; envoi sous une clé hachée et écriture, verrou tenu.
  async replace(file: UploadedFile): Promise<ProfileDocument> {
    const image = await this.images.toPortrait(file.buffer);
    // Clé dérivée du contenu : une nouvelle image = une nouvelle URL, servie en cache immuable.
    const key = `profile/portrait-${contentHash(image.buffer)}.${image.ext}`;

    let uploading = false;
    let result: { row: ProfileContentRow; older: string | null };
    try {
      result = await inProfileTransaction(this.db, async (tx) => {
        const current = await lockProfileRow(tx);
        if (key === current.portraitKey) return { row: current, older: null };
        uploading = true;
        await this.storage.upload(
          STORAGE_BUCKET,
          key,
          image.buffer,
          image.mimetype,
        );
        const row = await this.write(tx, current, key);
        return { row, older: current.previousPortraitKey };
      });
    } catch (err) {
      // Transaction annulée : l'objet envoyé n'est orphelin que si la ligne ne le cite pas.
      if (uploading) {
        await this.discardIfUnreferenced(
          key,
          'compensation après écriture en échec',
        );
      }
      throw err;
    }
    await this.discardIfUnreferenced(result.older, 'avant-dernier portrait');
    return this.toDocument(result.row);
  }

  // La clé retirée est gardée jusqu'au changement suivant.
  async remove(): Promise<void> {
    const older = await inProfileTransaction(this.db, async (tx) => {
      const current = await lockProfileRow(tx);
      if (!current.portraitKey) return null;
      await this.write(tx, current, null);
      return current.previousPortraitKey;
    });
    await this.discardIfUnreferenced(older, 'avant-dernier portrait');
  }

  // La ligne est verrouillée : elle n'a pas pu changer depuis sa lecture.
  private async write(
    tx: Transaction,
    current: ProfileContentRow,
    next: string | null,
  ): Promise<ProfileContentRow> {
    const rows = await tx
      .update(profileContent)
      .set({
        portraitKey: next,
        previousPortraitKey: current.portraitKey,
        updatedAt: new Date(),
      })
      .where(eq(profileContent.id, PROFILE_ROW_ID))
      .returning();
    return updatedRow(rows, 'Profile content not found');
  }

  // Verrou tenu, après le COMMIT de l'écriture pour qu'un échec S3 ne l'annule jamais : échec ⇒
  // orphelin journalisé, jamais une erreur 500.
  private async discardIfUnreferenced(
    key: string | null,
    reason: string,
  ): Promise<void> {
    if (!key) return;
    try {
      await inProfileTransaction(this.db, async (tx) => {
        const row = await lockProfileRow(tx);
        if (key === row.portraitKey || key === row.previousPortraitKey) return;
        await this.storage.delete(STORAGE_BUCKET, key);
      });
    } catch (err) {
      this.logger.error(
        `S3 orphan (${reason}) : ${STORAGE_BUCKET}/${key}`,
        err instanceof Error ? err.stack : String(err),
      );
    }
  }

  private toDocument(row: ProfileContentRow): ProfileDocument {
    return toProfileDocument(row, (key) =>
      this.storage.getPublicUrl(STORAGE_BUCKET, key),
    );
  }
}
