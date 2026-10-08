import { Component, computed, inject, input, linkedSignal, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { Router, RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { ProjectsGateway } from '@features/projects/domain/gateways/projects.gateway';
import type {
  Project,
  ProjectImage,
  ProjectInput,
} from '@features/projects/domain/models/project.model';
import { HomeGateway } from '@features/home/domain/gateways/home.gateway';
import { withValidationDetail } from '@shared/api/with-validation-detail';
import { AppIcon } from '@shared/icons/app-icon';
import { LoadError } from '@shared/ui/load-error';
import { loadState } from '@shared/ui/load-state';
import { AppSkeleton } from '@shared/ui/skeleton';
import { ConfirmDialog } from '@shared/ui/confirm-dialog';
import { ToastStore } from '@shared/ui/toast-store';
import { AdminFormToc } from './components/admin-form-toc';
import { AdminProjectForm } from './components/admin-project-form';
import { AdminProjectPreview } from './components/admin-project-preview';
import { AdminSaveBar } from './components/admin-save-bar';
import { countChangedFields } from './count-draft-changes';
import { toFormTocEntries, type FormTocSection } from './form-toc-entries';
import { LeaveConfirmation } from './leave-confirmation';
import { toPreviewProject, toProjectDraft, type ProjectDraft } from './project-draft';
import type { LeaveConfirmable } from './unsaved-changes-guard';

type EditedProject = ProjectDraft & {
  readonly tags: ReadonlySet<string>;
  readonly cover: File | null;
};

const FORM_SECTIONS: readonly FormTocSection<EditedProject>[] = [
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

const toEditedProject = (project: Project | null): EditedProject => ({
  ...toProjectDraft(project),
  tags: new Set(project?.tags ?? []),
  cover: null,
});

@Component({
  selector: 'app-admin-project-editor',
  imports: [
    RouterLink,
    AppIcon,
    LoadError,
    AppSkeleton,
    ConfirmDialog,
    AdminProjectForm,
    AdminProjectPreview,
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
                data-testid="admin-breadcrumb-projects"
                routerLink="/admin/projects"
                class="inline-flex min-h-11 items-center text-primary hover:underline"
              >
                Projets
              </a>
            </li>
            <li aria-hidden="true">/</li>
            <li data-testid="admin-breadcrumb-current" aria-current="page">{{ heading() }}</li>
          </ol>
        </nav>
        <h1
          data-testid="admin-page-title"
          class="mt-1.5 text-[2.5rem] leading-none font-extrabold tracking-[-0.04em] lg:text-[clamp(2.25rem,3.4vw,3.25rem)]"
        >
          {{ heading() }}
        </h1>
        <p class="mt-3 max-w-[60ch] text-base text-muted lg:text-[1.0625rem]">
          Les changements partent en ligne au prochain déploiement, quelques minutes après
          l'enregistrement.
        </p>
      </div>
      <div class="flex flex-wrap gap-2.5 lg:justify-end">
        <a
          data-testid="admin-project-preview-link"
          routerLink="."
          fragment="apercu"
          class="link-btn-outline 2xl:hidden"
        >
          <app-icon name="eye" [size]="16" />Voir l'aperçu
        </a>
        @if (saved(); as project) {
          <a
            data-testid="admin-project-public-link"
            [href]="'/projects/' + project.slug"
            target="_blank"
            rel="noopener noreferrer"
            class="link-btn-outline"
          >
            <app-icon name="external-link" [size]="16" />Voir la fiche<span class="sr-only">
              publique de {{ project.title }} (nouvel onglet)</span
            >
          </a>
        }
      </div>
    </header>

    @switch (state()) {
      @case ('loading') {
        <div
          data-testid="admin-project-editor-loading"
          role="status"
          class="grid gap-5 2xl:max-w-[calc(100%-28.5rem)]"
        >
          <span class="sr-only">Chargement du projet…</span>
          <app-skeleton class="block h-12 rounded-md" />
          <app-skeleton class="block h-28 rounded-md" />
          <app-skeleton class="block h-12 rounded-md" />
          <app-skeleton class="block h-40 rounded-md" />
        </div>
      }
      @case ('error') {
        <app-load-error
          message="Le projet n'a pas pu être chargé. Vérifiez votre connexion, puis réessayez."
          (retry)="projectResource.reload()"
        />
        <p class="text-center">
          <a
            data-testid="admin-project-editor-back"
            routerLink="/admin/projects"
            class="inline-flex min-h-11 items-center text-sm text-primary hover:underline"
          >
            Retour aux projets
          </a>
        </p>
      }
      @default {
        <div class="grid items-start gap-10 2xl:grid-cols-[minmax(0,1fr)_25rem] 2xl:gap-14">
          <div class="min-w-0">
            <app-admin-project-form
              [(value)]="draft"
              [(tags)]="tags"
              [projectId]="id() ?? null"
              [gallery]="gallery()"
              [persistedCover]="saved()?.image ?? ''"
              (submitted)="save($event)"
              [coverResetToken]="coverResetToken()"
              (coverSelected)="pendingCover.set($event)"
              (coverCleared)="pendingCover.set(null)"
              (coverRejected)="rejectCover()"
              (galleryChange)="updateGallery($event)"
            />
            <app-admin-save-bar
              class="mt-10"
              formId="project-form"
              cancelRoute="/admin/projects"
              [changes]="changes()"
              [submitting]="saving()"
            />
          </div>
          <div
            id="apercu"
            data-testid="admin-project-aside"
            class="grid scroll-mt-6 gap-3.5 2xl:sticky 2xl:top-6"
          >
            <app-admin-project-preview
              [project]="preview()"
              [pendingCover]="pendingCover() !== null"
            />
            <app-admin-form-toc [sections]="toc()" />
          </div>
        </div>
      }
    }

    <app-confirm-dialog
      [open]="leave.asked()"
      heading="Quitter sans enregistrer&#8239;?"
      confirmLabel="Quitter sans enregistrer"
      cancelLabel="Continuer l'édition"
      (confirmed)="leave.answer(true)"
      (cancelled)="leave.answer(false)"
    >
      Les modifications non enregistrées de ce projet seront perdues.
    </app-confirm-dialog>
  `,
})
export class AdminProjectEditor implements LeaveConfirmable {
  private readonly gateway = inject(ProjectsGateway);
  private readonly home = inject(HomeGateway);
  private readonly toast = inject(ToastStore);
  private readonly router = inject(Router);

  readonly id = input<string>();

  protected readonly projectResource = rxResource({
    params: () => this.id(),
    stream: ({ params }) => this.gateway.getProjectById(params),
  });

  private readonly loaded = computed(() =>
    this.projectResource.hasValue() ? this.projectResource.value() : null,
  );

  protected readonly state = computed(() =>
    this.id() ? loadState(this.projectResource, () => false) : 'ready',
  );
  protected readonly saved = linkedSignal<Project | null>(() => this.loaded());
  protected readonly draft = linkedSignal(() => toProjectDraft(this.loaded()));
  protected readonly tags = linkedSignal<ReadonlySet<string>>(
    () => new Set(this.loaded()?.tags ?? []),
  );
  protected readonly gallery = linkedSignal<readonly ProjectImage[]>(
    () => this.loaded()?.gallery ?? [],
  );
  protected readonly pendingCover = signal<File | null>(null);
  protected readonly coverResetToken = signal(0);
  protected readonly saving = signal(false);
  protected readonly leave = new LeaveConfirmation();

  private readonly baseline = linkedSignal(() => toEditedProject(this.loaded()));
  private readonly edited = computed<EditedProject>(() => ({
    ...this.draft(),
    tags: this.tags(),
    cover: this.pendingCover(),
  }));

  protected readonly heading = computed(
    () => this.saved()?.title ?? (this.id() ? 'Modifier un projet' : 'Nouveau projet'),
  );
  protected readonly changes = computed(() => countChangedFields(this.edited(), this.baseline()));
  protected readonly toc = computed(() =>
    toFormTocEntries(FORM_SECTIONS, this.edited(), this.baseline()),
  );
  protected readonly preview = computed(() =>
    toPreviewProject(this.draft(), this.tags(), this.saved()),
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

  protected async save(payload: ProjectInput): Promise<void> {
    const id = this.id();
    this.saving.set(true);
    try {
      await (id ? this.update(id, payload) : this.create(payload));
    } finally {
      this.saving.set(false);
    }
  }

  protected updateGallery(gallery: readonly ProjectImage[]): void {
    this.gallery.set(gallery);
    this.invalidatePublicCaches();
  }

  private async create(payload: ProjectInput): Promise<void> {
    let created: Project;
    try {
      created = await firstValueFrom(this.gateway.createProject(payload));
    } catch (err: unknown) {
      this.notify('error', withValidationDetail('Erreur lors de la création du projet', err));
      return;
    }
    const cover = this.pendingCover();
    if (cover) {
      try {
        await firstValueFrom(this.gateway.uploadImage(cover, created.id));
      } catch (err: unknown) {
        this.notify(
          'warn',
          withValidationDetail(
            "Projet créé, mais l'envoi de l'image a échoué. Réessayez depuis sa page.",
            err,
          ),
        );
      }
    }
    this.invalidatePublicCaches();
    this.notify('success', 'Projet créé');
    this.markSaved();
    await this.router.navigate(['/admin/projects', created.id], { replaceUrl: true });
  }

  private async update(id: string, payload: ProjectInput): Promise<void> {
    const cover = this.pendingCover();
    try {
      if (cover) await firstValueFrom(this.gateway.uploadImage(cover, id));
      this.saved.set(await firstValueFrom(this.gateway.updateProject(id, payload)));
    } catch (err: unknown) {
      this.notify('error', withValidationDetail('Erreur lors de la mise à jour du projet', err));
      return;
    }
    this.markSaved();
    this.invalidatePublicCaches();
    this.notify('success', 'Projet mis à jour');
  }

  private markSaved(): void {
    this.pendingCover.set(null);
    this.coverResetToken.update((token) => token + 1);
    this.baseline.set(this.edited());
  }

  private invalidatePublicCaches(): void {
    this.gateway.invalidateAllProjects();
    this.home.invalidateBundle();
  }

  private notify(severity: 'success' | 'warn' | 'error', detail: string): void {
    const summary = { success: 'Succès', warn: 'Attention', error: 'Erreur' }[severity];
    this.toast.add({ severity, summary, detail });
  }
}
