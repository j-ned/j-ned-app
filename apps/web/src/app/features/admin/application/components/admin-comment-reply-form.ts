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
import { FormField, FormRoot, form, required, validate } from '@angular/forms/signals';
import { focusFirstInvalid } from '@shared/forms/focus-first-invalid';
import { Button } from '@shared/ui/button';
import { FieldError } from '@shared/ui/field-error';

// Bornes de l'API, comptées comme elle en caractères après `trim()`.
const BODY_MIN_LENGTH = 2;
const BODY_MAX_LENGTH = 2000;

const characterCount = (text: string): number => Array.from(text.trim()).length;

@Component({
  selector: 'app-admin-comment-reply-form',
  imports: [FormRoot, FormField, Button, FieldError],
  host: { class: 'block' },
  template: `
    <form
      [id]="formId()"
      [formRoot]="replyForm"
      class="mt-3 max-w-[70ch]"
      (keydown.escape)="cancelled.emit()"
    >
      <fieldset class="m-0 grid gap-3 border-0 p-0">
        <legend data-testid="reply-legend" class="form-label">{{ legend() }}</legend>
        @let bodyInError = replyForm.body().touched() && replyForm.body().invalid();
        <label [for]="bodyId()" class="sr-only">Ta réponse</label>
        <textarea
          #body
          data-testid="reply-body"
          [id]="bodyId()"
          [formField]="replyForm.body"
          aria-required="true"
          rows="4"
          [attr.aria-invalid]="bodyInError"
          [attr.aria-describedby]="bodyInError ? errorId() : null"
          class="form-textarea"
        ></textarea>
        <app-field-error [field]="replyForm.body" [errorId]="errorId()" testId="reply-body-error" />
        <div class="flex flex-wrap items-center gap-2">
          <button appButton type="submit" data-testid="reply-submit" [disabled]="sending()">
            {{ sending() ? 'Publication…' : 'Publier la réponse' }}
          </button>
          <button
            appButton
            type="button"
            variant="outlined"
            data-testid="reply-cancel"
            (click)="cancelled.emit()"
          >
            Annuler
          </button>
        </div>
      </fieldset>
    </form>
  `,
})
export class AdminCommentReplyForm {
  readonly formId = input.required<string>();
  readonly legend = input.required<string>();
  readonly sending = input(false);
  readonly resetToken = input(0);
  readonly submitted = output<string>();
  readonly cancelled = output<void>();

  private readonly _body = viewChild.required<ElementRef<HTMLTextAreaElement>>('body');

  protected readonly bodyId = computed(() => `${this.formId()}-body`);
  protected readonly errorId = computed(() => `${this.formId()}-body-error`);

  private readonly _model = signal({ body: '' });

  protected readonly replyForm = form(
    this._model,
    (path) => {
      required(path.body, { message: 'Ta réponse est obligatoire' });
      validate(path.body, ({ value }) => {
        if (value() === '') return null;
        const count = characterCount(value());
        if (count < BODY_MIN_LENGTH) {
          return {
            kind: 'minLength',
            message: 'Ta réponse doit contenir au moins 2\u00a0caractères',
          };
        }
        return count > BODY_MAX_LENGTH
          ? {
              kind: 'maxLength',
              message: 'Ta réponse ne doit pas dépasser 2\u202f000\u00a0caractères',
            }
          : null;
      });
    },
    {
      submission: {
        action: async (field) => this.submitted.emit(field().value().body),
        onInvalid: (field) => focusFirstInvalid(field),
      },
    },
  );

  private readonly resetEffect = effect(() => {
    this.resetToken();
    untracked(() => this.replyForm().reset({ body: '' }));
  });

  constructor() {
    afterNextRender({ write: () => this._body().nativeElement.focus() });
  }
}
