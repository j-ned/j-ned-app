import { randomUUID } from 'node:crypto';
import { resolve } from 'node:path';
import { eq } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';
import { BlogContentImagesService } from './blog/blog-content-images.service';
import { BlogService } from './blog/blog.service';
import type { UploadedFile } from './common/http';
import {
  ConflictException,
  NotFoundException,
  PreconditionFailedException,
  UnprocessableEntityException,
} from './common/http-errors';
import type { Database } from './database/drizzle.types';
import { blogPosts, projects, schema } from './database/schema';
import { ProjectImagesService } from './projects/project-images.service';
import { ProjectsService } from './projects/projects.service';
import {
  ImageOptimizer,
  type OptimizedImage,
} from './storage/image-optimizer.service';
import { StorageService } from './storage/storage.service';
import { defined } from './testing/defined';

// Version des articles et des projets sur un vrai Postgres : écriture conditionnelle, incréments,
// course entre deux enregistrements. Base jetable créée sur le serveur de `PROFILE_IT_DATABASE_URL`
// (migrée, supprimée à la fin) : `PROFILE_IT_DATABASE_URL=… pnpm test -- content-version`.
const SERVER_URL = process.env.PROFILE_IT_DATABASE_URL;
const LOCK_WAIT_ROUNDS = 500;

class MemoryStorage extends StorageService {
  constructor() {
    super(null);
  }
  override upload(): Promise<void> {
    return Promise.resolve();
  }
  override delete(): Promise<void> {
    return Promise.resolve();
  }
  override getPublicUrl(bucket: string, key: string): string {
    return `/storage/${bucket}/${key}`;
  }
}

// Sans sharp : l'octet envoyé est « l'image optimisée ».
class IdentityOptimizer extends ImageOptimizer {
  override optimize(input: Buffer): Promise<OptimizedImage> {
    return Promise.resolve({
      buffer: input,
      mimetype: 'image/avif',
      ext: 'avif',
      width: 1600,
      height: 900,
    });
  }
}

const aFile = (bytes: string): UploadedFile => ({
  buffer: Buffer.from(bytes),
  mimetype: 'image/png',
  originalname: 'capture.png',
  size: bytes.length,
});

(SERVER_URL ? describe : describe.skip)('content version on Postgres', () => {
  const databaseName = `content_version_it_${randomUUID().replaceAll('-', '')}`;
  let admin: ReturnType<typeof postgres>;
  let client: ReturnType<typeof postgres>;
  let db: Database;
  let blog: BlogService;
  let projectsService: ProjectsService;
  let gallery: ProjectImagesService;

  beforeAll(async () => {
    admin = postgres(SERVER_URL ?? '', { max: 1, onnotice: () => {} });
    await admin`CREATE DATABASE ${admin(databaseName)}`;
    const url = new URL(SERVER_URL ?? '');
    url.pathname = `/${databaseName}`;
    client = postgres(url.toString(), { max: 10, onnotice: () => {} });
    db = drizzle(client, { schema, casing: 'snake_case' });
    await migrate(db, { migrationsFolder: resolve(__dirname, '../drizzle') });

    const storage = new MemoryStorage();
    const images = new IdentityOptimizer();
    gallery = new ProjectImagesService(db, storage, images);
    blog = new BlogService(
      db,
      storage,
      images,
      new BlogContentImagesService(db, storage, images),
    );
    projectsService = new ProjectsService(db, storage, images, gallery);
  });

  afterAll(async () => {
    await client.end();
    await admin`DROP DATABASE IF EXISTS ${admin(databaseName)} WITH (FORCE)`;
    await admin.end();
  });

  // Attente d'une condition : une requête de la base de test attend un verrou. Bornée, et cède la
  // main entre deux tours pour laisser avancer la requête observée.
  const lockWaiter = async (): Promise<void> => {
    for (let round = 0; round < LOCK_WAIT_ROUNDS; round += 1) {
      const [row] = await admin<{ waiting: number }[]>`
        SELECT count(*)::int AS waiting FROM pg_stat_activity
        WHERE datname = ${databaseName} AND wait_event_type = 'Lock'`;
      if ((row?.waiting ?? 0) > 0) return;
      await new Promise<void>((resolve) => setImmediate(resolve));
    }
    throw new Error(
      `Aucune requête en attente de verrou après ${LOCK_WAIT_ROUNDS} relectures de pg_stat_activity`,
    );
  };

  const newPost = () =>
    blog.create({
      title: `Article ${randomUUID()}`,
      excerpt: 'Résumé',
      contentMarkdown: '# Corps',
      status: 'published',
    });
  const newProject = () =>
    projectsService.create({
      title: `Projet ${randomUUID()}`,
      category: 'Web',
      description: 'Description',
    });
  const postVersion = async (id: string) =>
    defined(
      (
        await db
          .select({ version: blogPosts.version })
          .from(blogPosts)
          .where(eq(blogPosts.id, id))
      )[0],
    ).version;
  const projectVersion = async (id: string) =>
    defined(
      (
        await db
          .select({ version: projects.version })
          .from(projects)
          .where(eq(projects.id, id))
      )[0],
    ).version;

  describe('blog posts', () => {
    it('Given a new post, When created, Then it starts at version 1, exposed in every read', async () => {
      const created = await newPost();

      expect(created.version).toBe(1);
      expect((await blog.findBySlug(created.slug)).version).toBe(1);
      const listed = (await blog.findAdminSummaries()).find(
        (post) => post.id === created.id,
      );
      expect(listed?.version).toBe(1);
    });

    it('Given a post at version 1, When patched with If-Match 1, Then it is written at version 2', async () => {
      const post = await newPost();

      const updated = await blog.update(post.id, { excerpt: 'Neuf' }, 1);

      expect(updated).toMatchObject({ excerpt: 'Neuf', version: 2 });
      expect(await postVersion(post.id)).toBe(2);
    });

    it('Given a post at version 2, When patched with If-Match 1, Then 412 and nothing is written', async () => {
      const post = await newPost();
      await blog.update(post.id, { excerpt: 'Ailleurs' }, 1);

      await expect(
        blog.update(post.id, { excerpt: 'Brouillon périmé' }, 1),
      ).rejects.toThrow(PreconditionFailedException);

      const [row] = await db
        .select()
        .from(blogPosts)
        .where(eq(blogPosts.id, post.id));
      expect(row).toMatchObject({ excerpt: 'Ailleurs', version: 2 });
    });

    it('Given no If-Match, When patched over a newer version, Then the write is unconditional as before and still increments', async () => {
      const post = await newPost();
      await blog.update(post.id, { excerpt: 'Ailleurs' }, 1);

      const updated = await blog.update(post.id, { excerpt: 'Sans condition' });

      expect(updated).toMatchObject({ excerpt: 'Sans condition', version: 3 });
    });

    it('Given a deleted post, When patched with If-Match, Then 404, not 412', async () => {
      const post = await newPost();
      await blog.remove(post.id);

      await expect(
        blog.update(post.id, { excerpt: 'Trop tard' }, 1),
      ).rejects.toThrow(NotFoundException);
    });

    it('Given two saves from the same version at once, When both are sent, Then exactly one is written and the other gets 412', async () => {
      const post = await newPost();

      const results = await Promise.allSettled([
        blog.update(post.id, { excerpt: 'Onglet A' }, 1),
        blog.update(post.id, { excerpt: 'Onglet B' }, 1),
      ]);

      const written = results.filter((r) => r.status === 'fulfilled');
      const refused = results.filter(
        (r): r is PromiseRejectedResult => r.status === 'rejected',
      );
      expect(written).toHaveLength(1);
      expect(refused).toHaveLength(1);
      expect(refused[0]?.reason).toBeInstanceOf(PreconditionFailedException);
      expect(await postVersion(post.id)).toBe(2);
    });

    it('Given a save read at version 1 then blocked while another write commits version 2, When it resumes, Then the conditional UPDATE writes nothing and answers 412', async () => {
      const post = await newPost();
      let release = () => {};
      const released = new Promise<void>((resolve) => (release = resolve));
      let locked = () => {};
      const isLocked = new Promise<void>((resolve) => (locked = resolve));
      const other = client.begin(async (tx) => {
        await tx`SELECT id FROM blog_post WHERE id = ${post.id} FOR UPDATE`;
        locked();
        await released;
        await tx`UPDATE blog_post SET version = version + 1, excerpt = 'Ailleurs' WHERE id = ${post.id}`;
      });

      await isLocked;
      // La lecture préalable passe (version 1), l'UPDATE attend le verrou de l'autre transaction.
      const save = blog.update(post.id, { excerpt: 'Brouillon' }, 1);
      const outcome = save.then(
        () => 'written',
        (error: unknown) => error,
      );
      await lockWaiter();
      release();
      await other;

      expect(await outcome).toBeInstanceOf(PreconditionFailedException);
      const [row] = await db
        .select()
        .from(blogPosts)
        .where(eq(blogPosts.id, post.id));
      expect(row).toMatchObject({ excerpt: 'Ailleurs', version: 2 });
    });

    it('Given a post, When its cover is sent then removed, Then each write increments the version', async () => {
      const post = await newPost();

      const withCover = await blog.uploadCoverImage(post.id, aFile('a'), 1);
      const withoutCover = await blog.update(post.id, { coverImage: null }, 2);

      expect(withCover.version).toBe(2);
      expect(withoutCover).toMatchObject({ coverImage: '', version: 3 });
    });

    it('Given a stale version, When a cover is sent, Then 412 and the cover is unchanged', async () => {
      const post = await newPost();
      await blog.update(post.id, { excerpt: 'Ailleurs' }, 1);

      await expect(
        blog.uploadCoverImage(post.id, aFile('b'), 1),
      ).rejects.toThrow(PreconditionFailedException);
      const [row] = await db
        .select()
        .from(blogPosts)
        .where(eq(blogPosts.id, post.id));
      expect(row).toMatchObject({ coverImage: '', version: 2 });
    });

    it('Given a published post, When liked, Then its version is unchanged: a like is not an edit', async () => {
      const post = await newPost();

      await blog.like(post.slug);

      expect(await postVersion(post.id)).toBe(1);
    });
  });

  describe('projects', () => {
    it('Given a new project, When created, Then it starts at version 1, exposed in reads and lists', async () => {
      const created = await newProject();

      expect(created.version).toBe(1);
      expect((await projectsService.findById(created.id)).version).toBe(1);
      const listed = (await projectsService.findAll()).find(
        (project) => project.id === created.id,
      );
      expect(listed?.version).toBe(1);
    });

    it('Given a project at version 1, When patched with If-Match 1 then again with If-Match 1, Then the first is written and the second gets 412', async () => {
      const project = await newProject();

      const updated = await projectsService.update(
        project.id,
        { description: 'Neuve' },
        1,
      );
      await expect(
        projectsService.update(project.id, { description: 'Périmée' }, 1),
      ).rejects.toThrow(PreconditionFailedException);

      expect(updated.version).toBe(2);
      expect(await projectVersion(project.id)).toBe(2);
    });

    it('Given the title of another project, When patched with the current If-Match, Then 409 for the slug, not 412, and nothing is written', async () => {
      const taken = await newProject();
      const project = await newProject();

      await expect(
        projectsService.update(project.id, { title: taken.title }, 1),
      ).rejects.toThrow(ConflictException);
      expect(await projectVersion(project.id)).toBe(1);
    });

    it('Given a project held by a deletion, When an alt text is changed meanwhile, Then 404 once the deletion commits, never a deadlock', async () => {
      const project = await newProject();
      const image = await gallery.upload(project.id, aFile('4'), 'Avant');
      let release = () => {};
      const released = new Promise<void>((resolve) => (release = resolve));
      // Même ordre que `DELETE project` : la ligne du projet d'abord, puis ses captures (cascade).
      let locked = () => {};
      const isLocked = new Promise<void>((resolve) => (locked = resolve));
      const deletion = client.begin(async (tx) => {
        await tx`SELECT id FROM project WHERE id = ${project.id} FOR UPDATE`;
        locked();
        await released;
        await tx`DELETE FROM project WHERE id = ${project.id}`;
      });

      await isLocked;
      const outcome = gallery
        .updateAlt(project.id, image.result.id, 'Pendant')
        .then(
          () => 'written',
          (error: unknown) => error,
        );
      await lockWaiter();
      release();
      await deletion;

      expect(await outcome).toBeInstanceOf(NotFoundException);
    });

    it('Given a deleted project, When patched with If-Match, Then 404', async () => {
      const project = await newProject();
      await projectsService.remove(project.id);

      await expect(
        projectsService.update(project.id, { description: 'Trop tard' }, 1),
      ).rejects.toThrow(NotFoundException);
    });

    it('Given two saves from the same version at once, When both are sent, Then exactly one is written and the other gets 412', async () => {
      const project = await newProject();

      const results = await Promise.allSettled([
        projectsService.update(project.id, { description: 'Onglet A' }, 1),
        projectsService.update(project.id, { description: 'Onglet B' }, 1),
      ]);

      expect(results.filter((r) => r.status === 'fulfilled')).toHaveLength(1);
      const refused = results.filter(
        (r): r is PromiseRejectedResult => r.status === 'rejected',
      );
      expect(
        refused.map((r) => r.reason instanceof PreconditionFailedException),
      ).toEqual([true]);
    });

    it('Given a project, When its cover is sent with If-Match then removed, Then each write increments the version', async () => {
      const project = await newProject();

      const withCover = await projectsService.uploadImage(
        project.id,
        aFile('c'),
        1,
      );
      const withoutCover = await projectsService.update(
        project.id,
        { image: null },
        2,
      );

      expect(withCover.version).toBe(2);
      expect(withoutCover).toMatchObject({ image: '', version: 3 });
    });

    it('Given a project, When its gallery is edited (add, alt text, order, removal), Then each write increments the project version', async () => {
      const project = await newProject();

      const first = await gallery.upload(project.id, aFile('1'), 'Un');
      const second = await gallery.upload(project.id, aFile('2'), 'Deux');
      const alt = await gallery.updateAlt(
        project.id,
        first.result.id,
        'Premier',
      );
      const order = await gallery.reorder(project.id, [
        second.result.id,
        first.result.id,
      ]);
      const removal = await gallery.remove(project.id, second.result.id);

      expect(
        [first, second, alt, order, removal].map((w) => w.projectVersion),
      ).toEqual([2, 3, 4, 5, 6]);
      expect(await projectVersion(project.id)).toBe(6);
    });

    it('Given a gallery write made elsewhere, When the draft from before it is saved with If-Match, Then 412', async () => {
      const project = await newProject();
      await gallery.upload(project.id, aFile('3'), 'Ailleurs');

      await expect(
        projectsService.update(project.id, { description: 'Périmée' }, 1),
      ).rejects.toThrow(PreconditionFailedException);
    });

    it('Given an order that is not the gallery, When reordered, Then 422 and the project version is rolled back', async () => {
      const project = await newProject();
      await gallery.upload(project.id, aFile('5'), 'Seule');

      await expect(gallery.reorder(project.id, [randomUUID()])).rejects.toThrow(
        UnprocessableEntityException,
      );
      expect(await projectVersion(project.id)).toBe(2);
    });

    it('Given an unknown image, When its alt text is changed, Then 404 and the project version is unchanged', async () => {
      const project = await newProject();

      await expect(
        gallery.updateAlt(project.id, randomUUID(), 'Rien'),
      ).rejects.toThrow(NotFoundException);
      expect(await projectVersion(project.id)).toBe(1);
    });
  });
});
