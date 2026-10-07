import { Component, computed, input, model, output } from '@angular/core';
import { FormField, FormRoot, applyEach, form, maxLength, required } from '@angular/forms/signals';
import {
  PROJECT_FACT_MAX_LENGTH,
  PROJECT_KINDS,
  PROJECT_PITCH_MAX_LENGTH,
  type ProjectImage,
  type ProjectInput,
} from '@features/projects/domain/models/project.model';
import { isProjectKind } from '@features/projects/domain/is-project-kind';
import { PROJECT_KIND_DEFINITIONS } from '@features/projects/application/project-kind-copy';
import { ProjectKindStamp } from '@features/projects/application/components/project-kind-stamp';
import { ProjectCover } from '@features/projects/application/components/project-cover';
import { FileDropzone } from '@shared/ui/file-dropzone';
import { Button } from '@shared/ui/button';
import { AppIcon } from '@shared/icons/app-icon';
import { AdminTagsSelector } from './admin-tags-selector';
import { AdminFormSection } from './admin-form-section';
import { AdminProjectGallery } from './admin-project-gallery';
import { PROJECT_CATEGORIES, AVAILABLE_PROJECT_TAGS } from './admin-project-form-data';
import { toProjectInput, type ProjectDraft } from '../project-draft';

const REQUIRED = 'Ce champ est obligatoire';

type PresentationText = {
  readonly key: 'pitch' | 'highlight' | 'scope';
  readonly label: string;
  readonly max: number;
  readonly hint: string;
  readonly hintId: string;
  readonly errorId: string;
};

const presentationText = (
  key: PresentationText['key'],
  label: string,
  max: number,
): PresentationText => ({
  key,
  label,
  max,
  hint: `${max}\u00a0caractères au plus`,
  hintId: `project-${key}-hint`,
  errorId: `project-${key}-error`,
});

@Component({
  selector: 'app-admin-project-form',
  imports: [
    FormRoot,
    FormField,
    FileDropzone,
    Button,
    AppIcon,
    AdminTagsSelector,
    AdminFormSection,
    AdminProjectGallery,
    ProjectKindStamp,
    ProjectCover,
  ],
  host: { class: 'block' },
  template: `
    <form
      id="project-form"
      data-testid="admin-project-form"
      [formRoot]="form"
      novalidate
      class="grid gap-8.5"
    >
      <fieldset
        app-admin-form-section
        id="project-identity"
        number="01"
        heading="Identité"
        description="Ce qui range le projet&nbsp;: nom, nature, ordre."
      >
        <div class="grid gap-5">
          <div class="grid gap-5 sm:grid-cols-2">
            <div>
              @let title = form.title();
              <label for="project-title" class="field-label">
                Titre <span class="font-mono text-xs font-medium text-muted">obligatoire</span>
              </label>
              <input
                id="project-title"
                type="text"
                data-testid="admin-project-title"
                [formField]="form.title"
                class="form-input"
              />
              @if (title.touched() && title.invalid()) {
                <span role="alert" class="form-error">{{ title.errors()[0].message }}</span>
              }
            </div>
            <div>
              @let category = form.category();
              <label for="project-category" class="field-label">
                Catégorie <span class="font-mono text-xs font-medium text-muted">obligatoire</span>
              </label>
              <select
                id="project-category"
                data-testid="admin-project-category"
                [formField]="form.category"
                class="app-select w-full"
              >
                <option value="" disabled>Choisir une catégorie</option>
                @for (option of categories; track option) {
                  <option [value]="option">{{ option }}</option>
                }
              </select>
              @if (category.touched() && category.invalid()) {
                <span role="alert" class="form-error">{{ category.errors()[0].message }}</span>
              }
            </div>
          </div>

          <fieldset data-testid="admin-project-kind" class="min-w-0">
            @let kind = form.kind();
            <legend class="field-label w-full">
              <span data-testid="admin-project-kind-legend">Nature</span>
              <span class="font-mono text-xs font-medium text-muted">obligatoire</span>
            </legend>
            <div class="grid gap-2.5 sm:grid-cols-3">
              @for (option of kinds; track option.value) {
                <label
                  class="group relative grid cursor-pointer content-start gap-2 rounded-md border border-field p-3.5 has-checked:border-primary has-checked:shadow-[inset_0_0_0_1px_var(--color-primary)] has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-primary"
                >
                  <input
                    type="radio"
                    class="peer absolute inset-0 size-full cursor-pointer opacity-0"
                    [value]="option.value"
                    [attr.data-testid]="'admin-project-kind-' + option.value"
                    [formField]="form.kind"
                  />
                  <span
                    aria-hidden="true"
                    class="absolute top-3 right-3 size-4.5 rounded-full border-[1.5px] border-field group-has-checked:border-[5px] group-has-checked:border-primary"
                  ></span>
                  <app-project-kind-stamp
                    data-testid="admin-project-kind-stamp"
                    class="justify-self-start"
                    [kind]="option.value"
                  />
                  <span
                    data-testid="admin-project-kind-definition"
                    class="text-[0.8125rem] text-muted"
                  >
                    {{ option.definition }}
                  </span>
                </label>
              }
            </div>
            @if (kind.touched() && kind.invalid()) {
              <span data-testid="admin-project-kind-error" role="alert" class="form-error">
                {{ kind.errors()[0].message }}
              </span>
            }
          </fieldset>

          <div class="grid items-end gap-5 sm:grid-cols-2">
            <div>
              <label for="project-order" class="field-label">Position dans la liste</label>
              <input
                id="project-order"
                type="number"
                data-testid="admin-project-order"
                aria-describedby="project-order-hint"
                [formField]="form.order"
                class="form-input max-w-32"
              />
              <p id="project-order-hint" class="field-hint">1 = en tête de Réalisations</p>
            </div>
            <label
              for="project-featured"
              class="flex min-h-11 items-center gap-3 text-[0.90625rem]"
            >
              <input
                id="project-featured"
                type="checkbox"
                data-testid="admin-project-featured-input"
                [formField]="form.featured"
                class="accent-primary-bg size-5"
              />
              Mettre en avant sur l'accueil
            </label>
          </div>
        </div>
      </fieldset>

      <fieldset
        app-admin-form-section
        id="project-presentation"
        number="02"
        heading="Présentation dans les Réalisations"
        description="Les textes de la carte publique."
      >
        <div class="grid gap-5">
          <div data-testid="admin-project-presentation" class="grid gap-5 sm:grid-cols-2">
            @for (text of presentation; track text.key) {
              @let field = form[text.key]();
              @let shownError = field.touched() && field.invalid();
              <div [class.sm:col-span-full]="text.key === 'pitch'">
                <label [for]="'project-' + text.key" class="field-label">{{ text.label }}</label>
                @if (text.key === 'pitch') {
                  <textarea
                    [id]="'project-' + text.key"
                    [attr.data-testid]="'admin-project-' + text.key"
                    [formField]="form[text.key]"
                    rows="3"
                    [attr.aria-invalid]="shownError"
                    [attr.aria-describedby]="
                      shownError ? text.hintId + ' ' + text.errorId : text.hintId
                    "
                    class="form-textarea min-h-0"
                  ></textarea>
                } @else {
                  <input
                    type="text"
                    [id]="'project-' + text.key"
                    [attr.data-testid]="'admin-project-' + text.key"
                    [formField]="form[text.key]"
                    [attr.aria-invalid]="shownError"
                    [attr.aria-describedby]="
                      shownError ? text.hintId + ' ' + text.errorId : text.hintId
                    "
                    class="form-input"
                  />
                }
                <p class="field-hint">
                  <span [id]="text.hintId">{{ text.hint }}</span>
                  <span
                    [attr.data-testid]="'admin-project-' + text.key + '-count'"
                    class="font-mono text-xs tabular-nums"
                    >{{ field.value().length }} / {{ text.max }}</span
                  >
                </p>
                @if (shownError) {
                  <span
                    [id]="text.errorId"
                    [attr.data-testid]="'admin-project-' + text.key + '-error'"
                    role="alert"
                    class="form-error"
                  >
                    {{ field.errors()[0].message }}
                  </span>
                }
              </div>
            }
          </div>

          <div>
            @let description = form.description();
            <label for="project-description" class="field-label">
              Description longue
              <span class="font-mono text-xs font-medium text-muted">obligatoire</span>
            </label>
            <textarea
              id="project-description"
              data-testid="admin-project-description"
              aria-describedby="project-description-hint"
              [formField]="form.description"
              rows="4"
              class="form-textarea"
            ></textarea>
            <p id="project-description-hint" class="field-hint">Affichée sur la fiche du projet.</p>
            @if (description.touched() && description.invalid()) {
              <span role="alert" class="form-error">{{ description.errors()[0].message }}</span>
            }
          </div>

          <div>
            <span id="project-cover-label" class="field-label">Couverture</span>
            <div
              data-testid="admin-project-cover-field"
              role="group"
              aria-labelledby="project-cover-label"
              class="grid items-start gap-4.5"
              [class]="persistedCover() ? 'sm:grid-cols-[15rem_minmax(0,1fr)]' : ''"
            >
              @if (persistedCover(); as cover) {
                <app-project-cover
                  data-testid="admin-project-cover-current"
                  [image]="cover"
                  [alt]="currentCoverAlt()"
                  [kind]="currentKind()"
                />
              }
              <app-file-dropzone
                data-testid="admin-project-cover"
                accept="image/*"
                label="Remplacer l'image"
                helperText="AVIF, WebP, JPG ou PNG · ratio 16/10 conseillé"
                [resetToken]="coverResetToken()"
                (fileSelected)="selectCover($event)"
                (cleared)="coverCleared.emit()"
              />
            </div>
          </div>
        </div>
      </fieldset>

      <fieldset
        app-admin-form-section
        id="project-links"
        number="03"
        heading="Liens"
        description="Vides si le projet n'en a pas&nbsp;: le bouton n'apparaît pas."
      >
        <div class="grid gap-5 sm:grid-cols-2">
          @for (link of links; track link.key) {
            <div>
              <label [for]="'project-' + link.key" class="field-label">{{ link.label }}</label>
              <input
                type="text"
                inputmode="url"
                [id]="'project-' + link.key"
                [attr.data-testid]="link.testId"
                [formField]="form[link.key]"
                placeholder="https://…"
                class="form-input"
              />
            </div>
          }
        </div>
      </fieldset>

      <fieldset
        app-admin-form-section
        id="project-stack"
        number="04"
        heading="Choix techniques"
        description="La stack résumée sur la carte, puis le détail de la fiche."
      >
        <app-admin-tags-selector
          data-testid="admin-project-tags"
          [availableTags]="availableTags"
          [(selectedTags)]="tags"
        />

        <h2 class="mt-6.5 mb-1 font-display text-base font-bold font-stretch-104%">
          Pourquoi ces outils
        </h2>
        <div class="border-t border-line">
          <div aria-hidden="true" [class]="repeatHeadClass">
            <span>N°</span><span>Outil</span><span>Raison</span>
          </div>
          @for (row of form.techChoices; track $index) {
            @let rank = $index + 1;
            <div [class]="repeatRowClass">
              <span class="pt-3.5 font-mono text-xs text-muted">{{
                rank < 10 ? '0' + rank : rank
              }}</span>
              <div>
                <label class="sr-only" [for]="'tech-' + rank + '-techno'">Outil {{ rank }}</label>
                <input
                  [id]="'tech-' + rank + '-techno'"
                  data-testid="tech-choice-techno"
                  [formField]="row.techno"
                  placeholder="NestJS"
                  class="form-input"
                />
              </div>
              <div class="max-sm:col-start-2 max-sm:row-start-2">
                <label class="sr-only" [for]="'tech-' + rank + '-why'">Raison {{ rank }}</label>
                <input
                  [id]="'tech-' + rank + '-why'"
                  data-testid="tech-choice-why"
                  [formField]="row.why"
                  placeholder="Pourquoi ce choix"
                  class="form-input"
                />
              </div>
              <app-button
                severity="danger"
                variant="text"
                size="icon"
                data-testid="tech-choice-remove"
                class="max-sm:col-start-3 max-sm:row-start-1"
                [ariaLabel]="'Supprimer le choix technique ' + rank"
                (click)="removeTechChoice($index)"
              >
                <app-icon name="trash" [size]="18" />
              </app-button>
            </div>
          }
        </div>
        <app-button
          variant="text"
          data-testid="tech-choice-add"
          class="mt-1.5"
          (click)="addTechChoice()"
        >
          <app-icon name="plus" [size]="16" />Ajouter un choix technique
        </app-button>

        <h2 class="mt-6.5 mb-1 font-display text-base font-bold font-stretch-104%">
          Décisions d'architecture
        </h2>
        <div class="border-t border-line">
          <div aria-hidden="true" [class]="repeatHeadClass">
            <span>N°</span><span>Décision</span><span>Justification</span>
          </div>
          @for (row of form.architectureDecisions; track $index) {
            @let rank = $index + 1;
            <div [class]="repeatRowClass">
              <span class="pt-3.5 font-mono text-xs text-muted">{{
                rank < 10 ? '0' + rank : rank
              }}</span>
              <div>
                <label class="sr-only" [for]="'decision-' + rank + '-text'"
                  >Décision {{ rank }}</label
                >
                <input
                  [id]="'decision-' + rank + '-text'"
                  data-testid="decision-text"
                  [formField]="row.decision"
                  placeholder="Architecture hexagonale"
                  class="form-input"
                />
              </div>
              <div class="max-sm:col-start-2 max-sm:row-start-2">
                <label class="sr-only" [for]="'decision-' + rank + '-rationale'">
                  Justification {{ rank }}
                </label>
                <input
                  [id]="'decision-' + rank + '-rationale'"
                  data-testid="decision-rationale"
                  [formField]="row.rationale"
                  placeholder="Justification"
                  class="form-input"
                />
              </div>
              <app-button
                severity="danger"
                variant="text"
                size="icon"
                data-testid="decision-remove"
                class="max-sm:col-start-3 max-sm:row-start-1"
                [ariaLabel]="'Supprimer la décision ' + rank"
                (click)="removeArchitectureDecision($index)"
              >
                <app-icon name="trash" [size]="18" />
              </app-button>
            </div>
          }
        </div>
        <app-button
          variant="text"
          data-testid="decision-add"
          class="mt-1.5"
          (click)="addArchitectureDecision()"
        >
          <app-icon name="plus" [size]="16" />Ajouter une décision
        </app-button>
      </fieldset>
    </form>

    <fieldset
      app-admin-form-section
      id="project-gallery"
      number="05"
      heading="Galerie"
      description="Captures de la fiche, dans cet ordre. Chaque capture a un texte alternatif."
      class="mt-8.5"
    >
      @if (projectId(); as id) {
        <app-admin-project-gallery
          [projectId]="id"
          [images]="gallery()"
          (galleryChange)="galleryChange.emit($event)"
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
  `,
})
export class AdminProjectForm {
  readonly value = model.required<ProjectDraft>();
  readonly tags = model.required<ReadonlySet<string>>();
  readonly projectId = input<string | null>(null);
  readonly gallery = input<readonly ProjectImage[]>([]);
  readonly persistedCover = input('');
  readonly coverResetToken = input<number>();
  readonly submitted = output<ProjectInput>();
  readonly coverSelected = output<File>();
  readonly coverCleared = output<void>();
  readonly coverRejected = output<void>();
  readonly galleryChange = output<readonly ProjectImage[]>();

  protected readonly currentCoverAlt = computed(
    () => `Couverture actuelle de ${this.value().title}`,
  );
  protected readonly currentKind = computed(() => this.value().kind || null);
  protected readonly categories = PROJECT_CATEGORIES;
  protected readonly availableTags = AVAILABLE_PROJECT_TAGS;
  protected readonly kinds = PROJECT_KINDS.map((value) => ({
    value,
    definition: PROJECT_KIND_DEFINITIONS[value],
  }));
  protected readonly presentation = [
    presentationText('pitch', 'Accroche', PROJECT_PITCH_MAX_LENGTH),
    presentationText('highlight', 'Point fort', PROJECT_FACT_MAX_LENGTH),
    presentationText('scope', 'Périmètre', PROJECT_FACT_MAX_LENGTH),
  ];
  protected readonly links = [
    { key: 'liveUrl', label: 'Site en ligne', testId: 'admin-project-live-url' },
    { key: 'repoUrl', label: 'Dépôt unique', testId: 'admin-project-repo-url' },
    { key: 'repoUrlFront', label: 'Dépôt front', testId: 'admin-project-repo-url-front' },
    { key: 'repoUrlBack', label: 'Dépôt API', testId: 'admin-project-repo-url-back' },
  ] as const;
  protected readonly repeatHeadClass =
    'grid grid-cols-[2rem_minmax(0,11rem)_minmax(0,1fr)_2.75rem] gap-2.5 pt-2.5 pb-2 font-mono text-xs uppercase tracking-[0.06em] text-muted max-sm:hidden';
  protected readonly repeatRowClass =
    'grid grid-cols-[2rem_minmax(0,1fr)_2.75rem] items-start gap-2.5 border-t border-line py-2.5 sm:grid-cols-[2rem_minmax(0,11rem)_minmax(0,1fr)_2.75rem]';

  readonly form = form(
    this.value,
    (path) => {
      required(path.title, { message: REQUIRED });
      required(path.category, { message: REQUIRED });
      required(path.description, { message: REQUIRED });
      required(path.kind, { message: REQUIRED });
      maxLength(path.pitch, PROJECT_PITCH_MAX_LENGTH, {
        message: `L'accroche ne doit pas dépasser ${PROJECT_PITCH_MAX_LENGTH}\u00a0caractères`,
      });
      maxLength(path.highlight, PROJECT_FACT_MAX_LENGTH, {
        message: `Le point fort ne doit pas dépasser ${PROJECT_FACT_MAX_LENGTH}\u00a0caractères`,
      });
      maxLength(path.scope, PROJECT_FACT_MAX_LENGTH, {
        message: `Le périmètre ne doit pas dépasser ${PROJECT_FACT_MAX_LENGTH}\u00a0caractères`,
      });
      applyEach(path.techChoices, (item) => {
        required(item.techno, { message: REQUIRED });
        required(item.why, { message: REQUIRED });
      });
      applyEach(path.architectureDecisions, (item) => {
        required(item.decision, { message: REQUIRED });
        required(item.rationale, { message: REQUIRED });
      });
    },
    {
      submission: {
        action: async () => {
          const draft = this.value();
          if (isProjectKind(draft.kind)) {
            this.submitted.emit(toProjectInput(draft, this.tags(), draft.kind));
          }
        },
      },
    },
  );

  protected addTechChoice(): void {
    this.value.update((draft) => ({
      ...draft,
      techChoices: [...draft.techChoices, { techno: '', why: '' }],
    }));
  }

  protected removeTechChoice(index: number): void {
    this.value.update((draft) => ({
      ...draft,
      techChoices: draft.techChoices.filter((_, i) => i !== index),
    }));
  }

  protected addArchitectureDecision(): void {
    this.value.update((draft) => ({
      ...draft,
      architectureDecisions: [...draft.architectureDecisions, { decision: '', rationale: '' }],
    }));
  }

  protected removeArchitectureDecision(index: number): void {
    this.value.update((draft) => ({
      ...draft,
      architectureDecisions: draft.architectureDecisions.filter((_, i) => i !== index),
    }));
  }

  protected selectCover(file: File): void {
    if (file.type.startsWith('image/')) this.coverSelected.emit(file);
    else this.coverRejected.emit();
  }
}
