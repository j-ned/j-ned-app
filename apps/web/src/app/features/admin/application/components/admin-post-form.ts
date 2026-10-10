import { Component, computed, input, model, output } from '@angular/core';
import { NgOptimizedImage } from '@angular/common';
import { FormField, FormRoot, form, required } from '@angular/forms/signals';
import type { BlogPostInput } from '@features/blog/domain/models/blog-post.model';
import { AVAILABLE_BLOG_TAGS } from '@features/blog/domain/models/blog-tag.model';
import { CODE_LANGUAGES } from '@features/blog/domain/code-language';
import { BlogArticleBody } from '@features/blog/application/components/blog-article-body';
import { CodeCopy } from '@features/blog/application/components/code-copy';
import { FieldError } from '@shared/ui/field-error';
import { FileDropzone } from '@shared/ui/file-dropzone';
import { focusFirstInvalid } from '@shared/forms/focus-first-invalid';
import { AdminTagsSelector } from './admin-tags-selector';
import { AdminFormSection } from './admin-form-section';
import { AdminMarkdownToolbar } from './admin-markdown-toolbar';
import { MarkdownEditor } from './markdown-editor';
import { RequiredMark } from './required-mark';
import { REQUIRED_MESSAGE } from './required-message';
import { toPostInput, type PostDraft } from '../post-draft';

@Component({
  selector: 'app-admin-post-form',
  imports: [
    FormRoot,
    FormField,
    NgOptimizedImage,
    FileDropzone,
    AdminTagsSelector,
    AdminFormSection,
    BlogArticleBody,
    CodeCopy,
    AdminMarkdownToolbar,
    MarkdownEditor,
    FieldError,
    RequiredMark,
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
            @let titleInError = form.title().touched() && form.title().invalid();
            <label for="post-title" class="field-label">Titre <app-required-mark /></label>
            <input
              id="post-title"
              type="text"
              data-testid="admin-post-title"
              [formField]="form.title"
              [attr.aria-invalid]="titleInError"
              [attr.aria-describedby]="titleInError ? 'post-title-error' : null"
              class="form-input"
            />
            <app-field-error
              [field]="form.title"
              errorId="post-title-error"
              testId="admin-post-title-error"
            />
          </div>
          <div>
            @let excerptInError = form.excerpt().touched() && form.excerpt().invalid();
            <label for="post-excerpt" class="field-label">Extrait <app-required-mark /></label>
            <textarea
              id="post-excerpt"
              data-testid="admin-post-excerpt"
              [formField]="form.excerpt"
              [attr.aria-invalid]="excerptInError"
              [attr.aria-describedby]="excerptInError ? 'post-excerpt-error' : null"
              rows="2"
              class="form-textarea min-h-0"
            ></textarea>
            <app-field-error
              [field]="form.excerpt"
              errorId="post-excerpt-error"
              testId="admin-post-excerpt-error"
            />
          </div>
          <app-admin-tags-selector
            data-testid="admin-post-tags"
            [availableTags]="availableTags"
            [formField]="form.tags"
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
            @let contentInError =
              form.contentMarkdown().touched() && form.contentMarkdown().invalid();
            <label for="post-content-markdown" class="field-label">
              Contenu (Markdown) <app-required-mark />
            </label>
            <app-admin-markdown-toolbar [editor]="markdownEditor" />
            <textarea
              id="post-content-markdown"
              data-testid="admin-post-content"
              [formField]="form.contentMarkdown"
              appMarkdownEditor
              #markdownEditor="markdownEditor"
              [attr.aria-invalid]="contentInError"
              [attr.aria-describedby]="
                contentInError ? 'post-content-hint post-content-error' : 'post-content-hint'
              "
              rows="20"
              class="form-textarea font-mono text-sm"
            ></textarea>
            <p id="post-content-hint" data-testid="admin-post-content-hint" class="field-hint">
              <span>
                Langage d'un bloc de code, après les trois accents graves&nbsp;:
                @for (language of codeLanguages; track language; let last = $last) {
                  <code class="font-mono">{{ language }}</code
                  >{{ last ? '.' : ', ' }}
                }
              </span>
            </p>
            <app-field-error
              [field]="form.contentMarkdown"
              errorId="post-content-error"
              testId="admin-post-content-error"
            />
          </div>
          <div>
            <p id="post-content-preview-label" class="field-label">Rendu</p>
            <div
              data-testid="admin-post-content-preview"
              role="group"
              aria-labelledby="post-content-preview-label"
              class="max-h-[32rem] overflow-y-auto rounded-sm border border-line p-4"
              appCodeCopy
              #codeCopy="appCodeCopy"
            >
              <app-blog-article-body [markdown]="value().contentMarkdown" [topHeadingLevel]="2" />
            </div>
            <p role="status" data-testid="code-copy-status" class="sr-only">
              {{ codeCopy.status() }}
            </p>
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
            [resetToken]="coverResetToken()"
            (fileSelected)="selectCover($event)"
            (cleared)="coverCleared.emit()"
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
            Un article publié est visible sur le site au plus une seconde après l'enregistrement, au
            rechargement de la page.
          </p>
        }
      </fieldset>
    </form>
  `,
})
export class AdminPostForm {
  readonly value = model.required<PostDraft>();
  readonly persistedCover = input('');
  readonly coverResetToken = input<number>();
  readonly submitted = output<BlogPostInput>();
  readonly coverSelected = output<File>();
  readonly coverCleared = output<void>();
  readonly coverRejected = output<void>();

  protected readonly availableTags = AVAILABLE_BLOG_TAGS;
  protected readonly codeLanguages = CODE_LANGUAGES.map(({ aliases }) => aliases[0]);
  protected readonly statuses = [
    { value: 'draft', label: 'Brouillon' },
    { value: 'published', label: 'Publié' },
  ] as const;
  protected readonly currentCoverAlt = computed(
    () => `Couverture actuelle de ${this.value().title}`,
  );

  readonly form = form(
    this.value,
    (path) => {
      required(path.title, { message: REQUIRED_MESSAGE });
      required(path.excerpt, { message: REQUIRED_MESSAGE });
      required(path.contentMarkdown, { message: REQUIRED_MESSAGE });
    },
    {
      submission: {
        action: async () => {
          this.submitted.emit(toPostInput(this.value()));
        },
        onInvalid: (field) => focusFirstInvalid(field),
      },
    },
  );

  protected selectCover(file: File): void {
    if (file.type.startsWith('image/')) this.coverSelected.emit(file);
    else this.coverRejected.emit();
  }
}
