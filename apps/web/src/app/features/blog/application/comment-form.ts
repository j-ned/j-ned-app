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
import { ToastService } from '@shared/toast';

@Component({
  selector: 'app-comment-form',
  imports: [ReactiveFormsModule],
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
          <div>
            <label for="comment-author" class="block text-sm font-medium text-foreground mb-1"
              >Nom *</label
            >
            <input
              id="comment-author"
              type="text"
              formControlName="author"
              class="w-full px-4 py-2.5 rounded-lg bg-foreground/5 border border-foreground/20 text-foreground placeholder-muted focus:border-primary focus:outline-none transition-colors"
              placeholder="Votre nom"
            />
            @if (form.controls.author.touched && form.controls.author.errors?.['required']) {
              <span class="text-red-400 text-xs mt-1 block">Ce champ est obligatoire</span>
            }
          </div>
          <div>
            <label for="comment-email" class="block text-sm font-medium text-foreground mb-1"
              >Email</label
            >
            <input
              id="comment-email"
              type="email"
              formControlName="email"
              class="w-full px-4 py-2.5 rounded-lg bg-foreground/5 border border-foreground/20 text-foreground placeholder-muted focus:border-primary focus:outline-none transition-colors"
              placeholder="Optionnel"
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
                <svg class="w-6 h-6" aria-hidden="true">
                  @if (star <= rating()) {
                    <use href="/icons/sprite.svg#lucide-star" class="text-yellow-400" />
                  } @else {
                    <use href="/icons/sprite.svg#lucide-star" class="text-muted" />
                  }
                </svg>
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

        <div>
          <label for="comment-content" class="block text-sm font-medium text-foreground mb-1"
            >Commentaire *</label
          >
          <textarea
            id="comment-content"
            formControlName="content"
            rows="4"
            class="w-full px-4 py-2.5 rounded-lg bg-foreground/5 border border-foreground/20 text-foreground placeholder-muted focus:border-primary focus:outline-none transition-colors resize-y"
            placeholder="Votre commentaire..."
          ></textarea>
          @if (form.controls.content.touched && form.controls.content.errors?.['required']) {
            <span class="text-red-400 text-xs mt-1 block">Ce champ est obligatoire</span>
          }
        </div>

        <button
          type="submit"
          [disabled]="form.invalid || submitting()"
          class="px-6 py-2.5 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {{ submitting() ? 'Envoi...' : 'Envoyer' }}
        </button>
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
          this.toast.success('Commentaire envoyé ! Il sera visible après modération.');
        },
        error: () => {
          this.submitting.set(false);
          this.toast.error("Erreur lors de l'envoi du commentaire.");
        },
      });
  }
}
