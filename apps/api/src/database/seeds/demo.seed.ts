import argon2 from 'argon2';
import { like, ne, sql } from 'drizzle-orm';
import type { Database } from '../drizzle.types';
import {
  blogPosts,
  projects,
  users,
  type NewBlogPost,
  type NewProject,
} from '../schema';

/**
 * Base d'une preview Vercel (branche Neon `preview`) : uniquement des données fictives, jamais une
 * copie de production. Domaine réservé `.test`, slugs préfixés `demo-`, aucune image (le stockage
 * est désactivé en preview).
 */
export const DEMO_ADMIN_EMAIL = 'admin@demo.portfolio.test';
const DEMO_SLUG_PREFIX = 'demo-';
const MIN_PASSWORD_LENGTH = 12;
const DAY_MS = 24 * 60 * 60 * 1000;

export type DemoSeedSettings = {
  readonly databaseUrl: string;
  readonly password: string;
};

/** Refuse la production et une configuration incomplète, avant toute connexion. */
export function demoSeedSettings(
  env: Record<string, string | undefined>,
): DemoSeedSettings {
  if (env.VERCEL_ENV === 'production') {
    throw new Error('Demo seed refused: VERCEL_ENV=production');
  }
  const databaseUrl = env.DATABASE_URL;
  if (!databaseUrl) throw new Error('Missing DATABASE_URL');
  const password = env.DEMO_ADMIN_PASSWORD;
  if (!password || password.length < MIN_PASSWORD_LENGTH) {
    throw new Error(
      `DEMO_ADMIN_PASSWORD missing or shorter than ${MIN_PASSWORD_LENGTH} characters`,
    );
  }
  return { databaseUrl, password };
}

async function usersTableExists(db: Database): Promise<boolean> {
  const rows = await db.execute<{ table: string | null }>(
    sql`SELECT to_regclass('public.users')::text AS "table"`,
  );
  return rows[0]?.table != null;
}

/** Une base qui contient un autre compte que celui de démo (production, copie) est refusée. */
async function assertDemoOnlyDatabase(db: Database): Promise<void> {
  const others = await db
    .select({ id: users.id })
    .from(users)
    .where(ne(users.email, DEMO_ADMIN_EMAIL))
    .limit(1);
  if (others.length > 0) {
    throw new Error(
      'Database refused: it holds a non-demo account (production or a copy of it?)',
    );
  }
}

function demoProjects(): NewProject[] {
  return [
    {
      title: 'Démo : gestionnaire de tâches',
      slug: `${DEMO_SLUG_PREFIX}gestionnaire-de-taches`,
      category: 'Web',
      tags: ['Angular', 'TypeScript'],
      description:
        'Projet fictif de démonstration : une liste de tâches avec filtres et persistance locale.',
      pitch: 'Données de démonstration, aucun projet réel.',
      kind: 'demo',
      featured: true,
      order: 0,
    },
    {
      title: 'Démo : API de réservation',
      slug: `${DEMO_SLUG_PREFIX}api-de-reservation`,
      category: 'Backend',
      tags: ['Hono', 'PostgreSQL'],
      description:
        'Projet fictif de démonstration : une API REST de réservation de créneaux.',
      kind: 'production',
      featured: false,
      order: 1,
    },
    {
      title: 'Démo : script de migration',
      slug: `${DEMO_SLUG_PREFIX}script-de-migration`,
      category: 'Outillage',
      tags: ['Node.js'],
      description:
        'Projet fictif de démonstration : un script qui convertit des fichiers CSV en JSON.',
      kind: 'script',
      featured: false,
      order: 2,
    },
  ];
}

function demoPosts(now: number): NewBlogPost[] {
  return [
    {
      title: 'Démo : premier article',
      slug: `${DEMO_SLUG_PREFIX}premier-article`,
      excerpt: 'Article fictif de démonstration.',
      contentMarkdown:
        '# Premier article\n\nContenu de démonstration, sans rapport avec un article réel.\n',
      tags: ['demo'],
      status: 'published',
      publishedAt: new Date(now - 10 * DAY_MS),
    },
    {
      title: 'Démo : second article',
      slug: `${DEMO_SLUG_PREFIX}second-article`,
      excerpt: 'Un autre article fictif.',
      contentMarkdown:
        '# Second article\n\nDu texte de remplissage pour vérifier la mise en page.\n',
      tags: ['demo', 'typescript'],
      status: 'published',
      publishedAt: new Date(now - 3 * DAY_MS),
    },
    {
      title: 'Démo : brouillon',
      slug: `${DEMO_SLUG_PREFIX}brouillon`,
      excerpt: 'Brouillon fictif, visible seulement dans l’admin.',
      contentMarkdown: '# Brouillon\n\nNon publié.\n',
      tags: ['demo'],
      status: 'draft',
    },
  ];
}

/** Admin de démo et contenu fictif, recréés à l'identique à chaque exécution. */
async function seedDemo(db: Database, passwordHash: string): Promise<void> {
  const now = Date.now();
  await db.transaction(async (tx) => {
    await tx
      .insert(users)
      .values({ email: DEMO_ADMIN_EMAIL, passwordHash })
      .onConflictDoUpdate({
        target: users.email,
        // Nouveau mot de passe : les sessions ouvertes avec l'ancien sont révoquées.
        set: {
          passwordHash,
          tokenVersion: sql`${users.tokenVersion} + 1`,
        },
      });
    await tx
      .delete(projects)
      .where(like(projects.slug, `${DEMO_SLUG_PREFIX}%`));
    await tx
      .delete(blogPosts)
      .where(like(blogPosts.slug, `${DEMO_SLUG_PREFIX}%`));
    await tx.insert(projects).values(demoProjects());
    await tx.insert(blogPosts).values(demoPosts(now));
  });
}

export type InitDemoDeps = {
  /** Migrations Drizzle, appliquées seulement une fois la base reconnue comme base de démo. */
  readonly migrate: () => Promise<void>;
  readonly password: string;
};

/**
 * `pnpm db:init-demo` : vérifie que la base est vide ou réservée à la démo (avant même les
 * migrations), migre, puis verse l'admin et le contenu de démo.
 */
export async function initDemoDatabase(
  db: Database,
  { migrate, password }: InitDemoDeps,
): Promise<void> {
  if (await usersTableExists(db)) await assertDemoOnlyDatabase(db);
  await migrate();
  await assertDemoOnlyDatabase(db);
  await seedDemo(db, await argon2.hash(password));
}
