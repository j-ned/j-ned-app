import { Component, computed, inject, input, linkedSignal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { Router, RouterLink } from '@angular/router';
import { firstValueFrom, map, type Observable } from 'rxjs';
import { ProjectsGateway } from '@features/projects/domain/gateways/projects.gateway';
import type { ProjectImage, ProjectInput } from '@features/projects/domain/models/project.model';
import { AppIcon } from '@shared/icons/app-icon';
import { Button } from '@shared/ui/button';
import { loadState, resourceValueOr } from '@shared/ui/load-state';
import { ToastStore } from '@core/notifications/toast-store';
import { AdminEditorFrame } from '../../application/components/admin-editor-frame';
import { AdminFormToc } from '../../application/components/admin-form-toc';
import { AdminPageHeader } from '../../application/components/admin-page-header';
import { AdminProjectForm } from '../../application/components/admin-project-form';
import { AdminProjectGallerySection } from '../../application/components/admin-project-gallery-section';
import { AdminProjectPreview } from '../../application/components/admin-project-preview';
import { AdminSaveBar } from '../../application/components/admin-save-bar';
import { EditorDraft } from '../../application/editor-draft';
import { KnownVersion } from '../../application/known-version';
import { NewerVersionCheck, type EditedVersion } from '../../application/newer-version-check';
import { toPreviewProject, toProjectDraft } from '../../application/project-draft';
import { isStaleVersion } from '../../application/is-stale-version';
import type { LeaveConfirmable } from '../../application/unsaved-changes-guard';
import {
  PROJECT_EDITOR_COPY,
  PROJECT_FORM_SECTIONS,
  projectCoverFailure,
  projectSaveFailure,
} from './project-editor-copy';

@Component({
  selector: 'app-admin-project-editor',
  imports: [
    RouterLink,
    AppIcon,
    Button,
    AdminEditorFrame,
    AdminProjectForm,
    AdminProjectGallerySection,
    AdminProjectPreview,
    AdminFormToc,
    AdminPageHeader,
    AdminSaveBar,
  ],
  host: { '(window:beforeunload)': 'draft.warnBeforeUnload($event)' },
  template: `
    <app-admin-page-header
      [heading]="heading()"
      [parent]="{ label: 'Projets', route: '/admin/projects' }"
    >
      <p>
        Les changements sont visibles sur le site au plus une seconde après l'enregistrement, au
        rechargement de la page.
      </p>
      <div adminPageAside class="flex flex-wrap gap-2.5 lg:justify-end">
        <a
          appButton
          variant="outlined"
          data-testid="admin-project-preview-link"
          routerLink="."
          fragment="apercu"
          class="2xl:hidden"
        >
          <app-icon name="eye" [size]="16" />Voir l'aperçu
        </a>
        @if (draft.saved(); as project) {
          <a
            appButton
            variant="outlined"
            data-testid="admin-project-public-link"
            [href]="'/projects/' + project.slug"
            target="_blank"
            rel="noopener noreferrer"
          >
            <app-icon name="external-link" [size]="16" />Voir la fiche<span class="sr-only">
              publique de {{ project.title }} (nouvel onglet)</span
            >
          </a>
        }
      </div>
    </app-admin-page-header>

    <app-admin-editor-frame
      [state]="state()"
      [copy]="PROJECT_EDITOR_COPY"
      [leaveAsked]="draft.leave.asked()"
      [newerVersion]="newerVersion.detected()"
      [reloaded]="newerVersion.reloaded()"
      [overwriteAsked]="newerVersion.overwrite.asked()"
      [changes]="draft.changes()"
      (retry)="projectResource.reload()"
      (reloadLatest)="newerVersion.reload()"
      (overwriteAnswered)="newerVersion.overwrite.answer($event)"
      (leaveAnswered)="draft.leave.answer($event)"
    >
      <ng-template #editorForm>
        <app-admin-project-form
          [(value)]="draft.value"
          [persistedCover]="draft.saved()?.image ?? ''"
          (submitted)="save($event)"
          [coverResetToken]="draft.coverResetToken()"
          (coverSelected)="draft.selectCover($event)"
          (coverCleared)="draft.clearCover()"
          (coverRejected)="draft.rejectCover()"
        />
        <app-admin-project-gallery-section
          [projectId]="id()"
          [images]="gallery()"
          (galleryChange)="gallery.set($event)"
          (versionWritten)="knownVersion.adopt($event)"
        />
        <app-admin-save-bar
          class="mt-10"
          formId="project-form"
          cancelRoute="/admin/projects"
          [changes]="draft.changes()"
          [submitting]="draft.saving()"
        />
      </ng-template>
      <ng-template #editorAside>
        <app-admin-project-preview
          [project]="preview()"
          [pendingCover]="draft.pendingCover() !== null"
        />
        <app-admin-form-toc [sections]="draft.toc()" />
      </ng-template>
    </app-admin-editor-frame>
  `,
})
export class AdminProjectEditor implements LeaveConfirmable {
  private readonly gateway = inject(ProjectsGateway);
  private readonly toast = inject(ToastStore);
  private readonly router = inject(Router);

  readonly id = input<string>();

  protected readonly PROJECT_EDITOR_COPY = PROJECT_EDITOR_COPY;

  protected readonly projectResource = rxResource({
    params: () => this.id(),
    stream: ({ params }) => this.gateway.getProjectById(params),
  });

  private readonly loaded = computed(() => resourceValueOr(this.projectResource, null));

  protected readonly state = computed(() =>
    this.id() ? loadState(this.projectResource, () => this.loaded() === null) : 'ready',
  );
  protected readonly draft = new EditorDraft({
    loaded: this.loaded,
    toDraft: toProjectDraft,
    sections: PROJECT_FORM_SECTIONS,
  });
  protected readonly knownVersion = new KnownVersion(this.draft.saved);
  protected readonly newerVersion = new NewerVersionCheck({
    edited: (): EditedVersion | null => {
      const saved = this.draft.saved();
      return saved ? { id: saved.id, version: this.knownVersion.value() } : null;
    },
    readLatest: (id): Observable<number | null> =>
      this.gateway
        .getProjectById(id, { background: true })
        .pipe(map((project) => project?.version ?? null)),
    reload: (): void => {
      this.projectResource.reload();
    },
    paused: this.draft.saving,
    dirty: (): boolean => this.draft.changes() > 0,
  });
  protected readonly gallery = linkedSignal<readonly ProjectImage[]>(
    () => this.loaded()?.gallery ?? [],
  );

  protected readonly heading = computed(
    () => this.draft.saved()?.title ?? (this.id() ? 'Modifier un projet' : 'Nouveau projet'),
  );
  protected readonly preview = computed(() =>
    toPreviewProject(this.draft.value(), this.draft.saved()),
  );

  canLeave(): boolean | Promise<boolean> {
    return this.draft.canLeave();
  }

  protected async save(payload: ProjectInput): Promise<void> {
    const decision = await this.newerVersion.beforeSave();
    if (!decision.proceed) return;
    const id = this.id();
    const result = await this.draft.save(
      () =>
        firstValueFrom(
          id
            ? this.gateway.updateProject(id, payload, decision.version ?? undefined)
            : this.gateway.createProject(payload),
        ),
      (cover, project) =>
        firstValueFrom(
          this.gateway.uploadImage(
            cover,
            project.id,
            Math.max(project.version, this.knownVersion.value()),
          ),
        ),
    );
    if (!result) return;
    if (!result.success) {
      if (isStaleVersion(result.error)) this.newerVersion.reportConflict();
      this.toast.add({
        severity: 'error',
        detail: projectSaveFailure(result.error, id !== undefined),
      });
      return;
    }
    const { saved, cover } = result.data;
    if (cover.status === 'failed') {
      if (isStaleVersion(cover.error)) this.newerVersion.reportConflict();
      this.toast.add({ severity: 'warn', detail: projectCoverFailure(cover.error, Boolean(id)) });
    }
    if (cover.status === 'sent' && id) this.projectResource.reload();
    this.toast.add({ severity: 'success', detail: id ? 'Projet mis à jour' : 'Projet créé' });
    if (!id) await this.router.navigate(['/admin/projects', saved.id], { replaceUrl: true });
  }
}
