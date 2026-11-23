import { randomUUID } from 'node:crypto';
import { readdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { asc } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';
import { blogComments, blogPosts, schema } from '../database/schema';
import { seedCommentRow, seedPostRow } from '../testing/comment-harness';

// Effacement des empreintes des commentaires déjà publiés, rejoué sur un vrai Postgres : base jetable
// créée sur le serveur de `COMMENTS_IT_DATABASE_URL`, supprimée à la fin.
const SERVER_URL = process.env.COMMENTS_IT_DATABASE_URL;
const MIGRATIONS = resolve(__dirname, '../../drizzle');

function migrationSql(): string {
  const file = readdirSync(MIGRATIONS).find((name) =>
    name.endsWith('_published_comment_sender_hash.sql'),
  );
  if (file === undefined) {
    throw new Error('Migration *_published_comment_sender_hash.sql absente');
  }
  return readFileSync(resolve(MIGRATIONS, file), 'utf8');
}

(SERVER_URL ? describe : describe.skip)(
  'published comment sender fingerprints, migration',
  () => {
    const databaseName = `sender_hash_it_${randomUUID().replaceAll('-', '')}`;
    let admin: ReturnType<typeof postgres>;
    let client: ReturnType<typeof postgres>;

    beforeAll(async () => {
      admin = postgres(SERVER_URL ?? '', { max: 1, onnotice: () => {} });
      await admin`CREATE DATABASE ${admin(databaseName)}`;
      const url = new URL(SERVER_URL ?? '');
      url.pathname = `/${databaseName}`;
      client = postgres(url.toString(), { max: 1, onnotice: () => {} });
    });

    afterAll(async () => {
      await client.end();
      await admin`DROP DATABASE IF EXISTS ${admin(databaseName)} WITH (FORCE)`;
      await admin.end();
    });

    it('Given published and pending visitor comments carrying a fingerprint, When the migration runs, Then only the published ones lose it', async () => {
      const db = drizzle(client, { schema, casing: 'snake_case' });
      await migrate(db, { migrationsFolder: MIGRATIONS });
      const post = seedPostRow({ slug: 'usinage' });
      await db.insert(blogPosts).values({
        ...post,
        excerpt: 'Résumé',
        contentMarkdown: '# Corps',
        publishedAt: new Date(),
      });
      const hash = 'c'.repeat(64);
      const published = seedCommentRow({ postId: post.id, senderHash: hash });
      const pending = seedCommentRow({
        postId: post.id,
        status: 'pending',
        senderHash: hash,
      });
      const owner = seedCommentRow({ postId: post.id, owner: true });
      await db.insert(blogComments).values([published, pending, owner]);

      await client.unsafe(migrationSql());
      const rows = await db
        .select({ id: blogComments.id, senderHash: blogComments.senderHash })
        .from(blogComments)
        .orderBy(asc(blogComments.createdAt));

      expect(rows).toEqual([
        { id: published.id, senderHash: null },
        { id: pending.id, senderHash: hash },
        { id: owner.id, senderHash: null },
      ]);
    });
  },
);
