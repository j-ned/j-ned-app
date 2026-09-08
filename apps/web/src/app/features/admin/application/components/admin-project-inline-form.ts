import {
  Component,
  input,
  output,
  signal,
  linkedSignal,
  ChangeDetectionStrategy,
} from '@angular/core';
import { FormField, FormRoot, applyEach, form, required, submit } from '@angular/forms/signals';
import type {
  Project,
  ProjectInput,
  TechChoice,
  ArchitectureDecision,
} from '@features/projects/domain/models/project.model';
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
  techChoices: TechChoice[];
  architectureDecisions: ArchitectureDecision[];
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
  techChoices: [],
  architectureDecisions: [],
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
  techChoices: [...(p.techChoices ?? [])],
  architectureDecisions: [...(p.architectureDecisions ?? [])],
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

  readonly imagePreview = linkedSignal({
    source: this.project,
    computation: (p, previous): string => p?.image ?? previous?.value ?? '',
  });

  readonly selectedTags = linkedSignal({
    source: this.project,
    computation: (p, previous): Set<string> =>
      p ? new Set(p.tags ?? []) : (previous?.value ?? new Set<string>()),
  });

  readonly categories = PROJECT_CATEGORIES;
  readonly availableTags = AVAILABLE_PROJECT_TAGS;

  // Le modèle suit le projet à éditer dès qu'il arrive par `input()` et reste éditable ensuite.
  private readonly _model = linkedSignal({
    source: this.project,
    computation: (p, previous): ProjectFormModel => (p ? toModel(p) : (previous?.value ?? EMPTY)),
  });

  readonly form = form(
    this._model,
    (path) => {
      required(path.title, { message: 'Ce champ est obligatoire' });
      required(path.category, { message: 'Ce champ est obligatoire' });
      required(path.description, { message: 'Ce champ est obligatoire' });
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
          this.saved.emit({ data: this.toInput(this._model()), file: this.selectedFile() });
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
  private toInput(m: ProjectFormModel): ProjectInput {
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
    };
  }

  private selectFile(file: File): void {
    this.selectedFile.set(file);
    this.imagePreview.set(URL.createObjectURL(file));
  }
}
