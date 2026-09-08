import {
  Component,
  inject,
  input,
  output,
  signal,
  linkedSignal,
  computed,
  ChangeDetectionStrategy,
} from '@angular/core';
import { FormField, FormRoot, form, required, submit } from '@angular/forms/signals';
import { DomSanitizer, type SafeHtml } from '@angular/platform-browser';
import type { BlogPost, BlogPostInput } from '@features/blog/domain/models/blog-post.model';
import { parseMarkdown } from '@features/blog/infra/parse-markdown';
import { AdminTagsSelector } from './admin-tags-selector';
import { FileDropzone } from '@shared/ui/file-dropzone';
import { Button } from '@shared/ui/button';
import { AVAILABLE_BLOG_TAGS } from './admin-blog-form-data';

type BlogFormModel = Pick<BlogPostInput, 'title' | 'excerpt' | 'contentMarkdown' | 'status'>;

const EMPTY: BlogFormModel = { title: '', excerpt: '', contentMarkdown: '', status: 'draft' };

const toModel = (p: BlogPost): BlogFormModel => ({
  title: p.title,
  excerpt: p.excerpt,
  contentMarkdown: p.contentMarkdown,
  status: p.status,
});

@Component({
  selector: 'app-admin-blog-form',
  imports: [FormRoot, FormField, AdminTagsSelector, FileDropzone, Button],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  template: `
    <form
      [formRoot]="form"
      class="bg-foreground/5 border border-foreground/10 rounded-xl p-6 space-y-5"
    >
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
        @let excerpt = form.excerpt();
        <label for="excerpt" class="form-label">Extrait</label>
        <textarea
          id="excerpt"
          [formField]="form.excerpt"
          rows="2"
          aria-required="true"
          class="form-textarea"
        ></textarea>
        @if (excerpt.touched() && excerpt.invalid()) {
          <span role="alert" class="form-error">{{ excerpt.errors()[0].message }}</span>
        }
      </div>

      <app-admin-tags-selector [availableTags]="availableTags" [(selectedTags)]="selectedTags" />

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          @let content = form.contentMarkdown();
          <label for="contentMarkdown" class="form-label">Contenu (Markdown)</label>
          <textarea
            id="contentMarkdown"
            [formField]="form.contentMarkdown"
            rows="20"
            aria-required="true"
            class="form-textarea font-mono text-sm"
          ></textarea>
          @if (content.touched() && content.invalid()) {
            <span role="alert" class="form-error">{{ content.errors()[0].message }}</span>
          }
        </div>
        <div>
          <span class="form-label">Aperçu</span>
          <div
            class="prose max-w-none dark:prose-invert border border-foreground/10 rounded-lg p-4 h-[calc(100%-1.5rem)] overflow-y-auto"
            [innerHTML]="preview()"
          ></div>
        </div>
      </div>

      <div>
        <span class="form-label">Image de couverture</span>
        <app-file-dropzone
          accept="image/*"
          label="Image de couverture"
          helperText="JPG, PNG, WebP, affichée en tête de l'article"
          [previewUrl]="coverPreview()"
          (fileSelected)="onFileSelected($event)"
        />
      </div>

      <div>
        <label for="status" class="form-label">Statut</label>
        <select id="status" [formField]="form.status" class="app-select">
          <option value="draft">Brouillon</option>
          <option value="published">Publié</option>
        </select>
        @if (form.status().value() === 'published') {
          <p class="text-xs text-muted mt-1">
            La publication déclenche un redéploiement du site — l'article sera visible en ligne
            d'ici quelques minutes.
          </p>
        }
      </div>

      <div class="flex gap-3 pt-2">
        <app-button type="submit" severity="primary" [disabled]="form().submitting()">
          Enregistrer
        </app-button>
        <app-button severity="secondary" variant="outlined" (click)="cancelled.emit()">
          Annuler
        </app-button>
      </div>
    </form>
  `,
})
export class AdminBlogForm {
  private readonly sanitizer = inject(DomSanitizer);

  readonly post = input<BlogPost>();
  readonly saved = output<{ data: BlogPostInput; file: File | null }>();
  readonly cancelled = output<void>();

  readonly availableTags = AVAILABLE_BLOG_TAGS;

  readonly selectedTags = linkedSignal({
    source: this.post,
    computation: (p, previous): Set<string> =>
      p ? new Set(p.tags ?? []) : (previous?.value ?? new Set<string>()),
  });

  readonly coverPreview = linkedSignal({
    source: this.post,
    computation: (p, previous): string => p?.coverImage ?? previous?.value ?? '',
  });

  private readonly selectedFile = signal<File | null>(null);

  // Le modèle suit l'article à éditer dès qu'il arrive par `input()` et reste éditable ensuite.
  private readonly _model = linkedSignal({
    source: this.post,
    computation: (p, previous): BlogFormModel => (p ? toModel(p) : (previous?.value ?? EMPTY)),
  });

  readonly form = form(
    this._model,
    (path) => {
      required(path.title, { message: 'Ce champ est obligatoire' });
      required(path.excerpt, { message: 'Ce champ est obligatoire' });
      required(path.contentMarkdown, { message: 'Ce champ est obligatoire' });
      required(path.status, { message: 'Ce champ est obligatoire' });
    },
    {
      submission: {
        action: async () => {
          const data: BlogPostInput = { ...this._model(), tags: [...this.selectedTags()] };
          this.saved.emit({ data, file: this.selectedFile() });
        },
      },
    },
  );

  // L'aperçu lit le modèle : sortie déjà assainie par `parseMarkdown` (ADR-0002).
  protected readonly preview = computed(
    (): SafeHtml =>
      this.sanitizer.bypassSecurityTrustHtml(parseMarkdown(this._model().contentMarkdown)),
  );

  onFileSelected(file: File): void {
    this.selectedFile.set(file);
  }

  async submitPost(): Promise<void> {
    await submit(this.form);
  }
}
