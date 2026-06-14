import {
  Component,
  input,
  output,
  signal,
  linkedSignal,
  effect,
  ChangeDetectionStrategy,
  inject,
} from '@angular/core';
import {
  ReactiveFormsModule,
  FormBuilder,
  FormArray,
  FormControl,
  FormGroup,
  Validators,
} from '@angular/forms';
import type {
  Project,
  ProjectInput,
  TechChoice,
  ArchitectureDecision,
} from '@features/projects/domain';
import { FileDropzone, Button } from '@shared/ui';

type TechChoiceForm = FormGroup<{ techno: FormControl<string>; why: FormControl<string> }>;
type ArchDecisionForm = FormGroup<{ decision: FormControl<string>; rationale: FormControl<string> }>;

@Component({
  selector: 'app-admin-project-inline-form',
  imports: [ReactiveFormsModule, FileDropzone, Button],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  template: `
    <form
      [formGroup]="form"
      (ngSubmit)="submitProject()"
      class="bg-foreground/5 border border-foreground/10 rounded-xl p-6 space-y-5"
    >
      <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div>
          <label for="title" class="form-label">Titre</label>
          <input
            id="title"
            type="text"
            formControlName="title"
            aria-required="true"
            class="form-input"
          />
          @if (form.controls.title.touched && form.controls.title.errors?.['required']) {
            <span role="alert" class="form-error">Ce champ est obligatoire</span>
          }
        </div>

        <div>
          <label for="category" class="form-label">Catégorie</label>
          <select
            id="category"
            formControlName="category"
            aria-required="true"
            class="app-select w-full"
          >
            <option value="" disabled>Choisir une catégorie</option>
            @for (cat of categories; track cat) {
              <option [value]="cat">{{ cat }}</option>
            }
          </select>
          @if (form.controls.category.touched && form.controls.category.errors?.['required']) {
            <span role="alert" class="form-error">Ce champ est obligatoire</span>
          }
        </div>
      </div>

      <div>
        <span class="form-label">Tags</span>
        <div class="flex flex-wrap gap-2">
          @for (tag of availableTags; track tag) {
            <button
              type="button"
              (click)="toggleTag(tag)"
              [class]="
                'px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ' +
                (selectedTags().has(tag)
                  ? 'bg-primary text-white border-primary'
                  : 'bg-background text-foreground border-foreground/20 hover:border-primary/50')
              "
            >
              {{ tag }}
            </button>
          }
        </div>
      </div>

      <div>
        <label for="description" class="form-label">Description</label>
        <textarea
          id="description"
          formControlName="description"
          rows="3"
          aria-required="true"
          class="form-textarea"
        ></textarea>
        @if (form.controls.description.touched && form.controls.description.errors?.['required']) {
          <span role="alert" class="form-error">Ce champ est obligatoire</span>
        }
      </div>

      <div>
        <span class="form-label">Image</span>
        <app-file-dropzone
          accept="image/*"
          label="Image du projet"
          helperText="JPG, PNG, WebP — affichée dans la grille publique"
          [previewUrl]="imagePreview()"
          (fileSelected)="onFileSelected($event)"
        />
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div>
          <label for="liveUrl" class="form-label">URL du site</label>
          <input id="liveUrl" type="text" formControlName="liveUrl" class="form-input" />
        </div>

        <div>
          <label for="repoUrl" class="form-label">URL du dépôt</label>
          <input id="repoUrl" type="text" formControlName="repoUrl" class="form-input" />
        </div>

        <div>
          <label for="repoUrlFront" class="form-label">URL dépôt frontend</label>
          <input id="repoUrlFront" type="text" formControlName="repoUrlFront" class="form-input" />
        </div>

        <div>
          <label for="repoUrlBack" class="form-label">URL dépôt backend</label>
          <input id="repoUrlBack" type="text" formControlName="repoUrlBack" class="form-input" />
        </div>
      </div>

      <div class="flex gap-6 items-center">
        <div class="flex items-center gap-2">
          <input
            id="featured"
            type="checkbox"
            formControlName="featured"
            class="w-4 h-4 rounded border-foreground/20 text-primary focus:ring-primary"
          />
          <label for="featured" class="text-sm font-medium text-foreground">Featured</label>
        </div>

        <div class="flex items-center gap-2">
          <label for="order" class="text-sm font-medium text-foreground">Ordre</label>
          <input
            id="order"
            type="number"
            formControlName="order"
            class="w-20 px-3 py-1.5 rounded-lg bg-background border border-foreground/20 text-foreground focus:border-primary focus:outline-none transition-colors"
          />
        </div>
      </div>

      <fieldset formArrayName="techChoices" class="space-y-3">
        <legend class="form-label">Choix techniques</legend>
        @for (row of form.controls.techChoices.controls; track $index) {
          <div
            [formGroupName]="$index"
            class="grid grid-cols-1 md:grid-cols-[1fr_2fr_auto] gap-2 items-start"
          >
            <input formControlName="techno" placeholder="Techno (ex: NestJS)" class="form-input" />
            <input formControlName="why" placeholder="Pourquoi ce choix" class="form-input" />
            <button
              type="button"
              (click)="removeTechChoice($index)"
              class="px-3 py-2 rounded-lg text-sm text-red-400 hover:bg-red-500/10 transition-colors"
            >
              Supprimer
            </button>
          </div>
        }
        <app-button severity="secondary" variant="outlined" (click)="addTechChoice()">
          + Ajouter un choix technique
        </app-button>
      </fieldset>

      <fieldset formArrayName="architectureDecisions" class="space-y-3">
        <legend class="form-label">Décisions d'architecture</legend>
        @for (row of form.controls.architectureDecisions.controls; track $index) {
          <div
            [formGroupName]="$index"
            class="grid grid-cols-1 md:grid-cols-[1fr_2fr_auto] gap-2 items-start"
          >
            <input
              formControlName="decision"
              placeholder="Décision (ex: hexagonale)"
              class="form-input"
            />
            <input formControlName="rationale" placeholder="Justification" class="form-input" />
            <button
              type="button"
              (click)="removeArchitectureDecision($index)"
              class="px-3 py-2 rounded-lg text-sm text-red-400 hover:bg-red-500/10 transition-colors"
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
        <app-button type="submit" severity="primary" [disabled]="form.invalid">
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
  private readonly fb = inject(FormBuilder);

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

  readonly categories = [
    'Application Web',
    'Application Mobile',
    'API / Backend',
    'Script',
    'Package / Librairie',
    'Extension',
    'Design / Maquette',
  ];

  readonly availableTags = [
    'Angular',
    'TypeScript',
    'JavaScript',
    'NestJS',
    'Node.js',
    'Python',
    'Bash',
    'TailwindCSS',
    'SCSS',
    'CSS',
    'PostgreSQL',
    'MongoDB',
    'Supabase',
    'Redis',
    'SQLite',
    'Docker',
    'CI/CD',
    'GitHub Actions',
    'Nginx',
    'Linux',
    'Git',
    'JWT',
    'API',
    'REST',
    'GraphQL',
    'WebSocket',
    'CLI',
    'Automation',
    'DevOps',
    'Vitest',
    'SSR',
    'Astro',
  ];

  readonly form = this.fb.nonNullable.group({
    title: ['', Validators.required],
    category: ['', Validators.required],
    description: ['', Validators.required],
    liveUrl: [''],
    repoUrl: [''],
    repoUrlFront: [''],
    repoUrlBack: [''],
    featured: [false],
    order: [0],
    techChoices: new FormArray<TechChoiceForm>([]),
    architectureDecisions: new FormArray<ArchDecisionForm>([]),
  });

  private readonly _patchForm = effect(() => {
    const p = this.project();
    if (!p) return;

    this.form.patchValue({
      title: p.title,
      category: p.category,
      description: p.description,
      liveUrl: p.liveUrl ?? '',
      repoUrl: p.repoUrl ?? '',
      repoUrlFront: p.repoUrlFront ?? '',
      repoUrlBack: p.repoUrlBack ?? '',
      featured: p.featured,
      order: p.order,
    });

    const tc = this.form.controls.techChoices;
    tc.clear();
    (p.techChoices ?? []).forEach((c) => tc.push(this.makeTechChoice(c)));
    const ad = this.form.controls.architectureDecisions;
    ad.clear();
    (p.architectureDecisions ?? []).forEach((d) => ad.push(this.makeArchDecision(d)));
  });

  private makeTechChoice(value: TechChoice = { techno: '', why: '' }): TechChoiceForm {
    return this.fb.nonNullable.group({
      techno: [value.techno, Validators.required],
      why: [value.why, Validators.required],
    });
  }

  private makeArchDecision(
    value: ArchitectureDecision = { decision: '', rationale: '' },
  ): ArchDecisionForm {
    return this.fb.nonNullable.group({
      decision: [value.decision, Validators.required],
      rationale: [value.rationale, Validators.required],
    });
  }

  addTechChoice(): void {
    this.form.controls.techChoices.push(this.makeTechChoice());
  }

  removeTechChoice(index: number): void {
    this.form.controls.techChoices.removeAt(index);
  }

  addArchitectureDecision(): void {
    this.form.controls.architectureDecisions.push(this.makeArchDecision());
  }

  removeArchitectureDecision(index: number): void {
    this.form.controls.architectureDecisions.removeAt(index);
  }

  onFileSelected(file: File): void {
    if (file.type.startsWith('image/')) this.selectFile(file);
  }

  toggleTag(tag: string): void {
    const tags = new Set(this.selectedTags());
    if (tags.has(tag)) {
      tags.delete(tag);
    } else {
      tags.add(tag);
    }
    this.selectedTags.set(tags);
  }

  submitProject(): void {
    if (this.form.invalid) return;

    const values = this.form.getRawValue();

    // `image` est volontairement absent : l'image transite par `file` (uploadImage),
    // jamais comme string dans le payload create/update (le DTO backend la rejette).
    const data: ProjectInput = {
      title: values.title,
      category: values.category,
      tags: [...this.selectedTags()],
      description: values.description,
      // `null` (et non `undefined`) pour qu'un champ vidé soit envoyé dans le PATCH
      // et efface réellement le lien côté backend (undefined serait retiré du body).
      liveUrl: values.liveUrl || null,
      repoUrl: values.repoUrl || null,
      repoUrlFront: values.repoUrlFront || null,
      repoUrlBack: values.repoUrlBack || null,
      featured: values.featured,
      order: values.order,
      techChoices: values.techChoices,
      architectureDecisions: values.architectureDecisions,
    };

    this.saved.emit({ data, file: this.selectedFile() });
  }

  private selectFile(file: File): void {
    this.selectedFile.set(file);
    this.imagePreview.set(URL.createObjectURL(file));
  }
}
