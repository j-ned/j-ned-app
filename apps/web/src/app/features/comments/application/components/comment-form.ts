import {
  Component,
  ElementRef,
  afterNextRender,
  computed,
  effect,
  input,
  output,
  signal,
  untracked,
  viewChild,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  FormField,
  FormRoot,
  form,
  maxLength,
  pattern,
  required,
  validate,
  type PathKind,
  type SchemaPath,
  type SchemaPathRules,
} from '@angular/forms/signals';
import { EMAIL_PATTERN } from '@shared/forms/email-pattern';
import { focusFirstInvalid } from '@shared/forms/focus-first-invalid';
import { Button } from '@shared/ui/button';
import { FieldError } from '@shared/ui/field-error';
import { COMMENT_LIMITS, characterCount, hasVisibleCharacter } from '../../domain/comment-text';
import type { CommentDraft } from '../../domain/models/comment.model';
import { COMMENT_FORM_COPY } from '../comment-copy';

const EMPTY_DRAFT: CommentDraft = { name: '', email: '', body: '', website: '' };

type TextRule = {
  readonly min: number;
  readonly max: number;
  readonly lengthMessage: string;
  readonly invisibleMessage: string;
};

// Mêmes refus que l'API, comptés comme elle : un envoi valide ici n'est pas refusé là-bas pour ça.
function textWithinApiRules<TPathKind extends PathKind>(
  path: SchemaPath<string, SchemaPathRules.Supported, TPathKind>,
  rule: TextRule,
): void {
  validate(path, ({ value }) => {
    const text = value();
    if (text === '') return null;
    const count = characterCount(text);
    if (count < rule.min || count > rule.max) {
      return { kind: 'length', message: rule.lengthMessage };
    }
    return hasVisibleCharacter(text) ? null : { kind: 'invisible', message: rule.invisibleMessage };
  });
}

@Component({
  selector: 'app-comment-form',
  imports: [FormRoot, FormField, Button, FieldError, RouterLink],
  host: { class: 'block' },
  template: `
    @let id = ids();
    <form [formRoot]="commentForm" (keydown.escape)="cancel()">
      <fieldset class="m-0 grid gap-5 border-0 p-0">
        <legend class="mb-1 text-lg font-semibold tracking-tight">{{ legend() }}</legend>
        <div class="grid gap-5 sm:grid-cols-2">
          <div>
            @let nameInError = commentForm.name().touched() && commentForm.name().invalid();
            <label [for]="id.name" class="form-label"
              >Nom ou pseudo <span class="font-normal text-muted">(requis)</span></label
            >
            <input
              #nameInput
              [id]="id.name"
              type="text"
              data-testid="comment-name"
              [formField]="commentForm.name"
              aria-required="true"
              autocomplete="nickname"
              [attr.aria-invalid]="nameInError"
              [attr.aria-describedby]="nameInError ? id.nameError : null"
              class="form-input"
            />
            <app-field-error [field]="commentForm.name" [errorId]="id.nameError" />
          </div>
          <div>
            @let emailInError = commentForm.email().touched() && commentForm.email().invalid();
            <label [for]="id.email" class="form-label"
              >E-mail <span class="font-normal text-muted">(requis, jamais publié)</span></label
            >
            <input
              [id]="id.email"
              type="email"
              data-testid="comment-email"
              [formField]="commentForm.email"
              aria-required="true"
              autocomplete="email"
              [attr.aria-invalid]="emailInError"
              [attr.aria-describedby]="emailInError ? id.emailError : null"
              class="form-input"
            />
            <app-field-error [field]="commentForm.email" [errorId]="id.emailError" />
          </div>
        </div>
        <div>
          @let bodyInError = commentForm.body().touched() && commentForm.body().invalid();
          <label [for]="id.body" class="form-label"
            >Message <span class="font-normal text-muted">(requis)</span></label
          >
          <textarea
            [id]="id.body"
            data-testid="comment-body"
            [formField]="commentForm.body"
            aria-required="true"
            rows="5"
            [attr.aria-invalid]="bodyInError"
            [attr.aria-describedby]="bodyInError ? id.bodyError : null"
            class="form-textarea"
          ></textarea>
          <app-field-error [field]="commentForm.body" [errorId]="id.bodyError" />
        </div>
        <!-- Champ piège : hors écran, hors tabulation et hors arbre d'accessibilité ; un robot le remplit. -->
        <div class="sr-only" aria-hidden="true">
          <label [for]="id.website">Ne pas remplir</label>
          <input
            [id]="id.website"
            type="text"
            data-testid="comment-website"
            [formField]="commentForm.website"
            tabindex="-1"
            autocomplete="off"
          />
        </div>
        <div class="flex flex-wrap items-center justify-between gap-x-5 gap-y-3">
          <p class="max-w-[46ch] text-[0.8125rem] text-muted" data-testid="comment-privacy-note">
            {{ copy.privacyNote }}
            <a routerLink="/confidentialite" class="underline underline-offset-3 hover:text-primary"
              >Politique de confidentialité</a
            >
          </p>
          <div class="flex flex-wrap items-center gap-2">
            <button appButton type="submit" data-testid="comment-submit" [disabled]="sending()">
              {{ sending() ? copy.sending : copy.send }}
            </button>
            @if (cancellable()) {
              <button
                appButton
                variant="outlined"
                type="button"
                data-testid="comment-cancel"
                (click)="cancelled.emit()"
              >
                Annuler
              </button>
            }
          </div>
        </div>
      </fieldset>
    </form>
  `,
})
export class CommentForm {
  readonly idPrefix = input.required<string>();
  readonly legend = input.required<string>();
  readonly sending = input(false);
  readonly resetToken = input(0);
  readonly submitted = output<CommentDraft>();
  readonly cancellable = input(false);
  readonly focusOnOpen = input(false);
  readonly cancelled = output<void>();

  private readonly _nameInput = viewChild.required('nameInput', {
    read: ElementRef<HTMLInputElement>,
  });

  protected readonly copy = COMMENT_FORM_COPY;

  protected readonly ids = computed(() => {
    const prefix = this.idPrefix();
    return {
      name: `${prefix}-name`,
      nameError: `${prefix}-name-error`,
      email: `${prefix}-email`,
      emailError: `${prefix}-email-error`,
      body: `${prefix}-body`,
      bodyError: `${prefix}-body-error`,
      website: `${prefix}-website`,
    };
  });

  private readonly _model = signal<CommentDraft>(EMPTY_DRAFT);

  protected readonly commentForm = form(
    this._model,
    (path) => {
      required(path.name, { message: COMMENT_FORM_COPY.nameRequired });
      textWithinApiRules(path.name, {
        min: COMMENT_LIMITS.nameMin,
        max: COMMENT_LIMITS.nameMax,
        lengthMessage: COMMENT_FORM_COPY.nameLength,
        invisibleMessage: COMMENT_FORM_COPY.nameInvisible,
      });
      required(path.email, { message: COMMENT_FORM_COPY.emailRequired });
      pattern(path.email, EMAIL_PATTERN, { message: COMMENT_FORM_COPY.emailInvalid });
      maxLength(path.email, COMMENT_LIMITS.emailMax, { message: COMMENT_FORM_COPY.emailInvalid });
      required(path.body, { message: COMMENT_FORM_COPY.bodyRequired });
      textWithinApiRules(path.body, {
        min: COMMENT_LIMITS.bodyMin,
        max: COMMENT_LIMITS.bodyMax,
        lengthMessage: COMMENT_FORM_COPY.bodyLength,
        invisibleMessage: COMMENT_FORM_COPY.bodyInvisible,
      });
    },
    {
      submission: {
        action: async (field) => {
          const { name, email, body, website } = field().value();
          this.submitted.emit({ name, email, body, website });
        },
        onInvalid: (field) => focusFirstInvalid(field),
      },
    },
  );

  private readonly resetEffect = effect(() => {
    this.resetToken();
    untracked(() => this.commentForm().reset(EMPTY_DRAFT));
  });

  constructor() {
    afterNextRender({
      write: () => {
        if (this.focusOnOpen()) this._nameInput().nativeElement.focus();
      },
    });
  }

  // Échap ne ferme qu'un formulaire de réponse : le formulaire principal reste en place.
  protected cancel(): void {
    if (this.cancellable()) this.cancelled.emit();
  }
}
