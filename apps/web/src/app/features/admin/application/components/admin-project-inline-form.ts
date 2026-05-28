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
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import type { Project } from '@features/projects/domain';
import { FileDropzone } from '@shared/ui';

@Component({
  selector: 'app-admin-project-inline-form',
  imports: [ReactiveFormsModule, FileDropzone],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  template: `
    <form
      [formGroup]="form"
      (ngSubmit)="onSubmit()"
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

      <div class="flex gap-3 pt-2">
        <button
          type="submit"
          [disabled]="form.invalid"
          class="btn-primary"
        >
          {{ project() ? 'Enregistrer' : 'Créer' }}
        </button>
        <button
          type="button"
          (click)="cancelled.emit()"
          class="btn-outline"
        >
          Annuler
        </button>
      </div>
    </form>
  `,
})
export class AdminProjectInlineForm {
  private readonly fb = inject(FormBuilder);

  readonly project = input<Project>();
  readonly saved = output<{ data: Omit<Project, 'id'>; file: File | null }>();
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
  });

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

  onSubmit(): void {
    if (this.form.invalid) return;

    const values = this.form.getRawValue();
    const existingProject = this.project();

    const data: Omit<Project, 'id'> = {
      title: values.title,
      category: values.category,
      tags: [...this.selectedTags()],
      description: values.description,
      image: existingProject?.image ?? '',
      liveUrl: values.liveUrl || undefined,
      repoUrl: values.repoUrl || undefined,
      repoUrlFront: values.repoUrlFront || undefined,
      repoUrlBack: values.repoUrlBack || undefined,
      featured: values.featured,
      order: values.order,
    };

    this.saved.emit({ data, file: this.selectedFile() });
  }

  private selectFile(file: File): void {
    this.selectedFile.set(file);
    this.imagePreview.set(URL.createObjectURL(file));
  }
}
