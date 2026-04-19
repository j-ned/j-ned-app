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
import { MessageService } from 'primeng/api';
import { Button } from 'primeng/button';
import { InputText } from 'primeng/inputtext';
import { Textarea } from 'primeng/textarea';
import { Message } from 'primeng/message';

@Component({
  selector: 'app-admin-home-highlight-form',
  imports: [ReactiveFormsModule, Button, InputText, Textarea, Message],
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
          <label for="title" class="text-sm font-medium text-foreground">Titre</label>
          <input id="title" type="text" formControlName="title" pInputText fluid />
          @if (form.controls.title.touched && form.controls.title.errors?.['required']) {
            <p-message
              severity="error"
              text="Ce champ est obligatoire"
              size="small"
              variant="simple"
            />
          }
        </div>

        <div>
          <label for="description" class="text-sm font-medium text-foreground">Description</label>
          <textarea id="description" formControlName="description" rows="4" pTextarea></textarea>
          @if (
            form.controls.description.touched && form.controls.description.errors?.['required']
          ) {
            <p-message
              severity="error"
              text="Ce champ est obligatoire"
              size="small"
              variant="simple"
            />
          }
        </div>

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
          <label for="order" class="text-sm font-medium text-foreground">Ordre</label>
          <input id="order" type="number" formControlName="order" pInputText fluid />
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
export class AdminHomeHighlightForm {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly homeGateway = inject(HOME_GATEWAY);
  private readonly toast = inject(MessageService);
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
        this.toast.add({
          severity: 'success',
          summary: 'Succès',
          detail: id ? 'Mise en avant mise à jour' : 'Mise en avant créée',
        });
        this.router.navigate(['/admin/content/home-highlights']);
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
    this.router.navigate(['/admin/content/home-highlights']);
  }
}
