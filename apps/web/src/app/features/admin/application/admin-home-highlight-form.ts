import {
  Component,
  DestroyRef,
  inject,
  input,
  computed,
  effect,
  ChangeDetectionStrategy,
} from '@angular/core';
import { takeUntilDestroyed, rxResource } from '@angular/core/rxjs-interop';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { HOME_GATEWAY } from '@features/home/application';
import { ToastService } from '@shared/toast';

@Component({
  selector: 'app-admin-home-highlight-form',
  imports: [ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  template: `
    <h1 class="text-2xl font-bold text-foreground mb-8">
      {{ isEditMode() ? 'Modifier le point fort' : 'Nouveau point fort' }}
    </h1>

    <form [formGroup]="form" (ngSubmit)="onSubmit()" class="max-w-2xl space-y-6">
      <fieldset class="space-y-6 border-0 p-0 m-0">
        <legend class="sr-only">Informations de la mise en avant</legend>

        <div>
          <label for="title" class="block text-sm font-medium text-foreground mb-1.5">Titre</label>
          <input
            id="title"
            type="text"
            formControlName="title"
            class="w-full px-4 py-2.5 rounded-lg bg-foreground/5 border border-foreground/20 text-foreground placeholder-muted focus:border-primary focus:outline-none transition-colors"
          />
          @if (form.controls.title.touched && form.controls.title.errors?.['required']) {
            <span class="text-red-400 text-xs mt-1 block">Ce champ est obligatoire</span>
          }
        </div>

        <div>
          <label for="description" class="block text-sm font-medium text-foreground mb-1.5"
            >Description</label
          >
          <textarea
            id="description"
            formControlName="description"
            rows="4"
            class="w-full px-4 py-2.5 rounded-lg bg-foreground/5 border border-foreground/20 text-foreground placeholder-muted focus:border-primary focus:outline-none transition-colors resize-y"
          ></textarea>
          @if (
            form.controls.description.touched && form.controls.description.errors?.['required']
          ) {
            <span class="text-red-400 text-xs mt-1 block">Ce champ est obligatoire</span>
          }
        </div>

        <div>
          <label for="icon" class="block text-sm font-medium text-foreground mb-1.5">Icône</label>
          <input
            id="icon"
            type="text"
            formControlName="icon"
            class="w-full px-4 py-2.5 rounded-lg bg-foreground/5 border border-foreground/20 text-foreground placeholder-muted focus:border-primary focus:outline-none transition-colors"
          />
          @if (form.controls.icon.touched && form.controls.icon.errors?.['required']) {
            <span class="text-red-400 text-xs mt-1 block">Ce champ est obligatoire</span>
          }
        </div>

        <div>
          <label for="order" class="block text-sm font-medium text-foreground mb-1.5">Ordre</label>
          <input
            id="order"
            type="number"
            formControlName="order"
            class="w-full px-4 py-2.5 rounded-lg bg-foreground/5 border border-foreground/20 text-foreground placeholder-muted focus:border-primary focus:outline-none transition-colors"
          />
        </div>
      </fieldset>

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
export class AdminHomeHighlightForm {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly homeGateway = inject(HOME_GATEWAY);
  private readonly toast = inject(ToastService);
  private readonly destroyRef = inject(DestroyRef);

  readonly id = input<string>();
  readonly isEditMode = computed(() => !!this.id());

  readonly form = this.fb.nonNullable.group({
    title: ['', Validators.required],
    description: ['', Validators.required],
    icon: ['', Validators.required],
    order: [0],
  });

  private readonly editData = rxResource({
    params: () => (this.id() ? { id: this.id()! } : undefined),
    stream: ({ params }) => this.homeGateway.getHomeHighlightById(params.id),
  });

  private readonly patchForm = effect(() => {
    const highlight = this.editData.value();
    if (highlight) {
      this.form.patchValue(highlight);
    }
  });

  onSubmit(): void {
    if (this.form.invalid) return;
    const values = this.form.getRawValue();
    const id = this.id();

    const request$ = id
      ? this.homeGateway.updateHomeHighlight(id, values)
      : this.homeGateway.createHomeHighlight(values);

    request$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.toast.success(id ? 'Mise en avant mise à jour' : 'Mise en avant créée');
        this.router.navigate(['/admin/home/highlights']);
      },
      error: () => this.toast.error("Erreur lors de l'enregistrement"),
    });
  }

  cancel(): void {
    this.router.navigate(['/admin/home/highlights']);
  }
}
