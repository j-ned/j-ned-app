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
import { PROFILE_GATEWAY } from '@features/profile/application';
import { MessageService } from 'primeng/api';
import { Button } from 'primeng/button';
import { InputText } from 'primeng/inputtext';
import { Message } from 'primeng/message';

@Component({
  selector: 'app-admin-social-button-form',
  imports: [ReactiveFormsModule, Button, InputText, Message],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  template: `
    <h1 class="text-2xl font-bold text-foreground mb-8">
      {{ isEditMode() ? 'Modifier le bouton social' : 'Nouveau bouton social' }}
    </h1>

    <form [formGroup]="form" (ngSubmit)="onSubmit()" class="max-w-2xl space-y-6">
      <fieldset class="space-y-6 border-0 p-0 m-0">
        <legend class="sr-only">Informations du réseau social</legend>

        <div>
          <label for="icon" class="text-sm font-medium text-foreground">Icône</label>
          <input id="icon" type="text" formControlName="icon" pInputText fluid />
          @if (form.controls.icon.touched && form.controls.icon.errors?.['required']) {
            <p-message
              severity="error"
              text="Ce champ est obligatoire"
              size="small"
              variant="simple"
            />
          }
        </div>

        <div>
          <label for="label" class="text-sm font-medium text-foreground">Label</label>
          <input id="label" type="text" formControlName="label" pInputText fluid />
          @if (form.controls.label.touched && form.controls.label.errors?.['required']) {
            <p-message
              severity="error"
              text="Ce champ est obligatoire"
              size="small"
              variant="simple"
            />
          }
        </div>

        <div>
          <label for="href" class="text-sm font-medium text-foreground">Lien</label>
          <input id="href" type="text" formControlName="href" pInputText fluid />
          @if (form.controls.href.touched && form.controls.href.errors?.['required']) {
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
        <p-button
          type="submit"
          [label]="isEditMode() ? 'Enregistrer' : 'Créer'"
          [disabled]="form.invalid"
        />
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
export class AdminSocialButtonForm {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly profileGateway = inject(PROFILE_GATEWAY);
  private readonly toast = inject(MessageService);
  private readonly destroyRef = inject(DestroyRef);

  readonly id = input<string>();
  readonly isEditMode = computed(() => !!this.id());

  readonly form = this.fb.nonNullable.group({
    icon: ['', Validators.required],
    label: ['', Validators.required],
    href: ['', Validators.required],
  });

  private readonly editData = rxResource({
    params: () => (this.id() ? { id: this.id()! } : undefined),
    stream: ({ params }) => this.profileGateway.getSocialButtonById(params.id),
  });

  private readonly patchForm = effect(() => {
    const btn = this.editData.value();
    if (btn) {
      this.form.patchValue(btn);
    }
  });

  onSubmit(): void {
    if (this.form.invalid) return;
    const values = this.form.getRawValue();
    const id = this.id();

    const request$ = id
      ? this.profileGateway.updateSocialButton(id, values)
      : this.profileGateway.createSocialButton(values);

    request$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.toast.add({
          severity: 'success',
          summary: 'Succès',
          detail: id ? 'Réseau social mis à jour' : 'Réseau social créé',
        });
        this.router.navigate(['/admin/content/social']);
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
    this.router.navigate(['/admin/content/social']);
  }
}
