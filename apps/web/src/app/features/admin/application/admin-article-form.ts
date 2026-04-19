import {
  Component,
  DestroyRef,
  inject,
  input,
  signal,
  computed,
  ChangeDetectionStrategy,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { switchMap } from 'rxjs';
import { BLOG_GATEWAY } from '@features/blog/application';
import type { Article } from '@features/blog/domain';
import { ToastService } from '@shared/ui';
import { Button } from 'primeng/button';
import { InputText } from 'primeng/inputtext';
import { Textarea } from 'primeng/textarea';
import { Message } from 'primeng/message';
import { FileUpload } from 'primeng/fileupload';

@Component({
  selector: 'app-admin-article-form',
  imports: [ReactiveFormsModule, FileUpload, Button, InputText, Textarea, Message],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  template: `
    <h1 class="text-2xl font-bold text-foreground mb-8">
      {{ isEditMode() ? "Modifier l'article" : 'Nouvel article' }}
    </h1>

    <form [formGroup]="form" (ngSubmit)="onSubmit()" class="max-w-2xl space-y-6">
      <fieldset class="space-y-6 border-0 p-0 m-0">
        <legend class="sr-only">Informations de l'article</legend>

        <div>
          <label for="title" class="text-sm font-medium text-foreground">Titre</label>
          <input id="title" type="text" formControlName="title" pInputText fluid />
          @if (form.controls.title.touched && form.controls.title.errors?.['required']) {
            <p-message
              severity="error"
              text="Ce champ est obligatoire"
              size="small"
              variant="simple"
            />
          }
        </div>

        <div>
          <label for="author" class="text-sm font-medium text-foreground">Auteur</label>
          <input id="author" type="text" formControlName="author" pInputText fluid />
          @if (form.controls.author.touched && form.controls.author.errors?.['required']) {
            <p-message
              severity="error"
              text="Ce champ est obligatoire"
              size="small"
              variant="simple"
            />
          }
        </div>

        <div>
          <label for="date" class="text-sm font-medium text-foreground">Date</label>
          <input id="date" type="date" formControlName="date" pInputText fluid />
          @if (form.controls.date.touched && form.controls.date.errors?.['required']) {
            <p-message
              severity="error"
              text="Ce champ est obligatoire"
              size="small"
              variant="simple"
            />
          }
        </div>

        <div>
          <label for="excerpt" class="text-sm font-medium text-foreground">Extrait</label>
          <textarea id="excerpt" formControlName="excerpt" rows="2" pTextarea></textarea>
          @if (form.controls.excerpt.touched && form.controls.excerpt.errors?.['required']) {
            <p-message
              severity="error"
              text="Ce champ est obligatoire"
              size="small"
              variant="simple"
            />
          }
        </div>

        <div>
          <label for="content" class="text-sm font-medium text-foreground">Contenu</label>
          <textarea id="content" formControlName="content" rows="10" pTextarea></textarea>
          @if (form.controls.content.touched && form.controls.content.errors?.['required']) {
            <p-message
              severity="error"
              text="Ce champ est obligatoire"
              size="small"
              variant="simple"
            />
          }
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

        <div class="flex items-center gap-2">
          <input
            id="featured"
            type="checkbox"
            formControlName="featured"
            class="w-4 h-4 rounded border-foreground/20 text-primary focus:ring-primary"
          />
          <label for="featured" class="text-sm font-medium text-foreground"
            >Mettre en avant sur la page d'accueil</label
          >
        </div>

        <div>
          <span class="block text-sm font-medium text-foreground mb-1.5">Image</span>
          @if (imagePreview()) {
            <img
              [src]="imagePreview()"
              alt="Aperçu image"
              class="w-full max-h-56 object-contain rounded-xl mb-3 border border-foreground/10"
            />
          }
          <p-fileupload
            mode="advanced"
            [auto]="false"
            [showUploadButton]="false"
            [showCancelButton]="false"
            [multiple]="false"
            accept="image/*"
            chooseLabel="Choisir une image"
            (onSelect)="onFileSelected($event.files[0])"
          />
        </div>
      </fieldset>

      <div class="flex gap-4 pt-4">
        <p-button
          type="submit"
          [label]="isEditMode() ? 'Enregistrer' : 'Créer'"
          [disabled]="form.invalid"
        />
        <p-button
          type="button"
          label="Annuler"
          severity="secondary"
          [outlined]="true"
          (onClick)="cancel()"
        />
      </div>
    </form>
  `,
})
export class AdminArticleForm {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly blogGateway = inject(BLOG_GATEWAY);
  private readonly toast = inject(ToastService);
  private readonly destroyRef = inject(DestroyRef);

  readonly id = input<string>();
  readonly isEditMode = computed(() => !!this.id());
  readonly selectedFile = signal<File | null>(null);
  readonly imagePreview = signal('');
  readonly selectedTags = signal(new Set<string>());
  private existingImageUrl = '';

  readonly availableTags = [
    'Angular',
    'TypeScript',
    'JavaScript',
    'NestJS',
    'Node.js',
    'Python',
    'Bash',
    'TailwindCSS',
    'CSS',
    'PostgreSQL',
    'MongoDB',
    'Supabase',
    'Docker',
    'CI/CD',
    'Git',
    'API',
    'REST',
    'DevOps',
    'Linux',
    'Tutoriel',
    "Retour d'expérience",
    'Bonnes pratiques',
    'Performance',
    'Sécurité',
    'Architecture',
    'Tests',
  ];

  readonly form = this.fb.nonNullable.group({
    title: ['', Validators.required],
    author: ['Julien Nédellec', Validators.required],
    date: [new Date().toISOString().split('T')[0], Validators.required],
    excerpt: ['', Validators.required],
    content: ['', Validators.required],
    featured: [false],
  });
  toggleTag(tag: string): void {
    const tags = new Set(this.selectedTags());
    if (tags.has(tag)) {
      tags.delete(tag);
    } else {
      tags.add(tag);
    }
    this.selectedTags.set(tags);
  }

  onFileSelected(file: File): void {
    if (file.type.startsWith('image/')) this.selectFile(file);
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

    const buildArticle = (imageUrl: string): Omit<Article, 'id'> => ({
      title: values.title,
      author: values.author,
      date: values.date,
      excerpt: values.excerpt,
      content: values.content,
      tags: [...this.selectedTags()],
      image: imageUrl,
      featured: values.featured,
    });

    const id = this.id();

    if (file) {
      this.blogGateway
        .uploadImage(file, slug)
        .pipe(
          switchMap((key) => {
            const article = buildArticle(key);
            return id
              ? this.blogGateway.updateArticle(id, article)
              : this.blogGateway.createArticle(article);
          }),
          takeUntilDestroyed(this.destroyRef),
        )
        .subscribe({
          next: () => {
            this.toast.add({
              severity: 'success',
              summary: 'Succès',
              detail: id ? 'Article mis à jour' : 'Article créé',
            });
            this.router.navigate(['/admin/content/articles']);
          },
          error: () =>
            this.toast.add({
              severity: 'error',
              summary: 'Erreur',
              detail: "Erreur lors de l'enregistrement",
            }),
        });
    } else {
      const article = buildArticle(this.existingImageUrl);
      const request$ = id
        ? this.blogGateway.updateArticle(id, article)
        : this.blogGateway.createArticle(article);
      request$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
        next: () => {
          this.toast.add({
            severity: 'success',
            summary: 'Succès',
            detail: id ? 'Article mis à jour' : 'Article créé',
          });
          this.router.navigate(['/admin/content/articles']);
        },
        error: () =>
          this.toast.add({
            severity: 'error',
            summary: 'Erreur',
            detail: "Erreur lors de l'enregistrement",
          }),
      });
    }
  }

  cancel(): void {
    this.router.navigate(['/admin/content/articles']);
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
