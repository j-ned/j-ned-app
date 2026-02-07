import { Component, inject, input, signal, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { PROJECTS_GATEWAY } from '../../projects/domain/gateways';

@Component({
  selector: 'app-admin-project-form',
  imports: [ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div>
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
          <input
            id="category"
            type="text"
            formControlName="category"
            class="w-full px-4 py-2.5 rounded-lg bg-foreground/5 border border-foreground/20 text-foreground placeholder-muted focus:border-primary focus:outline-none transition-colors"
            placeholder="Application Web, Script, ..."
          />
        </div>

        <div>
          <label for="tags" class="block text-sm font-medium text-foreground mb-1.5"
            >Tags (séparés par des virgules)</label
          >
          <input
            id="tags"
            type="text"
            formControlName="tags"
            class="w-full px-4 py-2.5 rounded-lg bg-foreground/5 border border-foreground/20 text-foreground placeholder-muted focus:border-primary focus:outline-none transition-colors"
            placeholder="Angular, TypeScript, ..."
          />
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
          <label for="image" class="block text-sm font-medium text-foreground mb-1.5"
            >Image URL</label
          >
          <input
            id="image"
            type="text"
            formControlName="image"
            class="w-full px-4 py-2.5 rounded-lg bg-foreground/5 border border-foreground/20 text-foreground placeholder-muted focus:border-primary focus:outline-none transition-colors"
            placeholder="/images/mon-projet.avif"
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
    </div>
  `,
})
export class AdminProjectForm implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly projectsGateway = inject(PROJECTS_GATEWAY);

  readonly id = input<string>();
  readonly isEditMode = signal(false);

  readonly form = this.fb.nonNullable.group({
    title: ['', Validators.required],
    category: ['', Validators.required],
    tags: [''],
    description: ['', Validators.required],
    image: [''],
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
        this.form.patchValue({
          title: project.title,
          category: project.category,
          tags: project.tags.join(', '),
          description: project.description,
          image: project.image,
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

  onSubmit(): void {
    if (this.form.invalid) return;

    const values = this.form.getRawValue();
    const project = {
      title: values.title,
      category: values.category,
      tags: values.tags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean),
      description: values.description,
      image: values.image,
      liveUrl: values.liveUrl || undefined,
      repoUrl: values.repoUrl || undefined,
      repoUrlFront: values.repoUrlFront || undefined,
      repoUrlBack: values.repoUrlBack || undefined,
      featured: values.featured,
      order: values.order,
    };

    const id = this.id();
    const request$ = id
      ? this.projectsGateway.updateProject(id, project)
      : this.projectsGateway.createProject(project);

    request$.subscribe(() => this.router.navigate(['/admin/projects']));
  }

  cancel(): void {
    this.router.navigate(['/admin/projects']);
  }
}
