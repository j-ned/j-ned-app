import { Component, DestroyRef, inject, effect, ChangeDetectionStrategy } from '@angular/core';
import { takeUntilDestroyed, rxResource } from '@angular/core/rxjs-interop';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { HOME_GATEWAY } from '@features/home/application';
import { ToastService } from '@shared/ui';
import { Button } from 'primeng/button';
import { InputText } from 'primeng/inputtext';
import { Message } from 'primeng/message';

@Component({
  selector: 'app-admin-hero',
  imports: [ReactiveFormsModule, Button, InputText, Message],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  template: `
    <h1 class="text-2xl font-bold text-foreground mb-8">Hero</h1>

    <form [formGroup]="form" (ngSubmit)="onSubmit()" class="max-w-2xl space-y-6">
      <fieldset class="space-y-6 border-0 p-0 m-0">
        <legend class="sr-only">Informations du hero</legend>

        <div>
          <label for="name" class="text-sm font-medium text-foreground">Nom</label>
          <input id="name" type="text" formControlName="name" pInputText fluid />
          @if (form.controls.name.touched && form.controls.name.errors?.['required']) {
            <p-message
              severity="error"
              text="Ce champ est obligatoire"
              size="small"
              variant="simple"
            />
          }
        </div>

        <div>
          <label for="tagline" class="text-sm font-medium text-foreground">Tagline</label>
          <input id="tagline" type="text" formControlName="tagline" pInputText fluid />
          @if (form.controls.tagline.touched && form.controls.tagline.errors?.['required']) {
            <p-message
              severity="error"
              text="Ce champ est obligatoire"
              size="small"
              variant="simple"
            />
          }
        </div>

        <div>
          <label for="availability" class="text-sm font-medium text-foreground"
            >Disponibilité</label
          >
          <input id="availability" type="text" formControlName="availability" pInputText fluid />
          @if (
            form.controls.availability.touched && form.controls.availability.errors?.['required']
          ) {
            <p-message
              severity="error"
              text="Ce champ est obligatoire"
              size="small"
              variant="simple"
            />
          }
        </div>
      </fieldset>

      <div class="flex gap-4 pt-4">
        <p-button type="submit" label="Enregistrer" [disabled]="form.invalid" />
        <p-button
          type="button"
          label="Annuler"
          severity="secondary"
          [outlined]="true"
          (onClick)="cancel()"
        />
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

  private readonly editData = rxResource({
    stream: () => this.homeGateway.getHeroDataForEdit(),
  });

  private readonly _patchForm = effect(() => {
    const hero = this.editData.value();
    if (hero) {
      this.heroId = hero.id;
      this.form.patchValue({
        name: hero.name,
        tagline: hero.tagline,
        availability: hero.availability,
      });
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
          this.homeGateway.invalidateBundle();
          this.toast.add({ severity: 'success', summary: 'Succès', detail: 'Hero mis à jour' });
          this.router.navigate(['/admin/content']);
        },
        error: () =>
          this.toast.add({
            severity: 'error',
            summary: 'Erreur',
            detail: "Erreur lors de l'enregistrement",
          }),
      });
  }

  cancel(): void {
    this.router.navigate(['/admin/content']);
  }
}
