import {
  Component,
  computed,
  input,
  output,
  signal,
  linkedSignal,
  ChangeDetectionStrategy,
} from '@angular/core';
import {
  FormField,
  FormRoot,
  applyEach,
  form,
  maxLength,
  required,
  submit,
} from '@angular/forms/signals';
import {
  PROJECT_FACT_MAX_LENGTH,
  PROJECT_KINDS,
  PROJECT_PITCH_MAX_LENGTH,
  type Project,
  type ProjectInput,
  type ProjectKind,
  type TechChoice,
  type ArchitectureDecision,
} from '@features/projects/domain/models/project.model';
import { isProjectKind } from '@features/projects/domain/is-project-kind';
import { PROJECT_KIND_LABELS } from '@features/projects/application/project-kind-copy';
import { FileDropzone } from '@shared/ui/file-dropzone';
import { Button } from '@shared/ui/button';
import { AdminTagsSelector } from './admin-tags-selector';
import { PROJECT_CATEGORIES, AVAILABLE_PROJECT_TAGS } from './admin-project-form-data';

type ProjectFormModel = {
  title: string;
  category: string;
  description: string;
  liveUrl: string;
  repoUrl: string;
  repoUrlFront: string;
  repoUrlBack: string;
  featured: boolean;
  order: number;
  kind: ProjectKind | '';
  techChoices: TechChoice[];
  architectureDecisions: ArchitectureDecision[];
  pitch: string;
  highlight: string;
  scope: string;
};

const EMPTY: ProjectFormModel = {
  title: '',
  category: '',
  description: '',
  liveUrl: '',
  repoUrl: '',
  repoUrlFront: '',
  repoUrlBack: '',
  featured: false,
  order: 0,
  kind: '',
  techChoices: [],
  architectureDecisions: [],
  pitch: '',
  highlight: '',
  scope: '',
};

const toModel = (p: Project): ProjectFormModel => ({
  title: p.title,
  category: p.category,
  description: p.description,
  liveUrl: p.liveUrl ?? '',
  repoUrl: p.repoUrl ?? '',
  repoUrlFront: p.repoUrlFront ?? '',
  repoUrlBack: p.repoUrlBack ?? '',
  featured: p.featured,
  order: p.order,
  kind: p.kind ?? '',
  techChoices: [...(p.techChoices ?? [])],
  architectureDecisions: [...(p.architectureDecisions ?? [])],
  pitch: p.pitch ?? '',
  highlight: p.highlight ?? '',
  scope: p.scope ?? '',
});

@Component({
  selector: 'app-admin-project-inline-form',
  imports: [FormRoot, FormField, FileDropzone, Button, AdminTagsSelector],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  template: `
    <form
      [formRoot]="form"
      class="bg-foreground/5 border border-foreground/10 rounded-xl p-6 space-y-5"
    >
      <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div>
          @let title = form.title();
          <label for="title" class="form-label">Titre</label>
          <input
            id="title"
            type="text"
            [formField]="form.title"
            aria-required="true"
            class="form-input"
          />
          @if (title.touched() && title.invalid()) {
            <span role="alert" class="form-error">{{ title.errors()[0].message }}</span>
          }
        </div>
        <div>
          @let category = form.category();
          <label for="category" class="form-label">Catégorie</label>
          <select
            id="category"
            [formField]="form.category"
            aria-required="true"
            class="app-select w-full"
          >
            <option value="" disabled>Choisir une catégorie</option>
            @for (cat of categories; track cat) {
              <option [value]="cat">{{ cat }}</option>
            }
          </select>
          @if (category.touched() && category.invalid()) {
            <span role="alert" class="form-error">{{ category.errors()[0].message }}</span>
          }
        </div>
      </div>

      <div>
        @let kind = form.kind();
        <label for="kind" class="form-label">Nature</label>
        <select
          id="kind"
          data-testid="admin-project-kind"
          [formField]="form.kind"
          aria-required="true"
          class="app-select w-full"
        >
          <option value="" disabled>Choisir une nature</option>
          @for (option of kinds; track option.value) {
            <option [value]="option.value">{{ option.label }}</option>
          }
        </select>
        @if (kind.touched() && kind.invalid()) {
          <span data-testid="admin-project-kind-error" role="alert" class="form-error">
            {{ kind.errors()[0].message }}
          </span>
        }
      </div>

      <app-admin-tags-selector [availableTags]="availableTags" [(selectedTags)]="selectedTags" />

      <div>
        @let description = form.description();
        <label for="description" class="form-label">Description</label>
        <textarea
          id="description"
          [formField]="form.description"
          rows="3"
          aria-required="true"
          class="form-textarea"
        ></textarea>
        @if (description.touched() && description.invalid()) {
          <span role="alert" class="form-error">{{ description.errors()[0].message }}</span>
        }
      </div>

      <fieldset data-testid="admin-project-presentation" class="space-y-4">
        <legend class="form-label">Présentation dans les Réalisations</legend>
        <div>
          @let pitch = form.pitch();
          <label for="pitch" class="form-label">Accroche</label>
          <textarea
            id="pitch"
            data-testid="admin-project-pitch"
            [formField]="form.pitch"
            rows="2"
            [attr.aria-invalid]="pitch.touched() && pitch.invalid()"
            [attr.aria-describedby]="
              pitch.touched() && pitch.invalid() ? 'pitch-hint pitch-error' : 'pitch-hint'
            "
            class="form-textarea"
          ></textarea>
          <span id="pitch-hint" class="block mt-1 text-xs text-muted">{{ pitchHint }}</span>
          @if (pitch.touched() && pitch.invalid()) {
            <span
              id="pitch-error"
              data-testid="admin-project-pitch-error"
              role="alert"
              class="form-error"
            >
              {{ pitch.errors()[0].message }}
            </span>
          }
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            @let highlight = form.highlight();
            <label for="highlight" class="form-label">Point fort</label>
            <input
              id="highlight"
              type="text"
              data-testid="admin-project-highlight"
              [formField]="form.highlight"
              [attr.aria-invalid]="highlight.touched() && highlight.invalid()"
              [attr.aria-describedby]="
                highlight.touched() && highlight.invalid()
                  ? 'highlight-hint highlight-error'
                  : 'highlight-hint'
              "
              class="form-input"
            />
            <span id="highlight-hint" class="block mt-1 text-xs text-muted">{{ factHint }}</span>
            @if (highlight.touched() && highlight.invalid()) {
              <span
                id="highlight-error"
                data-testid="admin-project-highlight-error"
                role="alert"
                class="form-error"
              >
                {{ highlight.errors()[0].message }}
              </span>
            }
          </div>
          <div>
            @let scope = form.scope();
            <label for="scope" class="form-label">Périmètre</label>
            <input
              id="scope"
              type="text"
              data-testid="admin-project-scope"
              [formField]="form.scope"
              [attr.aria-invalid]="scope.touched() && scope.invalid()"
              [attr.aria-describedby]="
                scope.touched() && scope.invalid() ? 'scope-hint scope-error' : 'scope-hint'
              "
              class="form-input"
            />
            <span id="scope-hint" class="block mt-1 text-xs text-muted">{{ factHint }}</span>
            @if (scope.touched() && scope.invalid()) {
              <span
                id="scope-error"
                data-testid="admin-project-scope-error"
                role="alert"
                class="form-error"
              >
                {{ scope.errors()[0].message }}
              </span>
            }
          </div>
        </div>
      </fieldset>

      <div>
        <span class="form-label">Image</span>
        <app-file-dropzone
          accept="image/*"
          label="Image du projet"
          helperText="JPG, PNG, WebP, affichée dans la grille publique"
          [previewUrl]="imagePreview()"
          (fileSelected)="onFileSelected($event)"
        />
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div>
          <label for="liveUrl" class="form-label">URL du site</label>
          <input id="liveUrl" type="text" [formField]="form.liveUrl" class="form-input" />
        </div>
        <div>
          <label for="repoUrl" class="form-label">URL du dépôt</label>
          <input id="repoUrl" type="text" [formField]="form.repoUrl" class="form-input" />
        </div>
        <div>
          <label for="repoUrlFront" class="form-label">URL dépôt frontend</label>
          <input id="repoUrlFront" type="text" [formField]="form.repoUrlFront" class="form-input" />
        </div>
        <div>
          <label for="repoUrlBack" class="form-label">URL dépôt backend</label>
          <input id="repoUrlBack" type="text" [formField]="form.repoUrlBack" class="form-input" />
        </div>
      </div>

      <div class="flex gap-6 items-center">
        <div class="flex items-center gap-2">
          <input
            id="featured"
            type="checkbox"
            [formField]="form.featured"
            class="w-5 h-5 rounded border-foreground/20 text-primary focus:ring-primary"
          />
          <label
            for="featured"
            class="inline-flex min-h-11 items-center text-sm font-medium text-foreground"
          >
            Featured
          </label>
        </div>
        <div class="flex items-center gap-2">
          <label for="order" class="text-sm font-medium text-foreground">Ordre</label>
          <input
            id="order"
            type="number"
            [formField]="form.order"
            class="w-20 min-h-11 px-3 py-1.5 rounded-lg bg-background border border-foreground/20 text-foreground focus:border-primary focus:outline-none transition-colors"
          />
        </div>
      </div>

      <fieldset class="space-y-3">
        <legend class="form-label">Choix techniques</legend>
        @for (row of form.techChoices; track $index) {
          <div class="grid grid-cols-1 md:grid-cols-[1fr_2fr_auto] gap-2 items-start">
            <input [formField]="row.techno" placeholder="Techno (ex: NestJS)" class="form-input" />
            <input [formField]="row.why" placeholder="Pourquoi ce choix" class="form-input" />
            <button
              type="button"
              (click)="removeTechChoice($index)"
              class="min-h-11 px-3 py-2 rounded-lg text-sm text-red-400 hover:bg-red-500/10 transition-colors"
            >
              Supprimer
            </button>
          </div>
        }
        <app-button severity="secondary" variant="outlined" (click)="addTechChoice()">
          + Ajouter un choix technique
        </app-button>
      </fieldset>

      <fieldset class="space-y-3">
        <legend class="form-label">Décisions d'architecture</legend>
        @for (row of form.architectureDecisions; track $index) {
          <div class="grid grid-cols-1 md:grid-cols-[1fr_2fr_auto] gap-2 items-start">
            <input
              [formField]="row.decision"
              placeholder="Décision (ex: hexagonale)"
              class="form-input"
            />
            <input [formField]="row.rationale" placeholder="Justification" class="form-input" />
            <button
              type="button"
              (click)="removeArchitectureDecision($index)"
              class="min-h-11 px-3 py-2 rounded-lg text-sm text-red-400 hover:bg-red-500/10 transition-colors"
            >
              Supprimer
            </button>
          </div>
        }
        <app-button severity="secondary" variant="outlined" (click)="addArchitectureDecision()">
          + Ajouter une décision d'architecture
        </app-button>
      </fieldset>

      <div class="flex gap-3 pt-2">
        <app-button type="submit" severity="primary" [disabled]="form().submitting()">
          {{ project() ? 'Enregistrer' : 'Créer' }}
        </app-button>
        <app-button severity="secondary" variant="outlined" (click)="cancelled.emit()">
          Annuler
        </app-button>
      </div>
    </form>
  `,
})
export class AdminProjectInlineForm {
  readonly project = input<Project>();
  readonly saved = output<{ data: ProjectInput; file: File | null }>();
  readonly cancelled = output<void>();

  readonly selectedFile = signal<File | null>(null);

  // Une écriture de galerie garde l'id : la saisie ne se réinitialise qu'au changement de projet.
  private readonly _editedProject = computed(() => this.project(), {
    equal: (a, b) => a?.id === b?.id,
  });

  readonly imagePreview = linkedSignal({
    source: this._editedProject,
    computation: (p, previous): string => p?.image ?? previous?.value ?? '',
  });

  readonly selectedTags = linkedSignal({
    source: this._editedProject,
    computation: (p, previous): Set<string> =>
      p ? new Set(p.tags ?? []) : (previous?.value ?? new Set<string>()),
  });

  readonly categories = PROJECT_CATEGORIES;
  readonly availableTags = AVAILABLE_PROJECT_TAGS;
  protected readonly pitchHint = `${PROJECT_PITCH_MAX_LENGTH}\u00a0caractères au plus`;
  protected readonly factHint = `${PROJECT_FACT_MAX_LENGTH}\u00a0caractères au plus`;
  protected readonly kinds = PROJECT_KINDS.map((value) => ({
    value,
    label: PROJECT_KIND_LABELS[value],
  }));

  private readonly _model = linkedSignal({
    source: this._editedProject,
    computation: (p, previous): ProjectFormModel => (p ? toModel(p) : (previous?.value ?? EMPTY)),
  });

  readonly form = form(
    this._model,
    (path) => {
      required(path.title, { message: 'Ce champ est obligatoire' });
      required(path.category, { message: 'Ce champ est obligatoire' });
      required(path.description, { message: 'Ce champ est obligatoire' });
      required(path.kind, { message: 'Ce champ est obligatoire' });
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
        required(item.techno, { message: 'Ce champ est obligatoire' });
        required(item.why, { message: 'Ce champ est obligatoire' });
      });
      applyEach(path.architectureDecisions, (item) => {
        required(item.decision, { message: 'Ce champ est obligatoire' });
        required(item.rationale, { message: 'Ce champ est obligatoire' });
      });
    },
    {
      submission: {
        action: async () => {
          const model = this._model();
          if (!isProjectKind(model.kind)) return;
          this.saved.emit({
            data: this.toInput(model, model.kind),
            file: this.selectedFile(),
          });
        },
      },
    },
  );

  addTechChoice(): void {
    this._model.update((m) => ({ ...m, techChoices: [...m.techChoices, { techno: '', why: '' }] }));
  }

  removeTechChoice(index: number): void {
    this._model.update((m) => ({
      ...m,
      techChoices: m.techChoices.filter((_, i) => i !== index),
    }));
  }

  addArchitectureDecision(): void {
    this._model.update((m) => ({
      ...m,
      architectureDecisions: [...m.architectureDecisions, { decision: '', rationale: '' }],
    }));
  }

  removeArchitectureDecision(index: number): void {
    this._model.update((m) => ({
      ...m,
      architectureDecisions: m.architectureDecisions.filter((_, i) => i !== index),
    }));
  }

  onFileSelected(file: File): void {
    if (file.type.startsWith('image/')) this.selectFile(file);
  }

  async submitProject(): Promise<void> {
    await submit(this.form);
  }

  // `image` est volontairement absent : l'image transite par `file` (uploadImage), jamais comme
  // string dans le payload create/update (le DTO backend la rejette). `null` (et non `undefined`)
  // pour qu'un champ vidé soit envoyé dans le PATCH et efface réellement le lien côté backend.
  private toInput(m: ProjectFormModel, kind: ProjectKind): ProjectInput {
    return {
      title: m.title,
      category: m.category,
      tags: [...this.selectedTags()],
      description: m.description,
      liveUrl: m.liveUrl || null,
      repoUrl: m.repoUrl || null,
      repoUrlFront: m.repoUrlFront || null,
      repoUrlBack: m.repoUrlBack || null,
      featured: m.featured,
      order: m.order,
      // Copies explicites : Signal Forms marque les éléments de tableau d'un symbole d'identité
      // interne, le payload du domaine doit rester un objet pur.
      techChoices: m.techChoices.map(({ techno, why }) => ({ techno, why })),
      architectureDecisions: m.architectureDecisions.map(({ decision, rationale }) => ({
        decision,
        rationale,
      })),
      kind,
      pitch: m.pitch.trim() || null,
      highlight: m.highlight.trim() || null,
      scope: m.scope.trim() || null,
    };
  }

  private selectFile(file: File): void {
    this.selectedFile.set(file);
    this.imagePreview.set(URL.createObjectURL(file));
  }
}
