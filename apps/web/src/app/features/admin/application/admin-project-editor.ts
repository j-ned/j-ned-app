import { Component, computed, inject, input, linkedSignal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { Router, RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { ProjectsGateway } from '@features/projects/domain/gateways/projects.gateway';
import type { ProjectImage, ProjectInput } from '@features/projects/domain/models/project.model';
import { HomeGateway } from '@features/home/domain/gateways/home.gateway';
import { withValidationDetail } from '@shared/api/with-validation-detail';
import { AppIcon } from '@shared/icons/app-icon';
import { Button } from '@shared/ui/button';
import { loadState } from '@shared/ui/load-state';
import { ToastStore } from '@core/notifications/toast-store';
import { AdminEditorFrame, type AdminEditorCopy } from './components/admin-editor-frame';
import { AdminFormSection } from './components/admin-form-section';
import { AdminFormToc } from './components/admin-form-toc';
import { AdminPageHeader } from './components/admin-page-header';
import { AdminProjectForm } from './components/admin-project-form';
import { AdminProjectGallery } from './components/admin-project-gallery';
import { AdminProjectPreview } from './components/admin-project-preview';
import { AdminSaveBar } from './components/admin-save-bar';
import { EditorDraft, type EditedDraft } from './editor-draft';
import type { FormTocSection } from './form-toc-entries';
import { toPreviewProject, toProjectDraft, type ProjectDraft } from './project-draft';
import type { LeaveConfirmable } from './unsaved-changes-guard';

const FORM_SECTIONS: readonly FormTocSection<EditedDraft<ProjectDraft>>[] = [
  {
    id: 'project-identity',
    label: '01 · Identité',
    fields: ['title', 'category', 'kind', 'order', 'featured'],
  },
  {
    id: 'project-presentation',
    label: '02 · Présentation',
    fields: ['pitch', 'highlight', 'scope', 'description', 'cover'],
  },
  {
    id: 'project-links',
    label: '03 · Liens',
    fields: ['liveUrl', 'repoUrl', 'repoUrlFront', 'repoUrlBack'],
  },
  {
    id: 'project-stack',
    label: '04 · Choix techniques',
    fields: ['tags', 'techChoices', 'architectureDecisions'],
  },
  { id: 'project-gallery', label: '05 · Galerie', fields: [] },
];

const PROJECT_EDITOR_COPY: AdminEditorCopy = {
  testIdPrefix: 'admin-project',
  loading: 'Chargement du projet…',
  loadError: "Le projet n'a pas pu être chargé. Vérifiez votre connexion, puis réessayez.",
  missing: "Ce projet n'existe pas ou a été supprimé.",
  backRoute: '/admin/projects',
  backLabel: 'Retour aux projets',
  leave: 'Les modifications non enregistrées de ce projet seront perdues.',
};

@Component({
  selector: 'app-admin-project-editor',
  imports: [
    RouterLink,
    AppIcon,
    Button,
    AdminEditorFrame,
    AdminProjectForm,
    AdminFormSection,
    AdminProjectGallery,
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
        Les changements partent en ligne au prochain déploiement, quelques minutes après
        l'enregistrement.
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
      (retry)="projectResource.reload()"
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
          (coverRejected)="rejectCover()"
        />
        <fieldset
          app-admin-form-section
          id="project-gallery"
          number="05"
          heading="Galerie"
          description="Captures de la fiche, dans cet ordre. Chaque capture a un texte alternatif."
          class="mt-8.5"
        >
          @if (id(); as projectId) {
            <app-admin-project-gallery
              [projectId]="projectId"
              [images]="gallery()"
              (galleryChange)="updateGallery($event)"
            />
          } @else {
            <p
              data-testid="admin-project-gallery-pending"
              class="rounded-xs border border-dashed border-line-strong px-5.5 py-6.5 text-sm text-muted"
            >
              Enregistrez le projet pour ajouter des captures.
            </p>
          }
        </fieldset>
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
  private readonly home = inject(HomeGateway);
  private readonly toast = inject(ToastStore);
  private readonly router = inject(Router);

  readonly id = input<string>();

  protected readonly PROJECT_EDITOR_COPY = PROJECT_EDITOR_COPY;

  protected readonly projectResource = rxResource({
    params: () => this.id(),
    stream: ({ params }) => this.gateway.getProjectById(params),
  });

  private readonly loaded = computed(() =>
    this.projectResource.hasValue() ? this.projectResource.value() : null,
  );

  protected readonly state = computed(() =>
    this.id() ? loadState(this.projectResource, () => this.loaded() === null) : 'ready',
  );
  protected readonly draft = new EditorDraft({
    loaded: this.loaded,
    toDraft: toProjectDraft,
    sections: FORM_SECTIONS,
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

  protected rejectCover(): void {
    this.draft.rejectCover();
    this.toast.add({ severity: 'error', detail: 'Seules les images sont acceptées.' });
  }

  protected async save(payload: ProjectInput): Promise<void> {
    const id = this.id();
    const result = await this.draft.save(
      () =>
        firstValueFrom(
          id ? this.gateway.updateProject(id, payload) : this.gateway.createProject(payload),
        ),
      (cover, projectId) => firstValueFrom(this.gateway.uploadImage(cover, projectId)),
    );
    if (!result.success) {
      const failure = id
        ? 'Erreur lors de la mise à jour du projet'
        : 'Erreur lors de la création du projet';
      this.toast.add({ severity: 'error', detail: withValidationDetail(failure, result.error) });
      return;
    }
    const { saved, cover } = result.data;
    if (cover.status === 'failed') {
      const warning = id
        ? "Projet mis à jour, mais l'envoi de l'image a échoué. Réessayez."
        : "Projet créé, mais l'envoi de l'image a échoué. Réessayez depuis sa page.";
      this.toast.add({ severity: 'warn', detail: withValidationDetail(warning, cover.error) });
    }
    this.invalidatePublicCaches();
    if (cover.status === 'sent' && id) this.projectResource.reload();
    this.toast.add({ severity: 'success', detail: id ? 'Projet mis à jour' : 'Projet créé' });
    if (!id) await this.router.navigate(['/admin/projects', saved.id], { replaceUrl: true });
  }

  protected updateGallery(gallery: readonly ProjectImage[]): void {
    this.gallery.set(gallery);
    this.invalidatePublicCaches();
  }

  private invalidatePublicCaches(): void {
    this.gateway.invalidateAllProjects();
    this.home.invalidateBundle();
  }
}
