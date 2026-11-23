import { ConflictException } from '../common/http-errors';
import { and, eq, sql } from 'drizzle-orm';
import { isDeepStrictEqual } from 'node:util';
import type { Database } from '../database/drizzle.types';
import {
  PROFILE_ROW_ID,
  profileContent,
  type ProfileContentRow,
} from '../database/schema/profile-content';
import { STORAGE_BUCKET, StorageService } from '../storage/storage.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import type { ProfileDocument } from './profile-content';
import { inProfileTransaction } from './profile-lock';
import {
  findProfileRow,
  toProfileContent,
  toProfileDocument,
} from './profile-document';

// Document unique, lu à la requête par le front.
export class ProfileService {
  constructor(
    private readonly db: Database,
    private readonly storage: Pick<StorageService, 'getPublicUrl'>,
  ) {}

  async findCurrent(): Promise<ProfileDocument> {
    return this.toDocument(await findProfileRow(this.db));
  }

  // Contenu identique à la version lue : rien n'est écrit ; version périmée (autre fenêtre, autre
  // poste) : 409.
  async replace(dto: UpdateProfileDto): Promise<ProfileDocument> {
    const current = await findProfileRow(this.db);
    const content = toProfileContent(dto);
    // jsonb ne garde pas l'ordre des clés : comparaison structurelle, pas textuelle. Version périmée :
    // l'écriture conditionnelle répond 409, même à contenu égal.
    if (
      dto.version === current.version &&
      isDeepStrictEqual(current.content, content)
    ) {
      return this.toDocument(current);
    }

    // Une opération portrait peut tenir la ligne (verrou pendant son envoi S3) : attente bornée.
    const [row] = await inProfileTransaction(this.db, (tx) =>
      tx
        .update(profileContent)
        .set({
          content,
          version: sql`${profileContent.version} + 1`,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(profileContent.id, PROFILE_ROW_ID),
            eq(profileContent.version, dto.version),
          ),
        )
        .returning(),
    );
    if (!row) {
      throw new ConflictException(
        'Version périmée : le parcours a été modifié depuis sa lecture',
      );
    }

    return this.toDocument(row);
  }

  private toDocument(row: ProfileContentRow): ProfileDocument {
    return toProfileDocument(row, (key) =>
      this.storage.getPublicUrl(STORAGE_BUCKET, key),
    );
  }
}
