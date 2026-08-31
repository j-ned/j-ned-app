import {
  Component,
  inject,
  input,
  output,
  signal,
  linkedSignal,
  computed,
  effect,
  ChangeDetectionStrategy,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { DomSanitizer, type SafeHtml } from '@angular/platform-browser';
import type { BlogPost, BlogPostInput } from '@features/blog/domain/models/blog-post.model';
import { parseMarkdown } from '@features/blog/infra/parse-markdown';
import { AdminTagsSelector } from './admin-tags-selector';
import { FileDropzone } from '@shared/ui/file-dropzone';
import { Button } from '@shared/ui/button';
import { AVAILABLE_BLOG_TAGS } from './admin-blog-form-data';

@Component({
  selector: 'app-admin-blog-form',
  imports: [ReactiveFormsModule, AdminTagsSelector, FileDropzone, Button],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  template: `
    <form
      [formGroup]="form"
      (ngSubmit)="submitPost()"
      class="bg-foreground/5 border border-foreground/10 rounded-xl p-6 space-y-5"
    >
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
        <label for="excerpt" class="form-label">Extrait</label>
        <textarea
          id="excerpt"
          formControlName="excerpt"
          rows="2"
          aria-required="true"
          class="form-textarea"
        ></textarea>
        @if (form.controls.excerpt.touched && form.controls.excerpt.errors?.['required']) {
          <span role="alert" class="form-error">Ce champ est obligatoire</span>
        }
      </div>

      <app-admin-tags-selector [availableTags]="availableTags" [(selectedTags)]="selectedTags" />

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label for="contentMarkdown" class="form-label">Contenu (Markdown)</label>
          <textarea
            id="contentMarkdown"
            formControlName="contentMarkdown"
            rows="20"
            aria-required="true"
            class="form-textarea font-mono text-sm"
          ></textarea>
          @if (
            form.controls.contentMarkdown.touched &&
            form.controls.contentMarkdown.errors?.['required']
          ) {
            <span role="alert" class="form-error">Ce champ est obligatoire</span>
          }
        </div>
        <div>
          <span class="form-label">Aperçu</span>
          <div
            class="prose max-w-none border border-foreground/10 rounded-lg p-4 h-[calc(100%-1.5rem)] overflow-y-auto"
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
        <select id="status" formControlName="status" class="app-select">
          <option value="draft">Brouillon</option>
          <option value="published">Publié</option>
        </select>
        @if (form.controls.status.value === 'published') {
          <p class="text-xs text-muted mt-1">
            La publication déclenche un redéploiement du site — l'article sera visible en ligne
            d'ici quelques minutes.
          </p>
        }
      </div>

      <div class="flex gap-3 pt-2">
        <app-button type="submit" severity="primary" [disabled]="form.invalid">
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
  private readonly fb = inject(FormBuilder);
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

  readonly form = this.fb.nonNullable.group({
    title: ['', Validators.required],
    excerpt: ['', Validators.required],
    contentMarkdown: ['', Validators.required],
    status: ['draft' as 'draft' | 'published', Validators.required],
  });

  private readonly _contentMarkdown = toSignal(
    this.form.controls.contentMarkdown.valueChanges,
    { initialValue: this.form.controls.contentMarkdown.value },
  );

  protected readonly preview = computed((): SafeHtml =>
    this.sanitizer.bypassSecurityTrustHtml(parseMarkdown(this._contentMarkdown())),
  );

  // `effect()` (pas une IIFE en field initializer) : un champ initializer tourne pendant le
  // constructeur, avant qu'Angular n'applique la valeur liée par `input()` à `this.post` — donc
  // `this.post()` y est toujours `undefined` et le formulaire d'édition restait vide. `effect()`
  // se relance dès que `post` est effectivement peuplé. Même pattern que
  // `AdminProjectInlineForm._patchForm`.
  private readonly _patchForm = effect(() => {
    const p = this.post();
    if (!p) return;
    this.form.patchValue({
      title: p.title,
      excerpt: p.excerpt,
      contentMarkdown: p.contentMarkdown,
      status: p.status,
    });
  });

  onFileSelected(file: File): void {
    this.selectedFile.set(file);
  }

  submitPost(): void {
    if (this.form.invalid) return;
    const values = this.form.getRawValue();
    const data: BlogPostInput = { ...values, tags: [...this.selectedTags()] };
    this.saved.emit({ data, file: this.selectedFile() });
  }
}
