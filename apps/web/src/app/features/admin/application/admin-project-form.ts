import { Component, inject, input, signal, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { switchMap } from 'rxjs';
import { PROJECTS_GATEWAY } from '../../projects/domain';
import type { Project } from '../../projects/domain';

@Component({
  selector: 'app-admin-project-form',
  imports: [ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  template: `
    <h1 class="text-2xl font-bold text-foreground mb-8">
      {{ isEditMode() ? 'Modifier le projet' : 'Nouveau projet' }}
    </h1>

    <form [formGroup]="form" (ngSubmit)="onSubmit()" class="max-w-2xl space-y-6">
      <div>
        <label for="title" class="block text-sm font-medium text-foreground mb-1.5">Titre</label>
        <input
          id="title"
          type="text"
          formControlName="title"
          class="w-full px-4 py-2.5 rounded-lg bg-foreground/5 border border-foreground/20 text-foreground placeholder-muted focus:border-primary focus:outline-none transition-colors"
        />
      </div>

      <div>
        <label for="category" class="block text-sm font-medium text-foreground mb-1.5"
          >Catégorie</label
        >
        <select
          id="category"
          formControlName="category"
          class="w-full px-4 py-2.5 rounded-lg bg-foreground/5 border border-foreground/20 text-foreground focus:border-primary focus:outline-none transition-colors"
        >
          <option value="" disabled>Choisir une catégorie</option>
          @for (cat of categories; track cat) {
            <option [value]="cat">{{ cat }}</option>
          }
        </select>
      </div>

      <div>
        <span class="block text-sm font-medium text-foreground mb-1.5">Tags</span>
        <div class="flex flex-wrap gap-2">
          @for (tag of availableTags; track tag) {
            <button
              type="button"
              (click)="toggleTag(tag)"
              [class]="
                'px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ' +
                (selectedTags().has(tag)
                  ? 'bg-primary text-white border-primary'
                  : 'bg-foreground/5 text-foreground border-foreground/20 hover:border-primary/50')
              "
            >
              {{ tag }}
            </button>
          }
        </div>
      </div>

      <div>
        <label for="description" class="block text-sm font-medium text-foreground mb-1.5"
          >Description</label
        >
        <textarea
          id="description"
          formControlName="description"
          rows="4"
          class="w-full px-4 py-2.5 rounded-lg bg-foreground/5 border border-foreground/20 text-foreground placeholder-muted focus:border-primary focus:outline-none transition-colors resize-y"
        ></textarea>
      </div>

      <div>
        <label for="image" class="block text-sm font-medium text-foreground mb-1.5">Image</label>
        <div
          role="button"
          tabindex="0"
          (drop)="onDrop($event)"
          (dragover)="onDragOver($event)"
          (dragleave)="onDragLeave($event)"
          (click)="fileInput.click()"
          (keydown.enter)="fileInput.click()"
          (keydown.space)="fileInput.click()"
          [class]="
            'relative flex flex-col items-center justify-center w-full rounded-lg border-2 border-dashed cursor-pointer transition-colors ' +
            (isDragging()
              ? 'border-primary bg-primary/10'
              : 'border-foreground/20 bg-foreground/5 hover:border-primary/50 hover:bg-foreground/10')
          "
        >
          @if (imagePreview()) {
            <div class="relative w-full">
              <img
                [src]="imagePreview()"
                alt="Aperçu"
                class="w-full max-h-56 object-contain rounded-lg"
              />
              <div
                class="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 hover:opacity-100 rounded-lg transition-opacity"
              >
                <span class="text-white text-sm font-medium">Changer l'image</span>
              </div>
            </div>
          } @else {
            <div class="flex flex-col items-center py-8 text-muted">
              <svg class="w-10 h-10 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="1.5"
                  d="M12 16V4m0 0l-4 4m4-4l4 4M4 20h16"
                />
              </svg>
              <p class="text-sm font-medium">Glissez une image ici</p>
              <p class="text-xs mt-1">ou cliquez pour parcourir</p>
            </div>
          }
        </div>
        <input
          id="image"
          #fileInput
          type="file"
          accept="image/*"
          (change)="onFileSelected($event)"
          class="hidden"
        />
      </div>

      <div>
        <label for="liveUrl" class="block text-sm font-medium text-foreground mb-1.5"
          >URL du site (optionnel)</label
        >
        <input
          id="liveUrl"
          type="text"
          formControlName="liveUrl"
          class="w-full px-4 py-2.5 rounded-lg bg-foreground/5 border border-foreground/20 text-foreground placeholder-muted focus:border-primary focus:outline-none transition-colors"
        />
      </div>

      <div>
        <label for="repoUrl" class="block text-sm font-medium text-foreground mb-1.5"
          >URL du dépôt (optionnel)</label
        >
        <input
          id="repoUrl"
          type="text"
          formControlName="repoUrl"
          class="w-full px-4 py-2.5 rounded-lg bg-foreground/5 border border-foreground/20 text-foreground placeholder-muted focus:border-primary focus:outline-none transition-colors"
        />
      </div>

      <div>
        <label for="repoUrlFront" class="block text-sm font-medium text-foreground mb-1.5"
          >URL dépôt frontend (optionnel)</label
        >
        <input
          id="repoUrlFront"
          type="text"
          formControlName="repoUrlFront"
          class="w-full px-4 py-2.5 rounded-lg bg-foreground/5 border border-foreground/20 text-foreground placeholder-muted focus:border-primary focus:outline-none transition-colors"
        />
      </div>

      <div>
        <label for="repoUrlBack" class="block text-sm font-medium text-foreground mb-1.5"
          >URL dépôt backend (optionnel)</label
        >
        <input
          id="repoUrlBack"
          type="text"
          formControlName="repoUrlBack"
          class="w-full px-4 py-2.5 rounded-lg bg-foreground/5 border border-foreground/20 text-foreground placeholder-muted focus:border-primary focus:outline-none transition-colors"
        />
      </div>

      <div class="flex gap-6">
        <div class="flex items-center gap-2">
          <input
            id="featured"
            type="checkbox"
            formControlName="featured"
            class="w-4 h-4 rounded border-foreground/20 text-primary focus:ring-primary"
          />
          <label for="featured" class="text-sm font-medium text-foreground">Featured</label>
        </div>

        <div>
          <label for="order" class="text-sm font-medium text-foreground mr-2">Ordre</label>
          <input
            id="order"
            type="number"
            formControlName="order"
            class="w-20 px-3 py-1.5 rounded-lg bg-foreground/5 border border-foreground/20 text-foreground focus:border-primary focus:outline-none transition-colors"
          />
        </div>
      </div>

      <div class="flex gap-4 pt-4">
        <button
          type="submit"
          [disabled]="form.invalid"
          class="px-6 py-2.5 rounded-lg bg-primary text-white font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {{ isEditMode() ? 'Enregistrer' : 'Créer' }}
        </button>
        <button
          type="button"
          (click)="cancel()"
          class="px-6 py-2.5 rounded-lg bg-foreground/5 text-foreground font-medium hover:bg-foreground/10 transition-colors"
        >
          Annuler
        </button>
      </div>
    </form>
  `,
})
export class AdminProjectForm implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly projectsGateway = inject(PROJECTS_GATEWAY);

  readonly id = input<string>();
  readonly isEditMode = signal(false);
  readonly selectedFile = signal<File | null>(null);
  readonly imagePreview = signal('');
  readonly isDragging = signal(false);
  readonly selectedTags = signal(new Set<string>());
  private existingImageUrl = '';

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
    order: [1],
  });

  ngOnInit(): void {
    const id = this.id();
    if (id) {
      this.isEditMode.set(true);
      this.projectsGateway.getProjectById(id).subscribe((project) => {
        this.existingImageUrl = project.image;
        this.imagePreview.set(project.image);
        this.selectedTags.set(new Set(project.tags));
        this.form.patchValue({
          title: project.title,
          category: project.category,
          description: project.description,
          liveUrl: project.liveUrl ?? '',
          repoUrl: project.repoUrl ?? '',
          repoUrlFront: project.repoUrlFront ?? '',
          repoUrlBack: project.repoUrlBack ?? '',
          featured: project.featured,
          order: project.order,
        });
      });
    }
  }

  onFileSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) this.selectFile(file);
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    this.isDragging.set(false);
    const file = event.dataTransfer?.files[0];
    if (file?.type.startsWith('image/')) this.selectFile(file);
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    this.isDragging.set(true);
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    this.isDragging.set(false);
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

  private selectFile(file: File): void {
    this.selectedFile.set(file);
    this.imagePreview.set(URL.createObjectURL(file));
  }

  onSubmit(): void {
    if (this.form.invalid) return;

    const values = this.form.getRawValue();
    const slug = this.slugify(values.title);
    const file = this.selectedFile();

    const buildProject = (imageUrl: string): Omit<Project, 'id'> => ({
      title: values.title,
      category: values.category,
      tags: [...this.selectedTags()],
      description: values.description,
      image: imageUrl,
      liveUrl: values.liveUrl || undefined,
      repoUrl: values.repoUrl || undefined,
      repoUrlFront: values.repoUrlFront || undefined,
      repoUrlBack: values.repoUrlBack || undefined,
      featured: values.featured,
      order: values.order,
    });

    const id = this.id();

    if (file) {
      this.projectsGateway
        .uploadImage(file, slug)
        .pipe(
          switchMap((url) => {
            const project = buildProject(url);
            return id
              ? this.projectsGateway.updateProject(id, project)
              : this.projectsGateway.createProject(project);
          }),
        )
        .subscribe(() => this.router.navigate(['/admin/projects/all']));
    } else {
      const project = buildProject(this.existingImageUrl);
      const request$ = id
        ? this.projectsGateway.updateProject(id, project)
        : this.projectsGateway.createProject(project);
      request$.subscribe(() => this.router.navigate(['/admin/projects/all']));
    }
  }

  cancel(): void {
    this.router.navigate(['/admin/projects/all']);
  }

  private slugify(text: string): string {
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }
}
