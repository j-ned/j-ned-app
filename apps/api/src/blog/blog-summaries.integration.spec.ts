import { randomUUID } from 'node:crypto';
import { resolve } from 'node:path';
import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';
import type { Database } from '../database/drizzle.types';
import { schema } from '../database/schema';
import { ImageOptimizer } from '../storage/image-optimizer.service';
import { StorageService } from '../storage/storage.service';
import { BlogContentImagesService } from './blog-content-images.service';
import { BlogService } from './blog.service';

// Liste publique des articles sur un vrai Postgres, sans lire leur corps : même résumé, même nombre
// de mots que la liste complète. Base jetable sur le serveur de `PROFILE_IT_DATABASE_URL`.
const SERVER_URL = process.env.PROFILE_IT_DATABASE_URL;

class UrlOnlyStorage extends StorageService {
  constructor() {
    super(null);
  }
  override getPublicUrl(bucket: string, key: string): string {
    return `/storage/${bucket}/${key}`;
  }
}

// Espaces au sens de `\s` en JavaScript, et caractères qui n'en sont pas (U+0085, U+200B, U+180E).
const BODIES = [
  '',
  '   ',
  '# Titre\n\nUn paragraphe de cinq mots.',
  'tab\tnew\nline\r\nvertical\vfeed\f',
  'insécable\u00a0fine\u202fcadratin\u2003idéographique\u3000fin',
  'ogham\u1680ligne\u2028para\u2029math\u205fbom\ufeffx',
  'pas\u0085espace\u200bni\u180eceux-ci',
  '  emoji 🎉 accentué é  ',
] as const;

(SERVER_URL ? describe : describe.skip)(
  'published post summaries on Postgres',
  () => {
    const databaseName = `blog_summaries_it_${randomUUID().replaceAll('-', '')}`;
    let admin: ReturnType<typeof postgres>;
    let client: ReturnType<typeof postgres>;
    let blog: BlogService;

    beforeAll(async () => {
      admin = postgres(SERVER_URL ?? '', { max: 1, onnotice: () => {} });
      await admin`CREATE DATABASE ${admin(databaseName)}`;
      const url = new URL(SERVER_URL ?? '');
      url.pathname = `/${databaseName}`;
      client = postgres(url.toString(), { max: 2, onnotice: () => {} });
      const db: Database = drizzle(client, { schema, casing: 'snake_case' });
      await migrate(db, {
        migrationsFolder: resolve(__dirname, '../../drizzle'),
      });
      const storage = new UrlOnlyStorage();
      const images = new ImageOptimizer();
      blog = new BlogService(
        db,
        storage,
        images,
        new BlogContentImagesService(db, storage, images),
      );
      for (const [index, contentMarkdown] of BODIES.entries()) {
        await blog.create({
          title: `Article ${index}`,
          excerpt: 'Résumé',
          contentMarkdown,
          status: 'published',
        });
      }
      await blog.create({
        title: 'Brouillon',
        excerpt: 'Résumé',
        contentMarkdown: 'jamais listé',
        status: 'draft',
      });
    });

    afterAll(async () => {
      await client.end();
      await admin`DROP DATABASE IF EXISTS ${admin(databaseName)} WITH (FORCE)`;
      await admin.end();
    });

    it('Given published posts with every kind of whitespace, When summaries are listed, Then they match the full list without its body, word counts included', async () => {
      const byId = (a: { id: string }, b: { id: string }) =>
        a.id.localeCompare(b.id);

      const summaries = await blog.findPublishedSummaries();
      const full = await blog.findAllPublished();

      expect({
        count: summaries.length,
        summaries: [...summaries].sort(byId),
      }).toEqual({
        count: BODIES.length,
        summaries: full
          .map((post) => ({ ...post, contentMarkdown: undefined }))
          .sort(byId),
      });
    });

    it('Given published posts, When summaries are listed, Then they come most recently published first', async () => {
      const summaries = await blog.findPublishedSummaries();
      const dates = summaries.map((post) => post.publishedAt?.getTime() ?? 0);

      expect(dates).toEqual([...dates].sort((a, b) => b - a));
    });
  },
);
