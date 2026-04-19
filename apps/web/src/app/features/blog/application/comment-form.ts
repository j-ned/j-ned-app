import {
  Component,
  DestroyRef,
  inject,
  input,
  output,
  signal,
  ChangeDetectionStrategy,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { BLOG_GATEWAY } from './tokens';
import { ToastService } from '@shared/ui';
import { Button } from 'primeng/button';
import { InputText } from 'primeng/inputtext';
import { Textarea } from 'primeng/textarea';
import { Message } from 'primeng/message';

@Component({
  selector: 'app-comment-form',
  imports: [ReactiveFormsModule, Button, InputText, Textarea, Message],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  template: `
    @if (submitted()) {
      <div class="p-4 rounded-lg bg-green-500/10 border border-green-500/30 text-green-400 text-sm">
        Merci ! Votre commentaire sera visible après modération.
      </div>
    } @else {
      <form [formGroup]="form" (ngSubmit)="onSubmit()" class="space-y-4">
        <h3 class="text-lg font-semibold text-foreground">Laisser un commentaire</h3>

        <fieldset class="grid grid-cols-1 sm:grid-cols-2 gap-4 border-0 p-0 m-0">
          <legend class="sr-only">Informations personnelles</legend>
          <div class="flex flex-col gap-1.5">
            <label for="comment-author" class="text-sm font-medium text-foreground">Nom *</label>
            <input
              id="comment-author"
              pInputText
              type="text"
              formControlName="author"
              placeholder="Votre nom"
              fluid
            />
            @if (form.controls.author.touched && form.controls.author.errors?.['required']) {
              <p-message
                severity="error"
                text="Ce champ est obligatoire"
                size="small"
                variant="simple"
              />
            }
          </div>
          <div class="flex flex-col gap-1.5">
            <label for="comment-email" class="text-sm font-medium text-foreground">Email</label>
            <input
              id="comment-email"
              pInputText
              type="email"
              formControlName="email"
              placeholder="Optionnel"
              fluid
            />
          </div>
        </fieldset>

        <fieldset class="border-0 p-0 m-0">
          <legend class="block text-sm font-medium text-foreground mb-1">Note</legend>
          <div class="flex gap-1">
            @for (star of stars; track star) {
              <button
                type="button"
                (click)="setRating(star)"
                class="p-0.5 transition-colors"
                [attr.aria-label]="star + ' étoile' + (star > 1 ? 's' : '')"
              >
                <i
                  class="pi pi-star text-2xl"
                  [class]="star <= rating() ? 'text-yellow-400' : 'text-muted'"
                  aria-hidden="true"
                ></i>
              </button>
            }
            @if (rating() > 0) {
              <button
                type="button"
                (click)="setRating(0)"
                class="ml-2 text-xs text-muted hover:text-foreground transition-colors"
              >
                Effacer
              </button>
            }
          </div>
        </fieldset>

        <div class="flex flex-col gap-1.5">
          <label for="comment-content" class="text-sm font-medium text-foreground">
            Commentaire *
          </label>
          <textarea
            id="comment-content"
            pTextarea
            formControlName="content"
            rows="4"
            placeholder="Votre commentaire..."
          ></textarea>
          @if (form.controls.content.touched && form.controls.content.errors?.['required']) {
            <p-message
              severity="error"
              text="Ce champ est obligatoire"
              size="small"
              variant="simple"
            />
          }
        </div>

        <p-button
          type="submit"
          [label]="submitting() ? 'Envoi...' : 'Envoyer'"
          [disabled]="form.invalid"
          [loading]="submitting()"
          icon="pi pi-send"
          iconPos="right"
        />
      </form>
    }
  `,
})
export class CommentForm {
  private readonly fb = inject(FormBuilder);
  private readonly blogGateway = inject(BLOG_GATEWAY);
  private readonly toast = inject(ToastService);
  private readonly destroyRef = inject(DestroyRef);

  readonly articleId = input.required<string>();
  readonly commentAdded = output<void>();

  readonly rating = signal(0);
  readonly submitting = signal(false);
  readonly submitted = signal(false);
  readonly stars = [1, 2, 3, 4, 5];

  readonly form = this.fb.nonNullable.group({
    author: ['', Validators.required],
    email: [''],
    content: ['', Validators.required],
  });

  setRating(value: number): void {
    this.rating.set(value);
  }

  onSubmit(): void {
    if (this.form.invalid) return;

    this.submitting.set(true);
    const values = this.form.getRawValue();

    this.blogGateway
      .createComment({
        idArticle: this.articleId(),
        author: values.author,
        email: values.email,
        content: values.content,
        date: new Date().toISOString().split('T')[0],
        rating: this.rating(),
        status: 'pending',
        featured: false,
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.submitted.set(true);
          this.commentAdded.emit();
          this.toast.add({
            severity: 'success',
            summary: 'Succès',
            detail: 'Commentaire envoyé ! Il sera visible après modération.',
          });
        },
        error: () => {
          this.submitting.set(false);
          this.toast.add({
            severity: 'error',
            summary: 'Erreur',
            detail: "Erreur lors de l'envoi du commentaire.",
          });
        },
      });
  }
}
