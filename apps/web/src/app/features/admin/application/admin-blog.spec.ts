import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { of, throwError } from 'rxjs';
import { AdminBlog } from './admin-blog';
import { BlogGateway } from '@features/blog/domain/gateways/blog.gateway';
import type { BlogPost, BlogPostInput } from '@features/blog/domain/models/blog-post.model';
import { ToastStore } from '@shared/ui/toast-store';

const post = (p: Partial<BlogPost> = {}): BlogPost => ({
  id: '1',
  title: 'Article 1',
  slug: 'article-1',
  excerpt: 'Résumé',
  contentMarkdown: '# Contenu',
  coverImage: '',
  tags: ['Angular'],
  status: 'draft',
  likesCount: 0,
  publishedAt: null,
  ...p,
});

const input = (p: Partial<BlogPostInput> = {}): BlogPostInput => ({
  title: 'Nouveau',
  excerpt: 'Résumé',
  contentMarkdown: '# Contenu',
  tags: [],
  status: 'draft',
  ...p,
});

function makeBlogGateway(overrides: Partial<BlogGateway> = {}): BlogGateway {
  return {
    getPublishedPosts: () => of([]),
    getAllPostsForAdmin: () => of([]),
    getPostBySlug: () => of(post()),
    createPost: () => of(post()),
    updatePost: () => of(post()),
    deletePost: () => of(undefined),
    uploadCoverImage: () => of('uploaded-key'),
    likePost: () => of({ likesCount: 1 }),
    ...overrides,
  } as BlogGateway;
}

async function setup(
  gateway: BlogGateway = makeBlogGateway(),
): Promise<{
  component: AdminBlog;
  toast: { add: ReturnType<typeof vi.fn> };
  fixture: ComponentFixture<AdminBlog>;
}> {
  const toast = { add: vi.fn() };
  TestBed.configureTestingModule({
    providers: [
      { provide: BlogGateway, useValue: gateway },
      { provide: ToastStore, useValue: toast },
    ],
    schemas: [NO_ERRORS_SCHEMA],
  });
  const fixture = TestBed.createComponent(AdminBlog);
  fixture.detectChanges();
  await fixture.whenStable();
  fixture.detectChanges();
  return { component: fixture.componentInstance, toast, fixture };
}

describe('AdminBlog', () => {
  it('charge les articles depuis le gateway', async () => {
    const { component } = await setup(
      makeBlogGateway({
        getAllPostsForAdmin: () => of([post({ id: '1' }), post({ id: '2' })]),
      }),
    );
    expect(component.posts().map((p) => p.id)).toEqual(['1', '2']);
  });

  it('affiche la date de publication (ou « Brouillon ») dans la colonne Date', async () => {
    const { fixture } = await setup(
      makeBlogGateway({
        getAllPostsForAdmin: () =>
          of([
            post({ id: '1', publishedAt: '2026-08-01T00:00:00Z' }),
            post({ id: '2', publishedAt: null }),
          ]),
      }),
    );

    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('2026');
    expect(text).toContain('Brouillon');
  });

  describe('onSaved (création)', () => {
    it('crée l’article, ferme le formulaire et notifie le succès (sans image)', async () => {
      const { component, toast } = await setup(
        makeBlogGateway({ createPost: () => of(post({ id: '99' })) }),
      );
      component.editing.set('new');

      await component.onSaved({ data: input(), file: null }, undefined);

      expect(component.editing()).toBeUndefined();
      expect(toast.add).toHaveBeenCalledWith(expect.objectContaining({ severity: 'success' }));
    });

    it('notifie une erreur et laisse le formulaire ouvert si la création échoue', async () => {
      const { component, toast } = await setup(
        makeBlogGateway({ createPost: () => throwError(() => new Error('boom')) }),
      );
      component.editing.set('new');

      await component.onSaved({ data: input(), file: null }, undefined);

      expect(component.editing()).toBe('new');
      expect(toast.add).toHaveBeenCalledWith(expect.objectContaining({ severity: 'error' }));
    });

    it(
      'clôt quand même le formulaire (article déjà créé) mais avertit si l’upload de l’image échoue',
      async () => {
        const { component, toast } = await setup(
          makeBlogGateway({
            createPost: () => of(post({ id: '99' })),
            uploadCoverImage: () => throwError(() => new Error('upload')),
          }),
        );
        component.editing.set('new');

        await component.onSaved({ data: input(), file: new File([], 'cover.png') }, undefined);

        // L'article est déjà persisté côté serveur : le formulaire doit se fermer pour éviter
        // qu'un resubmit ne crée un doublon, avec un toast distinct pour l'échec d'upload.
        expect(component.editing()).toBeUndefined();
        expect(toast.add).toHaveBeenCalledWith(expect.objectContaining({ severity: 'warn' }));
        expect(toast.add).toHaveBeenCalledWith(expect.objectContaining({ severity: 'success' }));
      },
    );
  });

  describe('onSaved (édition)', () => {
    it('met à jour l’article, ferme le formulaire et notifie le succès', async () => {
      const { component, toast } = await setup(
        makeBlogGateway({ updatePost: () => of(post({ id: '1', title: 'Modifié' })) }),
      );
      component.editing.set(post({ id: '1' }));

      await component.onSaved({ data: input({ title: 'Modifié' }), file: null }, '1');

      expect(component.editing()).toBeUndefined();
      expect(toast.add).toHaveBeenCalledWith(expect.objectContaining({ severity: 'success' }));
    });

    it('notifie une erreur si la mise à jour échoue', async () => {
      const { component, toast } = await setup(
        makeBlogGateway({ updatePost: () => throwError(() => new Error('boom')) }),
      );
      component.editing.set(post({ id: '1' }));

      await component.onSaved({ data: input(), file: null }, '1');

      expect(component.editing()).toEqual(post({ id: '1' }));
      expect(toast.add).toHaveBeenCalledWith(expect.objectContaining({ severity: 'error' }));
    });
  });

  describe('remove', () => {
    it('retire l’article de façon optimiste et notifie le succès', async () => {
      const { component, toast } = await setup(
        makeBlogGateway({
          getAllPostsForAdmin: () => of([post({ id: '1' }), post({ id: '2' })]),
          deletePost: () => of(undefined),
        }),
      );
      component.remove('1');
      expect(component.posts().map((p) => p.id)).toEqual(['2']);
      expect(toast.add).toHaveBeenCalledWith(expect.objectContaining({ severity: 'success' }));
    });

    it('restaure la liste et notifie une erreur si la suppression échoue', async () => {
      const { component, toast } = await setup(
        makeBlogGateway({
          getAllPostsForAdmin: () => of([post({ id: '1' }), post({ id: '2' })]),
          deletePost: () => throwError(() => new Error('boom')),
        }),
      );
      component.remove('1');
      expect(component.posts().map((p) => p.id)).toEqual(['1', '2']);
      expect(toast.add).toHaveBeenCalledWith(expect.objectContaining({ severity: 'error' }));
    });
  });
});
