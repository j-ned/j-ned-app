import { ConflictException, NotFoundException } from '../common/http-errors';
import { Logger } from '../common/logger';
import type { UploadedFile } from '../common/http';
import { desc, eq, sql } from 'drizzle-orm';
import type { Database } from '../database/drizzle.types';
import {
  blogPosts,
  type NewBlogPost,
  type BlogPost,
} from '../database/schema/blog-posts';
import { STORAGE_BUCKET, StorageService } from '../storage/storage.service';
import { ImageOptimizer } from '../storage/image-optimizer.service';
import { deleteS3IfExists, storeOptimizedImage } from '../storage/s3-utils';
import type { BlogPostResponse, BlogPostSummary } from './blog-post-response';
import { contentImageKeysIn } from './blog-content-image';
import { BlogContentImagesService } from './blog-content-images.service';
import { publishedSlugFilter } from './published-post';
import { countWords, sqlWordCount } from './word-count';
import { CreateBlogPostDto } from './dto/create-blog-post.dto';
import { UpdateBlogPostDto } from './dto/update-blog-post.dto';
import { findByIdOrFail } from '../common/crud-helpers';
import { isUniqueViolation, slugify } from '../common/utils';
import { insertedRow } from '../common/rows';
import {
  assertVersion,
  missedWrite,
  nextVersion,
  versionedRow,
} from '../common/entity-version';

const SUMMARY_COLUMNS = {
  id: blogPosts.id,
  title: blogPosts.title,
  slug: blogPosts.slug,
  excerpt: blogPosts.excerpt,
  coverImage: blogPosts.coverImage,
  tags: blogPosts.tags,
  status: blogPosts.status,
  likesCount: blogPosts.likesCount,
  version: blogPosts.version,
  publishedAt: blogPosts.publishedAt,
  createdAt: blogPosts.createdAt,
  updatedAt: blogPosts.updatedAt,
  wordCount: sqlWordCount(blogPosts.contentMarkdown),
};

const STALE_POST =
  'Une version plus récente de cet article a été enregistrée ailleurs : recharge-le avant d’enregistrer.';

export class BlogService {
  private readonly logger = new Logger(BlogService.name);

  constructor(
    private readonly db: Database,
    private readonly storage: StorageService,
    private readonly images: ImageOptimizer,
    private readonly contentImages: BlogContentImagesService,
  ) {}

  async findAllPublished(): Promise<BlogPostResponse[]> {
    const rows = await this.db
      .select()
      .from(blogPosts)
      .where(eq(blogPosts.status, 'published'))
      .orderBy(desc(blogPosts.publishedAt));
    return rows.map((r) => this.toResponse(r));
  }

  // Même liste sans les corps Markdown, jamais lus : le nombre de mots est compté par Postgres.
  async findPublishedSummaries(): Promise<BlogPostSummary[]> {
    const rows = await this.db
      .select(SUMMARY_COLUMNS)
      .from(blogPosts)
      .where(eq(blogPosts.status, 'published'))
      .orderBy(desc(blogPosts.publishedAt));
    return rows.map((r) => this.toSummary(r));
  }

  // Brouillons compris : l'éditeur lit le corps d'un seul article, par `findByIdForAdmin`.
  async findAdminSummaries(): Promise<BlogPostSummary[]> {
    const rows = await this.db
      .select(SUMMARY_COLUMNS)
      .from(blogPosts)
      .orderBy(desc(blogPosts.createdAt));
    return rows.map((r) => this.toSummary(r));
  }

  async findByIdForAdmin(id: string): Promise<BlogPostResponse> {
    return this.toResponse(await this.findByIdRaw(id));
  }

  async findBySlug(slug: string): Promise<BlogPostResponse> {
    const [row] = await this.db
      .select()
      .from(blogPosts)
      .where(publishedSlugFilter(slug))
      .limit(1);
    if (row === undefined) {
      throw new NotFoundException(`Blog post "${slug}" not found`);
    }
    return this.toResponse(row);
  }

  async create(dto: CreateBlogPostDto): Promise<BlogPostResponse> {
    const slug = slugify(dto.title);
    const publishedAt = dto.status === 'published' ? new Date() : null;
    try {
      const rows = await this.db
        .insert(blogPosts)
        .values({ ...dto, slug, publishedAt })
        .returning();
      return this.toResponse(insertedRow(rows));
    } catch (err) {
      if (isUniqueViolation(err, 'slug')) {
        throw new ConflictException(
          `Blog post with slug "${slug}" already exists`,
        );
      }
      throw err;
    }
  }

  // `expectedVersion` (If-Match) : écriture refusée en 412 si l'article a changé depuis cette version.
  async update(
    id: string,
    dto: UpdateBlogPostDto,
    expectedVersion?: number,
  ): Promise<BlogPostResponse> {
    const current = await this.findByIdRaw(id);
    assertVersion(current, expectedVersion, STALE_POST);

    // coverImage extrait du spread : il ne peut être que null ou undefined
    // côté DTO (upload géré par POST /:id/image), mais on ne veut jamais
    // qu'il soit propagé tel quel dans le patch DB (colonne NOT NULL DEFAULT '').
    const { coverImage, ...rest } = dto;
    const patch: { [K in keyof NewBlogPost]?: NewBlogPost[K] | undefined } = {
      ...rest,
      updatedAt: new Date(),
    };
    // Le slug est l'URL publique : figé une fois l'article publié, pour qu'un titre édité ne casse pas les liens entrants.
    if (dto.title !== undefined && current.publishedAt === null) {
      patch.slug = slugify(dto.title);
    }
    if (coverImage === null) patch.coverImage = '';

    const isPublishing =
      dto.status === 'published' && current.status !== 'published';
    if (isPublishing) patch.publishedAt = new Date();

    let rows: BlogPost[];
    try {
      rows = await this.db
        .update(blogPosts)
        .set({ ...patch, version: nextVersion(blogPosts) })
        .where(versionedRow(blogPosts, id, expectedVersion))
        .returning();
    } catch (err) {
      if (isUniqueViolation(err, 'slug')) {
        throw new ConflictException(
          `Blog post with slug "${patch.slug}" already exists`,
        );
      }
      throw err;
    }
    const row = rows[0] ?? (await this.missedWrite(id, expectedVersion));

    // S3 cleanup APRÈS le write DB réussi : si le write échoue, on préfère
    // garder l'objet S3 (orphelin DB-cohérent) plutôt qu'une DB cassée.
    if (coverImage === null) {
      await deleteS3IfExists(this.storage, STORAGE_BUCKET, current.coverImage);
    }

    return this.toResponse(row);
  }

  async remove(id: string): Promise<void> {
    const current = await this.findByIdRaw(id);
    await this.db.delete(blogPosts).where(eq(blogPosts.id, id));
    // La ligne est supprimée : un échec S3 ne laisse qu'un orphelin, il est journalisé sans
    // faire échouer la suppression ni sauter le nettoyage suivant.
    await deleteS3IfExists(
      this.storage,
      STORAGE_BUCKET,
      current.coverImage,
    ).catch((err: unknown) =>
      this.logger.error(
        `Suppression de la couverture ${current.coverImage} de l'article ${id} en échec`,
        err instanceof Error ? err.stack : String(err),
      ),
    );
    // Images du corps que nul autre article ne cite.
    await this.contentImages
      .removeUnreferenced(contentImageKeysIn(current.contentMarkdown), id)
      .catch((err: unknown) =>
        this.logger.error(
          `Nettoyage des images du corps de l'article ${id} en échec`,
          err instanceof Error ? err.stack : String(err),
        ),
      );
  }

  async uploadCoverImage(
    id: string,
    file: UploadedFile,
    expectedVersion?: number,
  ): Promise<BlogPostResponse> {
    const current = await this.findByIdRaw(id);
    assertVersion(current, expectedVersion, STALE_POST);
    // Ordre : upload → update DB → cleanup ancienne clé. Si une étape échoue, on préfère un orphelin S3
    // (cleanup manuel possible) à une DB qui référence une clé supprimée (image cassée côté front).
    const newKey = await storeOptimizedImage(
      this.storage,
      STORAGE_BUCKET,
      this.images,
      `blog/${id}`,
      file.buffer,
    );

    // Version périmée entre-temps : la nouvelle clé reste un orphelin S3, comme un échec d'écriture.
    const [row] = await this.db
      .update(blogPosts)
      .set({
        coverImage: newKey,
        version: nextVersion(blogPosts),
        updatedAt: new Date(),
      })
      .where(versionedRow(blogPosts, id, expectedVersion))
      .returning();
    if (row === undefined) return this.missedWrite(id, expectedVersion);

    if (current.coverImage !== newKey) {
      await deleteS3IfExists(this.storage, STORAGE_BUCKET, current.coverImage);
    }

    return this.toResponse(row);
  }

  async like(slug: string): Promise<{ likesCount: number }> {
    // Incrément atomique côté DB (pas de read-then-write applicatif) pour
    // éviter une race condition entre deux likes concurrents. Le filtre
    // status='published' est appliqué dans la même requête (plutôt qu'un
    // find préalable) pour ne pas sacrifier cette atomicité.
    const [row] = await this.db
      .update(blogPosts)
      .set({ likesCount: sql`${blogPosts.likesCount} + 1` })
      .where(publishedSlugFilter(slug))
      .returning({ likesCount: blogPosts.likesCount });
    if (!row) throw new NotFoundException(`Blog post "${slug}" not found`);
    return { likesCount: row.likesCount };
  }

  private missedWrite(id: string, expectedVersion: number | undefined) {
    return missedWrite(this.db, blogPosts, id, expectedVersion, {
      notFound: `Blog post ${id} not found`,
      stale: STALE_POST,
    });
  }

  // Helper privé : retourne la row brute (sans transformation URL).
  // Utilisé par toutes les opérations internes qui ont besoin de la key S3.
  private findByIdRaw(id: string): Promise<BlogPost> {
    return findByIdOrFail<BlogPost>(this.db, blogPosts, id, 'Blog post');
  }

  // Transforme la key DB en URL publique pour la sortie API.
  private toResponse(p: BlogPost): BlogPostResponse {
    return {
      ...p,
      coverImage: this.coverUrl(p.coverImage),
      wordCount: countWords(p.contentMarkdown),
    };
  }

  private toSummary(r: BlogPostSummary): BlogPostSummary {
    return { ...r, coverImage: this.coverUrl(r.coverImage) };
  }

  private coverUrl(key: string): string {
    return key ? this.storage.getPublicUrl(STORAGE_BUCKET, key) : '';
  }
}
