import { Component, computed, inject, input, model, output } from '@angular/core';
import { NgOptimizedImage } from '@angular/common';
import { FormField, FormRoot, form, required } from '@angular/forms/signals';
import { DomSanitizer, type SafeHtml } from '@angular/platform-browser';
import type { BlogPostInput } from '@features/blog/domain/models/blog-post.model';
import { AVAILABLE_BLOG_TAGS } from '@features/blog/domain/models/blog-tag.model';
import { parseMarkdown } from '@features/blog/infra/parse-markdown';
import { FileDropzone } from '@shared/ui/file-dropzone';
import { AdminTagsSelector } from './admin-tags-selector';
import { AdminFormSection } from './admin-form-section';
import { toPostInput, type PostDraft } from '../post-draft';

const REQUIRED = 'Ce champ est obligatoire';

@Component({
  selector: 'app-admin-post-form',
  imports: [
    FormRoot,
    FormField,
    NgOptimizedImage,
    FileDropzone,
    AdminTagsSelector,
    AdminFormSection,
  ],
  host: { class: 'block' },
  template: `
    <form
      id="post-form"
      data-testid="admin-post-form"
      [formRoot]="form"
      novalidate
      class="grid gap-8.5"
    >
      <fieldset
        app-admin-form-section
        id="post-article"
        number="01"
        heading="Article"
        description="Ce que la liste du blog affiche&nbsp;: titre, extrait, sujets."
      >
        <div class="grid grid-cols-1 gap-5">
          <div>
            @let title = form.title();
            <label for="post-title" class="field-label">
              Titre <span class="font-mono text-xs font-medium text-muted">obligatoire</span>
            </label>
            <input
              id="post-title"
              type="text"
              data-testid="admin-post-title"
              [formField]="form.title"
              class="form-input"
            />
            @if (title.touched() && title.invalid()) {
              <span data-testid="admin-post-title-error" role="alert" class="form-error">
                {{ title.errors()[0].message }}
              </span>
            }
          </div>
          <div>
            @let excerpt = form.excerpt();
            <label for="post-excerpt" class="field-label">
              Extrait <span class="font-mono text-xs font-medium text-muted">obligatoire</span>
            </label>
            <textarea
              id="post-excerpt"
              data-testid="admin-post-excerpt"
              [formField]="form.excerpt"
              rows="2"
              class="form-textarea min-h-0"
            ></textarea>
            @if (excerpt.touched() && excerpt.invalid()) {
              <span data-testid="admin-post-excerpt-error" role="alert" class="form-error">
                {{ excerpt.errors()[0].message }}
              </span>
            }
          </div>
          <app-admin-tags-selector
            data-testid="admin-post-tags"
            [availableTags]="availableTags"
            [(selectedTags)]="tags"
          />
        </div>
      </fieldset>

      <fieldset
        app-admin-form-section
        id="post-content"
        number="02"
        heading="Contenu"
        description="Le corps de l'article en Markdown, rendu à côté comme sur le site."
      >
        <div class="grid grid-cols-1 gap-5">
          <div>
            @let content = form.contentMarkdown();
            <label for="post-content-markdown" class="field-label">
              Contenu (Markdown)
              <span class="font-mono text-xs font-medium text-muted">obligatoire</span>
            </label>
            <textarea
              id="post-content-markdown"
              data-testid="admin-post-content"
              [formField]="form.contentMarkdown"
              rows="20"
              class="form-textarea font-mono text-sm"
            ></textarea>
            @if (content.touched() && content.invalid()) {
              <span data-testid="admin-post-content-error" role="alert" class="form-error">
                {{ content.errors()[0].message }}
              </span>
            }
          </div>
          <div>
            <p id="post-content-preview-label" class="field-label">Rendu</p>
            <div
              data-testid="admin-post-content-preview"
              role="group"
              aria-labelledby="post-content-preview-label"
              class="prose max-h-[32rem] max-w-none overflow-y-auto rounded-sm border border-line p-4 dark:prose-invert"
              [innerHTML]="contentPreview()"
            ></div>
          </div>
        </div>
      </fieldset>

      <fieldset
        app-admin-form-section
        id="post-cover"
        number="03"
        heading="Couverture"
        description="L'image de la liste et de l'en-tête de l'article."
      >
        <div
          class="grid grid-cols-1 items-start gap-4.5"
          [class]="persistedCover() ? 'sm:grid-cols-[15rem_minmax(0,1fr)]' : ''"
        >
          @if (persistedCover(); as cover) {
            <figure
              data-testid="admin-post-cover-current"
              class="relative aspect-[1200/630] w-full overflow-hidden rounded-md border border-line-strong bg-surface"
            >
              <img [ngSrc]="cover" [alt]="currentCoverAlt()" fill class="object-cover" />
            </figure>
          }
          <app-file-dropzone
            data-testid="admin-post-cover"
            accept="image/*"
            label="Remplacer l'image"
            helperText="AVIF, WebP, JPG ou PNG · ratio 1200/630 conseillé"
            (fileSelected)="selectCover($event)"
          />
        </div>
      </fieldset>

      <fieldset
        app-admin-form-section
        id="post-publication"
        number="04"
        heading="Publication"
        description="Un brouillon reste hors du site."
      >
        <div class="grid gap-2.5 sm:grid-cols-2">
          @for (option of statuses; track option.value) {
            <label
              class="flex min-h-11 cursor-pointer items-center gap-3 rounded-md border border-field px-3.5 py-2.5 text-[0.90625rem] has-checked:border-primary has-checked:shadow-[inset_0_0_0_1px_var(--color-primary)]"
            >
              <input
                type="radio"
                class="accent-primary-bg size-4.5"
                [value]="option.value"
                [attr.data-testid]="'admin-post-status-' + option.value"
                [formField]="form.status"
              />{{ option.label }}
            </label>
          }
        </div>
        @if (form.status().value() === 'published') {
          <p data-testid="admin-post-redeploy-note" class="field-hint">
            Publier l'article redéploie le site&nbsp;: il est en ligne quelques minutes plus tard.
          </p>
        }
      </fieldset>
    </form>
  `,
})
export class AdminPostForm {
  private readonly sanitizer = inject(DomSanitizer);

  readonly value = model.required<PostDraft>();
  readonly tags = model.required<ReadonlySet<string>>();
  readonly persistedCover = input('');
  readonly submitted = output<BlogPostInput>();
  readonly coverSelected = output<File>();

  protected readonly availableTags = AVAILABLE_BLOG_TAGS;
  protected readonly statuses = [
    { value: 'draft', label: 'Brouillon' },
    { value: 'published', label: 'Publié' },
  ] as const;
  protected readonly currentCoverAlt = computed(
    () => `Couverture actuelle de ${this.value().title}`,
  );
  // Sortie déjà assainie par `parseMarkdown` ; un `pre` qui défile doit être focalisable.
  protected readonly contentPreview = computed(
    (): SafeHtml =>
      this.sanitizer.bypassSecurityTrustHtml(
        parseMarkdown(this.value().contentMarkdown, { topHeadingLevel: 2 }).replaceAll(
          '<pre>',
          '<pre tabindex="0">',
        ),
      ),
  );

  readonly form = form(
    this.value,
    (path) => {
      required(path.title, { message: REQUIRED });
      required(path.excerpt, { message: REQUIRED });
      required(path.contentMarkdown, { message: REQUIRED });
    },
    {
      submission: {
        action: async () => {
          this.submitted.emit(toPostInput(this.value(), this.tags()));
        },
      },
    },
  );

  protected selectCover(file: File): void {
    if (file.type.startsWith('image/')) this.coverSelected.emit(file);
  }
}
