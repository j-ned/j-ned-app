import { Component, inject, input, signal, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { switchMap } from 'rxjs';
import { BLOG_GATEWAY } from '../../blog/domain';
import type { Article } from '../../blog/domain';

@Component({
  selector: 'app-admin-article-form',
  imports: [ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  template: `
    <h1 class="text-2xl font-bold text-foreground mb-8">
      {{ isEditMode() ? "Modifier l'article" : 'Nouvel article' }}
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
        <label for="author" class="block text-sm font-medium text-foreground mb-1.5">Auteur</label>
        <input
          id="author"
          type="text"
          formControlName="author"
          class="w-full px-4 py-2.5 rounded-lg bg-foreground/5 border border-foreground/20 text-foreground placeholder-muted focus:border-primary focus:outline-none transition-colors"
        />
      </div>

      <div>
        <label for="date" class="block text-sm font-medium text-foreground mb-1.5">Date</label>
        <input
          id="date"
          type="date"
          formControlName="date"
          class="w-full px-4 py-2.5 rounded-lg bg-foreground/5 border border-foreground/20 text-foreground placeholder-muted focus:border-primary focus:outline-none transition-colors"
        />
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
export class AdminArticleForm implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly blogGateway = inject(BLOG_GATEWAY);

  readonly id = input<string>();
  readonly isEditMode = signal(false);
  readonly selectedFile = signal<File | null>(null);
  readonly imagePreview = signal('');
  readonly isDragging = signal(false);
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
  });

  ngOnInit(): void {
    const id = this.id();
    if (id) {
      this.isEditMode.set(true);
      this.blogGateway.getArticleById(Number(id)).subscribe((article) => {
        this.existingImageUrl = article.image;
        this.imagePreview.set(article.image);
        this.selectedTags.set(new Set(article.tags));
        this.form.patchValue({
          title: article.title,
          author: article.author,
          date: article.date,
          excerpt: article.excerpt,
          content: article.content,
        });
      });
    }
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
    });

    const id = this.id();

    if (file) {
      this.blogGateway
        .uploadImage(file, slug)
        .pipe(
          switchMap((url) => {
            const article = buildArticle(url);
            return id
              ? this.blogGateway.updateArticle(Number(id), article)
              : this.blogGateway.createArticle(article);
          }),
        )
        .subscribe(() => this.router.navigate(['/admin/blog/articles']));
    } else {
      const article = buildArticle(this.existingImageUrl);
      const request$ = id
        ? this.blogGateway.updateArticle(Number(id), article)
        : this.blogGateway.createArticle(article);
      request$.subscribe(() => this.router.navigate(['/admin/blog/articles']));
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
