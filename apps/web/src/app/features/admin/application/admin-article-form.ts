import { Component, inject, input, signal, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { BLOG_GATEWAY } from '../../blog/domain/gateways';

@Component({
  selector: 'app-admin-article-form',
  imports: [ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div>
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
          <label for="author" class="block text-sm font-medium text-foreground mb-1.5"
            >Auteur</label
          >
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
          <label for="image" class="block text-sm font-medium text-foreground mb-1.5"
            >Image URL</label
          >
          <input
            id="image"
            type="text"
            formControlName="image"
            class="w-full px-4 py-2.5 rounded-lg bg-foreground/5 border border-foreground/20 text-foreground placeholder-muted focus:border-primary focus:outline-none transition-colors"
            placeholder="/images/blog/mon-article.avif"
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
    </div>
  `,
})
export class AdminArticleForm implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly blogGateway = inject(BLOG_GATEWAY);

  readonly id = input<string>();
  readonly isEditMode = signal(false);

  readonly form = this.fb.nonNullable.group({
    title: ['', Validators.required],
    author: ['Julien Nédellec', Validators.required],
    date: [new Date().toISOString().split('T')[0], Validators.required],
    excerpt: ['', Validators.required],
    content: ['', Validators.required],
    tags: [''],
    image: [''],
  });

  ngOnInit(): void {
    const id = this.id();
    if (id) {
      this.isEditMode.set(true);
      this.blogGateway.getArticleById(Number(id)).subscribe((article) => {
        this.form.patchValue({
          title: article.title,
          author: article.author,
          date: article.date,
          excerpt: article.excerpt,
          content: article.content,
          tags: article.tags.join(', '),
          image: article.image,
        });
      });
    }
  }

  onSubmit(): void {
    if (this.form.invalid) return;

    const values = this.form.getRawValue();
    const article = {
      title: values.title,
      author: values.author,
      date: values.date,
      excerpt: values.excerpt,
      content: values.content,
      tags: values.tags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean),
      image: values.image,
    };

    const id = this.id();
    const request$ = id
      ? this.blogGateway.updateArticle(Number(id), article)
      : this.blogGateway.createArticle(article);

    request$.subscribe(() => this.router.navigate(['/admin/articles']));
  }

  cancel(): void {
    this.router.navigate(['/admin/articles']);
  }
}
