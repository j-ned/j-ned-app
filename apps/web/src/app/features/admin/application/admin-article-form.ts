import {
  Component,
  DestroyRef,
  inject,
  input,
  signal,
  computed,
  effect,
  ChangeDetectionStrategy,
} from '@angular/core';
import { takeUntilDestroyed, rxResource } from '@angular/core/rxjs-interop';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { switchMap } from 'rxjs';
import { BLOG_GATEWAY } from '@features/blog/application';
import type { FormControl } from '@angular/forms';
import type { Article } from '@features/blog/domain';
import { ToastService } from '@shared/toast';
import { FileDropZone } from '@shared/file-drop-zone';

type ArticleFormShape = {
  title: FormControl<string>;
  author: FormControl<string>;
  date: FormControl<string>;
  excerpt: FormControl<string>;
  content: FormControl<string>;
  featured: FormControl<boolean>;
};

@Component({
  selector: 'app-admin-article-form',
  imports: [ReactiveFormsModule, FileDropZone],
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
          <label for="title" class="block text-sm font-medium text-foreground mb-1.5">Titre</label>
          <input
            id="title"
            type="text"
            formControlName="title"
            class="w-full px-4 py-2.5 rounded-lg bg-foreground/5 border border-foreground/20 text-foreground placeholder-muted focus:border-primary focus:outline-none transition-colors"
          />
          @if (form.controls.title.touched && form.controls.title.errors?.['required']) {
            <span class="text-red-400 text-xs mt-1 block">Ce champ est obligatoire</span>
          }
        </div>

        <div>
          <label for="author" class="block text-sm font-medium text-foreground mb-1.5"
            >Auteur</label
          >
          <input
            id="author"
            type="text"
            formControlName="author"
            class="w-full px-4 py-2.5 rounded-lg bg-foreground/5 border border-foreground/20 text-foreground placeholder-muted focus:border-primary focus:outline-none transition-colors"
          />
          @if (form.controls.author.touched && form.controls.author.errors?.['required']) {
            <span class="text-red-400 text-xs mt-1 block">Ce champ est obligatoire</span>
          }
        </div>

        <div>
          <label for="date" class="block text-sm font-medium text-foreground mb-1.5">Date</label>
          <input
            id="date"
            type="date"
            formControlName="date"
            class="w-full px-4 py-2.5 rounded-lg bg-foreground/5 border border-foreground/20 text-foreground placeholder-muted focus:border-primary focus:outline-none transition-colors"
          />
          @if (form.controls.date.touched && form.controls.date.errors?.['required']) {
            <span class="text-red-400 text-xs mt-1 block">Ce champ est obligatoire</span>
          }
        </div>

        <div>
          <label for="excerpt" class="block text-sm font-medium text-foreground mb-1.5"
            >Extrait</label
          >
          <textarea
            id="excerpt"
            formControlName="excerpt"
            rows="2"
            class="w-full px-4 py-2.5 rounded-lg bg-foreground/5 border border-foreground/20 text-foreground placeholder-muted focus:border-primary focus:outline-none transition-colors resize-y"
          ></textarea>
          @if (form.controls.excerpt.touched && form.controls.excerpt.errors?.['required']) {
            <span class="text-red-400 text-xs mt-1 block">Ce champ est obligatoire</span>
          }
        </div>

        <div>
          <label for="content" class="block text-sm font-medium text-foreground mb-1.5"
            >Contenu</label
          >
          <textarea
            id="content"
            formControlName="content"
            rows="10"
            class="w-full px-4 py-2.5 rounded-lg bg-foreground/5 border border-foreground/20 text-foreground placeholder-muted focus:border-primary focus:outline-none transition-colors resize-y"
          ></textarea>
          @if (form.controls.content.touched && form.controls.content.errors?.['required']) {
            <span class="text-red-400 text-xs mt-1 block">Ce champ est obligatoire</span>
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
          <label class="block text-sm font-medium text-foreground mb-1.5">Image</label>
          <app-file-drop-zone [preview]="imagePreview()" (fileSelected)="onFileSelected($event)" />
        </div>
      </fieldset>

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

  private readonly editData = rxResource({
    params: () => (this.id() ? { id: this.id()! } : undefined),
    stream: ({ params }) => this.blogGateway.getArticleById(params.id),
  });

  private readonly patchForm = effect(() => {
    const article = this.editData.value();
    if (article) {
      this.existingImageUrl = article.image;
      this.imagePreview.set(article.image);
      this.selectedTags.set(new Set(article.tags));
      this.form.patchValue({
        title: article.title,
        author: article.author,
        date: article.date,
        excerpt: article.excerpt,
        content: article.content,
        featured: article.featured,
      });
    }
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
            this.toast.success(id ? 'Article mis à jour' : 'Article créé');
            this.router.navigate(['/admin/blog/articles']);
          },
          error: () => this.toast.error("Erreur lors de l'enregistrement"),
        });
    } else {
      const article = buildArticle(this.existingImageUrl);
      const request$ = id
        ? this.blogGateway.updateArticle(id, article)
        : this.blogGateway.createArticle(article);
      request$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
        next: () => {
          this.toast.success(id ? 'Article mis à jour' : 'Article créé');
          this.router.navigate(['/admin/blog/articles']);
        },
        error: () => this.toast.error("Erreur lors de l'enregistrement"),
      });
    }
  }

  cancel(): void {
    this.router.navigate(['/admin/blog/articles']);
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
