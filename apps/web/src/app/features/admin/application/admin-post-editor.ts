import { Component, computed, inject, input, linkedSignal, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { Router, RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { BlogGateway } from '@features/blog/domain/gateways/blog.gateway';
import type { BlogPost, BlogPostInput } from '@features/blog/domain/models/blog-post.model';
import { withValidationDetail } from '@shared/api/with-validation-detail';
import { AppIcon } from '@shared/icons/app-icon';
import { ConfirmDialog } from '@shared/ui/confirm-dialog';
import { LoadError } from '@shared/ui/load-error';
import { loadState } from '@shared/ui/load-state';
import { AppSkeleton } from '@shared/ui/skeleton';
import { ToastStore } from '@shared/ui/toast-store';
import { AdminFormToc } from './components/admin-form-toc';
import { AdminPostForm } from './components/admin-post-form';
import { AdminPostPreview } from './components/admin-post-preview';
import { AdminSaveBar } from './components/admin-save-bar';
import { countChangedFields } from './count-draft-changes';
import { toFormTocEntries, type FormTocSection } from './form-toc-entries';
import { LeaveConfirmation } from './leave-confirmation';
import { findPostById, toPostDraft, toPreviewPost, type PostDraft } from './post-draft';
import type { LeaveConfirmable } from './unsaved-changes-guard';

type EditedPost = PostDraft & {
  readonly tags: ReadonlySet<string>;
  readonly cover: File | null;
};

const FORM_SECTIONS: readonly FormTocSection<EditedPost>[] = [
  { id: 'post-article', label: '01 · Article', fields: ['title', 'excerpt', 'tags'] },
  { id: 'post-content', label: '02 · Contenu', fields: ['contentMarkdown'] },
  { id: 'post-cover', label: '03 · Couverture', fields: ['cover'] },
  { id: 'post-publication', label: '04 · Publication', fields: ['status'] },
];

const toEditedPost = (post: BlogPost | null): EditedPost => ({
  ...toPostDraft(post),
  tags: new Set(post?.tags ?? []),
  cover: null,
});

@Component({
  selector: 'app-admin-post-editor',
  imports: [
    RouterLink,
    AppIcon,
    LoadError,
    AppSkeleton,
    ConfirmDialog,
    AdminPostForm,
    AdminPostPreview,
    AdminFormToc,
    AdminSaveBar,
  ],
  host: { '(window:beforeunload)': 'warnBeforeUnload($event)' },
  template: `
    <header class="grid gap-6 pb-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end lg:gap-12">
      <div>
        <nav data-testid="admin-breadcrumb" aria-label="Fil d'Ariane">
          <ol class="flex flex-wrap items-center gap-2 font-mono text-[0.8125rem] text-muted">
            <li>
              <a
                data-testid="admin-breadcrumb-posts"
                routerLink="/admin/blog"
                class="inline-flex min-h-11 items-center text-primary hover:underline"
              >
                Articles
              </a>
            </li>
            <li aria-hidden="true">/</li>
            <li data-testid="admin-breadcrumb-current" aria-current="page">{{ heading() }}</li>
          </ol>
        </nav>
        <h1
          data-testid="admin-page-title"
          class="mt-1.5 text-[2.5rem] leading-none font-extrabold tracking-[-0.04em] text-balance lg:text-[clamp(2.25rem,3.4vw,3.25rem)]"
        >
          {{ heading() }}
        </h1>
        <p class="mt-3 max-w-[60ch] text-base text-muted lg:text-[1.0625rem]">
          Un article publié part en ligne au prochain déploiement, quelques minutes après
          l'enregistrement.
        </p>
      </div>
      <div class="flex flex-wrap gap-2.5 lg:justify-end">
        <a
          data-testid="admin-post-preview-link"
          routerLink="."
          fragment="apercu"
          class="link-btn-outline 2xl:hidden"
        >
          <app-icon name="eye" [size]="16" />Voir l'aperçu
        </a>
      </div>
    </header>

    @switch (state()) {
      @case ('loading') {
        <div
          data-testid="admin-post-editor-loading"
          role="status"
          class="grid gap-5 2xl:max-w-[calc(100%-28.5rem)]"
        >
          <span class="sr-only">Chargement de l'article…</span>
          <app-skeleton class="block h-12 rounded-md" />
          <app-skeleton class="block h-20 rounded-md" />
          <app-skeleton class="block h-12 rounded-md" />
          <app-skeleton class="block h-60 rounded-md" />
        </div>
      }
      @case ('error') {
        <app-load-error
          message="L'article n'a pas pu être chargé. Vérifiez votre connexion, puis réessayez."
          (retry)="postsResource.reload()"
        />
      }
      @case ('empty') {
        <p data-testid="admin-post-editor-missing" class="py-8 text-center text-muted">
          Cet article n'existe pas ou a été supprimé.
        </p>
      }
      @default {
        <div class="grid items-start gap-10 2xl:grid-cols-[minmax(0,1fr)_25rem] 2xl:gap-14">
          <div class="min-w-0">
            <app-admin-post-form
              [(value)]="draft"
              [(tags)]="tags"
              [persistedCover]="saved()?.coverImage ?? ''"
              (submitted)="save($event)"
              [coverResetToken]="coverResetToken()"
              (coverSelected)="pendingCover.set($event)"
              (coverCleared)="pendingCover.set(null)"
              (coverRejected)="rejectCover()"
            />
            <app-admin-save-bar
              class="mt-10"
              formId="post-form"
              cancelRoute="/admin/blog"
              [changes]="changes()"
              [submitting]="saving()"
            />
          </div>
          <div
            id="apercu"
            data-testid="admin-post-aside"
            class="grid scroll-mt-6 gap-3.5 2xl:sticky 2xl:top-6"
          >
            <app-admin-post-preview [post]="preview()" [pendingCover]="pendingCover() !== null" />
            <app-admin-form-toc [sections]="toc()" />
          </div>
        </div>
      }
    }

    @if (state() === 'error' || state() === 'empty') {
      <p class="text-center">
        <a
          data-testid="admin-post-editor-back"
          routerLink="/admin/blog"
          class="inline-flex min-h-11 items-center text-sm text-primary hover:underline"
        >
          Retour aux articles
        </a>
      </p>
    }

    <app-confirm-dialog
      [open]="leave.asked()"
      heading="Quitter sans enregistrer&#8239;?"
      confirmLabel="Quitter sans enregistrer"
      cancelLabel="Continuer l'édition"
      (confirmed)="leave.answer(true)"
      (cancelled)="leave.answer(false)"
    >
      Les modifications non enregistrées de cet article seront perdues.
    </app-confirm-dialog>
  `,
})
export class AdminPostEditor implements LeaveConfirmable {
  private readonly gateway = inject(BlogGateway);
  private readonly toast = inject(ToastStore);
  private readonly router = inject(Router);

  readonly id = input<string>();

  protected readonly postsResource = rxResource({
    params: () => this.id(),
    stream: () => this.gateway.getAllPostsForAdmin(),
  });

  private readonly loaded = computed(() => {
    const id = this.id();
    return id && this.postsResource.hasValue()
      ? findPostById(this.postsResource.value(), id)
      : null;
  });

  protected readonly state = computed(() =>
    this.id() ? loadState(this.postsResource, () => this.loaded() === null) : 'ready',
  );
  protected readonly saved = linkedSignal<BlogPost | null>(() => this.loaded());
  protected readonly draft = linkedSignal(() => toPostDraft(this.loaded()));
  protected readonly tags = linkedSignal<ReadonlySet<string>>(
    () => new Set(this.loaded()?.tags ?? []),
  );
  protected readonly pendingCover = signal<File | null>(null);
  protected readonly coverResetToken = signal(0);
  protected readonly saving = signal(false);
  protected readonly leave = new LeaveConfirmation();

  private readonly baseline = linkedSignal(() => toEditedPost(this.loaded()));
  private readonly edited = computed<EditedPost>(() => ({
    ...this.draft(),
    tags: this.tags(),
    cover: this.pendingCover(),
  }));

  protected readonly heading = computed(
    () => this.saved()?.title ?? (this.id() ? 'Modifier un article' : 'Nouvel article'),
  );
  protected readonly changes = computed(() => countChangedFields(this.edited(), this.baseline()));
  protected readonly toc = computed(() =>
    toFormTocEntries(FORM_SECTIONS, this.edited(), this.baseline()),
  );
  protected readonly preview = computed(() =>
    toPreviewPost(this.draft(), this.tags(), this.saved()),
  );

  canLeave(): boolean | Promise<boolean> {
    return this.changes() === 0 || this.leave.ask();
  }

  protected warnBeforeUnload(event: BeforeUnloadEvent): void {
    if (this.changes() > 0) event.preventDefault();
  }

  protected rejectCover(): void {
    this.pendingCover.set(null);
    this.coverResetToken.update((token) => token + 1);
    this.notify('error', 'Seules les images sont acceptées.');
  }

  // Une couverture refusée après l'écriture laisse l'article enregistré : la page le traite ainsi.
  protected async save(payload: BlogPostInput): Promise<void> {
    const id = this.id();
    this.saving.set(true);
    try {
      let saved: BlogPost;
      try {
        saved = await firstValueFrom(
          id ? this.gateway.updatePost(id, payload) : this.gateway.createPost(payload),
        );
      } catch (err: unknown) {
        this.notify(
          'error',
          withValidationDetail("Erreur lors de l'enregistrement de l'article", err),
        );
        return;
      }
      const coverSent = await this.uploadCover(saved.id);
      this.gateway.invalidateAdminPosts();
      if (coverSent && id) this.postsResource.reload();
      this.notify('success', 'Article enregistré');
      this.saved.set(saved);
      this.pendingCover.set(null);
      this.coverResetToken.update((token) => token + 1);
      this.baseline.set(this.edited());
      if (!id) await this.router.navigate(['/admin/blog', saved.id], { replaceUrl: true });
    } finally {
      this.saving.set(false);
    }
  }

  private async uploadCover(id: string): Promise<boolean> {
    const cover = this.pendingCover();
    if (!cover) return false;
    try {
      await firstValueFrom(this.gateway.uploadCoverImage(cover, id));
      return true;
    } catch (err: unknown) {
      this.notify(
        'warn',
        withValidationDetail(
          "Article enregistré, mais l'envoi de l'image a échoué. Réessayez.",
          err,
        ),
      );
      return false;
    }
  }

  private notify(severity: 'success' | 'warn' | 'error', detail: string): void {
    const summary = { success: 'Succès', warn: 'Attention', error: 'Erreur' }[severity];
    this.toast.add({ severity, summary, detail });
  }
}
