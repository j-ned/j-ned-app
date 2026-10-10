import { Component, computed, inject, input } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { Router, RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { BlogGateway } from '@features/blog/domain/gateways/blog.gateway';
import type { BlogPostInput } from '@features/blog/domain/models/blog-post.model';
import { withValidationDetail } from '@shared/api/with-validation-detail';
import { AppIcon } from '@shared/icons/app-icon';
import { Button } from '@shared/ui/button';
import { loadState } from '@shared/ui/load-state';
import { ToastStore } from '@core/notifications/toast-store';
import {
  AdminEditorFrame,
  type AdminEditorCopy,
} from '../../application/components/admin-editor-frame';
import { AdminFormToc } from '../../application/components/admin-form-toc';
import { AdminPageHeader } from '../../application/components/admin-page-header';
import { AdminPostForm } from '../../application/components/admin-post-form';
import { AdminPostPreview } from '../../application/components/admin-post-preview';
import { AdminSaveBar } from '../../application/components/admin-save-bar';
import { EditorDraft, type EditedDraft } from '../../application/editor-draft';
import type { FormTocSection } from '../../application/form-toc-entries';
import {
  findPostById,
  toPostDraft,
  toPreviewPost,
  type PostDraft,
} from '../../application/post-draft';
import type { LeaveConfirmable } from '../../application/unsaved-changes-guard';

const FORM_SECTIONS: readonly FormTocSection<EditedDraft<PostDraft>>[] = [
  { id: 'post-article', label: '01 · Article', fields: ['title', 'excerpt', 'tags'] },
  { id: 'post-content', label: '02 · Contenu', fields: ['contentMarkdown'] },
  { id: 'post-cover', label: '03 · Couverture', fields: ['cover'] },
  { id: 'post-publication', label: '04 · Publication', fields: ['status'] },
];

const POST_EDITOR_COPY: AdminEditorCopy = {
  testIdPrefix: 'admin-post',
  loading: "Chargement de l'article…",
  loadError: "L'article n'a pas pu être chargé. Vérifiez votre connexion, puis réessayez.",
  missing: "Cet article n'existe pas ou a été supprimé.",
  backRoute: '/admin/blog',
  backLabel: 'Retour aux articles',
  leave: 'Les modifications non enregistrées de cet article seront perdues.',
};

@Component({
  selector: 'app-admin-post-editor',
  imports: [
    RouterLink,
    AppIcon,
    Button,
    AdminEditorFrame,
    AdminPostForm,
    AdminPostPreview,
    AdminFormToc,
    AdminPageHeader,
    AdminSaveBar,
  ],
  host: { '(window:beforeunload)': 'draft.warnBeforeUnload($event)' },
  template: `
    <app-admin-page-header
      [heading]="heading()"
      [parent]="{ label: 'Articles', route: '/admin/blog' }"
    >
      <p>
        Un article publié est visible sur le site au plus une seconde après l'enregistrement, au
        rechargement de la page.
      </p>
      <div adminPageAside class="flex flex-wrap gap-2.5 lg:justify-end">
        <a
          appButton
          variant="outlined"
          data-testid="admin-post-preview-link"
          routerLink="."
          fragment="apercu"
          class="2xl:hidden"
        >
          <app-icon name="eye" [size]="16" />Voir l'aperçu
        </a>
      </div>
    </app-admin-page-header>

    <app-admin-editor-frame
      [state]="state()"
      [copy]="POST_EDITOR_COPY"
      [leaveAsked]="draft.leave.asked()"
      (retry)="postsResource.reload()"
      (leaveAnswered)="draft.leave.answer($event)"
    >
      <ng-template #editorForm>
        <app-admin-post-form
          [(value)]="draft.value"
          [persistedCover]="draft.saved()?.coverImage ?? ''"
          (submitted)="save($event)"
          [coverResetToken]="draft.coverResetToken()"
          (coverSelected)="draft.selectCover($event)"
          (coverCleared)="draft.clearCover()"
          (coverRejected)="rejectCover()"
        />
        <app-admin-save-bar
          class="mt-10"
          formId="post-form"
          cancelRoute="/admin/blog"
          [changes]="draft.changes()"
          [submitting]="draft.saving()"
        />
      </ng-template>
      <ng-template #editorAside>
        <app-admin-post-preview [post]="preview()" [pendingCover]="draft.pendingCover() !== null" />
        <app-admin-form-toc [sections]="draft.toc()" />
      </ng-template>
    </app-admin-editor-frame>
  `,
})
export class AdminPostEditor implements LeaveConfirmable {
  private readonly gateway = inject(BlogGateway);
  private readonly toast = inject(ToastStore);
  private readonly router = inject(Router);

  readonly id = input<string>();

  protected readonly POST_EDITOR_COPY = POST_EDITOR_COPY;

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
  protected readonly draft = new EditorDraft({
    loaded: this.loaded,
    toDraft: toPostDraft,
    sections: FORM_SECTIONS,
  });

  protected readonly heading = computed(
    () => this.draft.saved()?.title ?? (this.id() ? 'Modifier un article' : 'Nouvel article'),
  );
  protected readonly preview = computed(() =>
    toPreviewPost(this.draft.value(), this.draft.saved()),
  );

  canLeave(): boolean | Promise<boolean> {
    return this.draft.canLeave();
  }

  protected rejectCover(): void {
    this.draft.rejectCover();
    this.toast.add({ severity: 'error', detail: 'Seules les images sont acceptées.' });
  }

  protected async save(payload: BlogPostInput): Promise<void> {
    const id = this.id();
    const result = await this.draft.save(
      () =>
        firstValueFrom(
          id ? this.gateway.updatePost(id, payload) : this.gateway.createPost(payload),
        ),
      (cover, postId) => firstValueFrom(this.gateway.uploadCoverImage(cover, postId)),
    );
    if (!result.success) {
      this.toast.add({
        severity: 'error',
        detail: withValidationDetail("Erreur lors de l'enregistrement de l'article", result.error),
      });
      return;
    }
    const { saved, cover } = result.data;
    if (cover.status === 'failed') {
      this.toast.add({
        severity: 'warn',
        detail: withValidationDetail(
          "Article enregistré, mais l'envoi de l'image a échoué. Réessayez.",
          cover.error,
        ),
      });
    }
    this.gateway.invalidateAdminPosts();
    if (cover.status === 'sent' && id) this.postsResource.reload();
    this.toast.add({ severity: 'success', detail: 'Article enregistré' });
    if (!id) await this.router.navigate(['/admin/blog', saved.id], { replaceUrl: true });
  }
}
