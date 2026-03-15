import {
  Component,
  DestroyRef,
  inject,
  signal,
  effect,
  ChangeDetectionStrategy,
} from '@angular/core';
import { takeUntilDestroyed, rxResource } from '@angular/core/rxjs-interop';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { HOME_GATEWAY } from '@features/home/application';
import { ToastService } from '@shared/toast';

@Component({
  selector: 'app-admin-hero',
  imports: [ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  template: `
    <h1 class="text-2xl font-bold text-foreground mb-8">Hero</h1>

    <form [formGroup]="form" (ngSubmit)="onSubmit()" class="max-w-2xl space-y-6">
      <fieldset class="space-y-6 border-0 p-0 m-0">
        <legend class="sr-only">Informations du hero</legend>

        <div>
          <label for="name" class="block text-sm font-medium text-foreground mb-1.5">Nom</label>
          <input
            id="name"
            type="text"
            formControlName="name"
            class="w-full px-4 py-2.5 rounded-lg bg-foreground/5 border border-foreground/20 text-foreground placeholder-muted focus:border-primary focus:outline-none transition-colors"
          />
          @if (form.controls.name.touched && form.controls.name.errors?.['required']) {
            <span class="text-red-400 text-xs mt-1 block">Ce champ est obligatoire</span>
          }
        </div>

        <div>
          <label for="tagline" class="block text-sm font-medium text-foreground mb-1.5"
            >Tagline</label
          >
          <input
            id="tagline"
            type="text"
            formControlName="tagline"
            class="w-full px-4 py-2.5 rounded-lg bg-foreground/5 border border-foreground/20 text-foreground placeholder-muted focus:border-primary focus:outline-none transition-colors"
          />
          @if (form.controls.tagline.touched && form.controls.tagline.errors?.['required']) {
            <span class="text-red-400 text-xs mt-1 block">Ce champ est obligatoire</span>
          }
        </div>

        <div>
          <label for="availability" class="block text-sm font-medium text-foreground mb-1.5"
            >Disponibilité</label
          >
          <input
            id="availability"
            type="text"
            formControlName="availability"
            class="w-full px-4 py-2.5 rounded-lg bg-foreground/5 border border-foreground/20 text-foreground placeholder-muted focus:border-primary focus:outline-none transition-colors"
          />
          @if (
            form.controls.availability.touched && form.controls.availability.errors?.['required']
          ) {
            <span class="text-red-400 text-xs mt-1 block">Ce champ est obligatoire</span>
          }
        </div>
      </fieldset>

      <div class="flex gap-4 pt-4">
        <button
          type="submit"
          [disabled]="form.invalid"
          class="px-6 py-2.5 rounded-lg bg-primary text-white font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Enregistrer
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
export class AdminHero {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly homeGateway = inject(HOME_GATEWAY);
  private readonly toast = inject(ToastService);
  private readonly destroyRef = inject(DestroyRef);

  private heroId = '';

  readonly form = this.fb.nonNullable.group({
    name: ['', Validators.required],
    tagline: ['', Validators.required],
    availability: ['', Validators.required],
  });

  readonly loading = signal(true);

  private readonly editData = rxResource({
    stream: () => this.homeGateway.getHeroDataForEdit(),
  });

  private readonly patchForm = effect(() => {
    const hero = this.editData.value();
    if (hero) {
      this.heroId = hero.id;
      this.form.patchValue({
        name: hero.name,
        tagline: hero.tagline,
        availability: hero.availability,
      });
      this.loading.set(false);
    }
    if (this.editData.error()) {
      this.loading.set(false);
    }
  });

  onSubmit(): void {
    if (this.form.invalid) return;
    const values = this.form.getRawValue();
    this.homeGateway
      .updateHeroData({ id: this.heroId, ...values })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.toast.success('Hero mis à jour');
          this.router.navigate(['/admin/home']);
        },
        error: () => this.toast.error("Erreur lors de l'enregistrement"),
      });
  }

  cancel(): void {
    this.router.navigate(['/admin/home']);
  }
}
