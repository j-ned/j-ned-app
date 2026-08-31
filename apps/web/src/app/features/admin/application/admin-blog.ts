import {
  Component,
  DestroyRef,
  inject,
  signal,
  computed,
  ChangeDetectionStrategy,
} from '@angular/core';
import { rxResource, takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { firstValueFrom } from 'rxjs';
import { BlogGateway } from '@features/blog/domain/gateways/blog.gateway';
import type { BlogPost, BlogPostInput } from '@features/blog/domain/models/blog-post.model';
import { AppTag } from '@shared/ui/tag';
import { Button } from '@shared/ui/button';
import { ToastStore } from '@shared/ui/toast-store';
import { AdminBlogForm } from './components/admin-blog-form';

@Component({
  selector: 'app-admin-blog',
  imports: [AppTag, Button, AdminBlogForm],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  template: `
    <div class="p-6">
      @let editingValue = editing();

      <div class="flex items-center justify-between mb-6">
        <h1 class="text-2xl font-bold text-foreground">Blog</h1>
        @if (editingValue === undefined) {
          <app-button (click)="startCreate()">Nouvel article</app-button>
        }
      </div>

      @if (editingValue !== undefined) {
        <app-admin-blog-form
          [post]="editingValue === 'new' ? undefined : editingValue"
          (saved)="onSaved($event, editingValue === 'new' ? undefined : editingValue.id)"
          (cancelled)="editing.set(undefined)"
        />
      } @else {
        <table class="w-full text-sm">
          <thead>
            <tr class="text-left text-muted">
              <th class="py-2">Titre</th>
              <th class="py-2">Statut</th>
              <th class="py-2">Likes</th>
              <th class="py-2"></th>
            </tr>
          </thead>
          <tbody>
            @for (post of posts(); track post.id) {
              <tr class="border-t border-foreground/8">
                <td class="py-2">{{ post.title }}</td>
                <td class="py-2">
                  <app-tag
                    [value]="post.status"
                    [severity]="post.status === 'published' ? 'success' : 'secondary'"
                  />
                </td>
                <td class="py-2">{{ post.likesCount }}</td>
                <td class="py-2 text-right space-x-2">
                  <button
                    type="button"
                    class="text-primary hover:underline"
                    (click)="editing.set(post)"
                  >
                    Modifier
                  </button>
                  <button
                    type="button"
                    class="text-status-error hover:underline"
                    (click)="remove(post.id)"
                  >
                    Supprimer
                  </button>
                </td>
              </tr>
            } @empty {
              <tr>
                <td colspan="4" class="py-8 text-center text-muted">Aucun article</td>
              </tr>
            }
          </tbody>
        </table>
      }
    </div>
  `,
})
export class AdminBlog {
  private readonly gateway = inject(BlogGateway);
  private readonly toast = inject(ToastStore);
  private readonly destroyRef = inject(DestroyRef);

  private readonly postsResource = rxResource({
    stream: () => this.gateway.getAllPostsForAdmin(),
  });

  // Non protected (comme AdminProjects.projects/editingId) : ces signaux sont assertés
  // directement par les tests, en plus d'être lus par le template.
  readonly posts = computed(() => this.postsResource.value() ?? []);

  readonly editing = signal<BlogPost | 'new' | undefined>(undefined);

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

  remove(id: string): void {
    const snapshot = this.postsResource.value() ?? [];
    this.postsResource.update((list) => (list ?? []).filter((p) => p.id !== id));

    this.gateway
      .deletePost(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () =>
          this.toast.add({ severity: 'success', summary: 'Succès', detail: 'Article supprimé' }),
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
    this.postsResource.reload();
    this.toast.add({ severity: 'success', summary: 'Succès', detail: 'Article enregistré' });
  }
}
