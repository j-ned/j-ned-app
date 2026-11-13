import { resolve } from 'node:path';
import argon2 from 'argon2';
import { eq, ne } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';
import type { Database } from '../drizzle.types';
import { blogPosts, projects, schema, users } from '../schema';
import {
  DEMO_ADMIN_EMAIL,
  demoSeedSettings,
  initDemoDatabase,
} from './demo.seed';

const PASSWORD = 'demo-password-0123';

describe('demoSeedSettings', () => {
  const valid = {
    DATABASE_URL: 'postgres://u:p@127.0.0.1:5432/preview',
    DEMO_ADMIN_PASSWORD: PASSWORD,
  };

  it('Given a database URL and a long enough password, Then the seed may run', () => {
    expect(demoSeedSettings(valid)).toEqual({
      databaseUrl: valid.DATABASE_URL,
      password: PASSWORD,
    });
  });

  it.each([['preview'], ['development'], [undefined]])(
    'Given VERCEL_ENV=%s, Then the seed may run',
    (vercelEnv) => {
      expect(() =>
        demoSeedSettings({ ...valid, VERCEL_ENV: vercelEnv }),
      ).not.toThrow();
    },
  );

  it('Given VERCEL_ENV=production, Then the seed refuses to run', () => {
    expect(() =>
      demoSeedSettings({ ...valid, VERCEL_ENV: 'production' }),
    ).toThrow('Demo seed refused: VERCEL_ENV=production');
  });

  it('Given APP_ENV=production, Then the seed refuses to run', () => {
    expect(() => demoSeedSettings({ ...valid, APP_ENV: 'production' })).toThrow(
      'Demo seed refused: APP_ENV=production',
    );
  });

  it('Given APP_ENV=preview, Then the seed may run', () => {
    expect(() =>
      demoSeedSettings({ ...valid, APP_ENV: 'preview' }),
    ).not.toThrow();
  });

  it('Given a misspelt APP_ENV, Then the seed refuses to run rather than guess', () => {
    expect(() => demoSeedSettings({ ...valid, APP_ENV: 'prod' })).toThrow(
      'Demo seed refused: unknown APP_ENV',
    );
  });

  it('Given no DATABASE_URL, Then the seed refuses to run', () => {
    expect(() =>
      demoSeedSettings({ ...valid, DATABASE_URL: undefined }),
    ).toThrow(/DATABASE_URL/);
  });

  it.each([[undefined], ['short']])(
    'Given DEMO_ADMIN_PASSWORD=%s, Then the seed refuses to run',
    (password) => {
      expect(() =>
        demoSeedSettings({ ...valid, DEMO_ADMIN_PASSWORD: password }),
      ).toThrow(/DEMO_ADMIN_PASSWORD/);
    },
  );
});

/**
 * Sur un vrai Postgres, base jetable écrasée à chaque test : ignoré sans
 * `DEMO_IT_DATABASE_URL=postgres://…@127.0.0.1:…/… pnpm test -- demo.seed`.
 */
const DATABASE_URL = process.env.DEMO_IT_DATABASE_URL;

(DATABASE_URL ? describe : describe.skip)(
  'initDemoDatabase on Postgres',
  () => {
    let client: ReturnType<typeof postgres>;
    let db: Database;
    const runMigrations = jest.fn(() =>
      migrate(db, { migrationsFolder: resolve(__dirname, '../../../drizzle') }),
    );

    beforeAll(() => {
      client = postgres(DATABASE_URL ?? '', { max: 2, onnotice: () => {} });
      db = drizzle(client, { schema, casing: 'snake_case' });
    });
    afterAll(() => client.end());

    beforeEach(async () => {
      runMigrations.mockClear();
      await client.unsafe(
        'DROP SCHEMA IF EXISTS drizzle CASCADE; DROP SCHEMA public CASCADE; CREATE SCHEMA public;',
      );
    });

    it('Given an empty database, When initialised, Then it holds the demo admin and fictitious content only', async () => {
      await initDemoDatabase(db, {
        migrate: runMigrations,
        password: PASSWORD,
      });

      expect(runMigrations).toHaveBeenCalledTimes(1);
      const accounts = await db.select().from(users);
      expect(accounts.map((u) => u.email)).toEqual([DEMO_ADMIN_EMAIL]);
      expect(await argon2.verify(accounts[0].passwordHash, PASSWORD)).toBe(
        true,
      );
      const demoProjects = await db.select().from(projects);
      expect(demoProjects.length).toBeGreaterThanOrEqual(2);
      expect(demoProjects.every((p) => p.slug.startsWith('demo-'))).toBe(true);
      expect(demoProjects.every((p) => p.image === '')).toBe(true);
      const posts = await db.select().from(blogPosts);
      expect(posts.every((p) => p.slug.startsWith('demo-'))).toBe(true);
      expect(posts.every((p) => p.coverImage === '')).toBe(true);
      expect(
        posts.filter((p) => p.status === 'published' && p.publishedAt).length,
      ).toBeGreaterThanOrEqual(2);
    });

    it('Given an initialised demo database, When initialised again, Then the demo data is recreated identically', async () => {
      await initDemoDatabase(db, {
        migrate: runMigrations,
        password: PASSWORD,
      });
      const before = {
        projects: (await db.select().from(projects)).map((p) => p.slug).sort(),
        posts: (await db.select().from(blogPosts)).map((p) => p.slug).sort(),
      };

      await initDemoDatabase(db, {
        migrate: runMigrations,
        password: `${PASSWORD}-new`,
      });

      expect({
        projects: (await db.select().from(projects)).map((p) => p.slug).sort(),
        posts: (await db.select().from(blogPosts)).map((p) => p.slug).sort(),
      }).toEqual(before);
      const [admin] = await db.select().from(users);
      expect(await argon2.verify(admin.passwordHash, `${PASSWORD}-new`)).toBe(
        true,
      );
    });

    it('Given a database holding a non-demo account, When initialised, Then it refuses before migrating or writing anything', async () => {
      await runMigrations();
      runMigrations.mockClear();
      await db
        .insert(users)
        .values({ email: 'owner@example.com', passwordHash: 'x' });

      await expect(
        initDemoDatabase(db, { migrate: runMigrations, password: PASSWORD }),
      ).rejects.toThrow(/non-demo account/);

      expect(runMigrations).not.toHaveBeenCalled();
      expect(
        await db
          .select()
          .from(users)
          .where(ne(users.email, 'owner@example.com')),
      ).toEqual([]);
      expect(await db.select().from(projects)).toEqual([]);
      expect(
        await db.select().from(users).where(eq(users.email, DEMO_ADMIN_EMAIL)),
      ).toEqual([]);
    });
  },
);
