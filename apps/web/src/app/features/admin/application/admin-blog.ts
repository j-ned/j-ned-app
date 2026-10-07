import {
  Component,
  DestroyRef,
  inject,
  signal,
  computed,
  viewChild,
  ChangeDetectionStrategy,
} from '@angular/core';
import { DatePipe } from '@angular/common';
import { rxResource, takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { firstValueFrom } from 'rxjs';
import { BlogGateway } from '@features/blog/domain/gateways/blog.gateway';
import type { BlogPost, BlogPostInput } from '@features/blog/domain/models/blog-post.model';
import { Button } from '@shared/ui/button';
import { Stamp } from '@shared/ui/stamp';
import { ToastStore } from '@shared/ui/toast-store';
import { ConfirmDialog } from '@shared/ui/confirm-dialog';
import { LoadError } from '@shared/ui/load-error';
import { loadState } from '@shared/ui/load-state';
import { AppSkeleton } from '@shared/ui/skeleton';
import { AdminBlogForm } from './components/admin-blog-form';
import { AdminPageHeader } from './components/admin-page-header';
import { postsOverline } from './admin-page-copy';

@Component({
  selector: 'app-admin-blog',
  imports: [
    Stamp,
    Button,
    AdminBlogForm,
    AdminPageHeader,
    DatePipe,
    ConfirmDialog,
    LoadError,
    AppSkeleton,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  template: `
    <div>
      @let editingValue = editing();

      <app-admin-page-header [overline]="overline()" heading="Articles">
        Les articles du blog. Publier un article redéploie le site&nbsp;: il est en ligne quelques
        minutes plus tard.
        @if (editingValue === undefined) {
          <div adminPageAside class="flex flex-wrap items-center gap-2.5 lg:justify-end">
            <app-button (click)="startCreate()">Nouvel article</app-button>
          </div>
        }
      </app-admin-page-header>

      @if (editingValue !== undefined) {
        <app-admin-blog-form
          [post]="editingValue === 'new' ? undefined : editingValue"
          (saved)="onSaved($event, editingValue === 'new' ? undefined : editingValue.id)"
          (cancelled)="editing.set(undefined)"
        />
      } @else {
        @switch (listState()) {
          @case ('loading') {
            <div data-testid="admin-posts-loading" role="status" class="space-y-3">
              <span class="sr-only">Chargement des articles…</span>
              <app-skeleton class="block h-12 rounded-md" />
              <app-skeleton class="block h-12 rounded-md" />
              <app-skeleton class="block h-12 rounded-md" />
            </div>
          }
          @case ('error') {
            <app-load-error
              message="Les articles n'ont pas pu être chargés. Vérifiez votre connexion, puis réessayez."
              (retry)="postsResource.reload()"
            />
          }
          @case ('empty') {
            <p data-testid="admin-posts-empty" class="py-8 text-center text-muted">Aucun article</p>
          }
          @default {
            <div data-testid="admin-posts-list" class="admin-table-shell">
              <table class="admin-table">
                <thead>
                  <tr class="text-left text-muted">
                    <th class="admin-th">Titre</th>
                    <th class="admin-th">Statut</th>
                    <th class="admin-th">Date</th>
                    <th class="admin-th">J'aime</th>
                    <th class="admin-th"><span class="sr-only">Actions</span></th>
                  </tr>
                </thead>
                <tbody>
                  @for (row of rows(); track row.post.id) {
                    @let post = row.post;
                    <tr class="admin-row">
                      <td class="admin-td">{{ post.title }}</td>
                      <td class="admin-td">
                        <app-stamp data-testid="admin-post-status">{{ row.statusLabel }}</app-stamp>
                      </td>
                      <td data-testid="admin-post-date" class="admin-td text-muted">
                        @if (post.publishedAt) {
                          {{ post.publishedAt | date: 'd MMM y' }}
                        } @else {
                          Brouillon
                        }
                      </td>
                      <td class="admin-td">{{ post.likesCount }}</td>
                      <td class="admin-td text-right whitespace-nowrap space-x-2">
                        <button
                          type="button"
                          data-testid="admin-post-edit"
                          [attr.aria-label]="row.editLabel"
                          class="inline-flex min-h-11 items-center px-2 text-primary hover:underline"
                          (click)="editing.set(post)"
                        >
                          Modifier
                        </button>
                        <button
                          type="button"
                          data-testid="admin-post-delete"
                          [attr.aria-label]="row.deleteLabel"
                          class="inline-flex min-h-11 items-center px-2 text-status-error hover:underline"
                          (click)="pendingDeletion.set(post)"
                        >
                          Supprimer
                        </button>
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          }
        }
      }
    </div>

    <app-confirm-dialog
      [open]="pendingDeletion() !== null"
      [heading]="deletionCopy().heading"
      [confirmLabel]="deletionCopy().confirm"
      (confirmed)="confirmDeletion()"
      (cancelled)="pendingDeletion.set(null)"
    >
      <p>L'article disparaît du blog au prochain déploiement. Cette action est définitive.</p>
    </app-confirm-dialog>
  `,
})
export class AdminBlog {
  private readonly gateway = inject(BlogGateway);
  private readonly toast = inject(ToastStore);
  private readonly destroyRef = inject(DestroyRef);
  private readonly _pageHeader = viewChild.required(AdminPageHeader);

  protected readonly postsResource = rxResource({
    stream: () => this.gateway.getAllPostsForAdmin(),
  });

  // Non protected (comme AdminProjects.projects/editingId) : ces signaux sont assertés
  // directement par les tests, en plus d'être lus par le template.
  readonly posts = computed(() =>
    this.postsResource.hasValue() ? this.postsResource.value() : [],
  );

  protected readonly rows = computed(() =>
    this.posts().map((post) => ({
      post,
      statusLabel: post.status === 'published' ? 'Publié' : 'Brouillon',
      editLabel: `Modifier\u00a0: ${post.title}`,
      deleteLabel: `Supprimer\u00a0: ${post.title}`,
    })),
  );

  protected readonly overline = computed(() =>
    this.postsResource.hasValue() ? postsOverline(this.postsResource.value()) : '',
  );

  protected readonly listState = computed(() =>
    loadState(this.postsResource, () => this.posts().length === 0),
  );

  readonly editing = signal<BlogPost | 'new' | undefined>(undefined);
  protected readonly pendingDeletion = signal<BlogPost | null>(null);

  protected readonly deletionCopy = computed(() => {
    const title = this.pendingDeletion()?.title ?? '';
    return { heading: `Supprimer l'article ${title}\u202f?`, confirm: `Supprimer ${title}` };
  });

  startCreate(): void {
    this.editing.set('new');
  }

  // Deux surfaces d'erreur distinctes, comme AdminProjects.createProject : si la création/mise à
  // jour échoue, on s'arrête là (rien n'est persisté). Si elle réussit mais que l'upload de
  // l'image échoue ensuite, l'article est déjà sauvegardé côté serveur — on clôt quand même le
  // formulaire (sinon un nouveau submit créerait un doublon) et on prévient via un toast distinct.
  async onSaved(
    event: { data: BlogPostInput; file: File | null },
    editingId: string | undefined,
  ): Promise<void> {
    let saved: BlogPost;
    try {
      saved = editingId
        ? await firstValueFrom(this.gateway.updatePost(editingId, event.data))
        : await firstValueFrom(this.gateway.createPost(event.data));
    } catch {
      this.toast.add({
        severity: 'error',
        summary: 'Erreur',
        detail: "Erreur lors de l'enregistrement de l'article",
      });
      return;
    }

    if (event.file) {
      try {
        await firstValueFrom(this.gateway.uploadCoverImage(event.file, saved.id));
      } catch (err) {
        console.warn('Blog post saved, but cover image upload failed:', err);
        this.toast.add({
          severity: 'warn',
          summary: 'Attention',
          detail: "Article enregistré, mais l'upload de l'image a échoué. Réessayez via Modifier.",
        });
      }
    }

    this.finishSave();
  }

  protected confirmDeletion(): void {
    const post = this.pendingDeletion();
    this.pendingDeletion.set(null);
    this._pageHeader().focusTitle();
    if (post) this.remove(post.id);
  }

  remove(id: string): void {
    const snapshot = this.posts();
    this.postsResource.update((list) => (list ?? []).filter((p) => p.id !== id));

    this.gateway
      .deletePost(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.gateway.invalidateAdminPosts();
          this.toast.add({ severity: 'success', summary: 'Succès', detail: 'Article supprimé' });
        },
        error: () => {
          this.postsResource.set(snapshot);
          this.toast.add({
            severity: 'error',
            summary: 'Erreur',
            detail: "Erreur lors de la suppression de l'article",
          });
        },
      });
  }

  private finishSave(): void {
    this.editing.set(undefined);
    this.gateway.invalidateAdminPosts();
    this.toast.add({ severity: 'success', summary: 'Succès', detail: 'Article enregistré' });
  }
}
