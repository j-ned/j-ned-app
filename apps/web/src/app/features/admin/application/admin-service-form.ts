import { Component, DestroyRef, inject, input, computed, effect, ChangeDetectionStrategy } from '@angular/core';
import { takeUntilDestroyed, rxResource } from '@angular/core/rxjs-interop';
import { ReactiveFormsModule, FormBuilder, FormArray, FormControl, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { HOME_GATEWAY } from '@features/home/application';
import { ToastService } from '@shared/toast';

@Component({
  selector: 'app-admin-service-form',
  imports: [ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  template: `
    <h1 class="text-2xl font-bold text-foreground mb-8">
      {{ isEditMode() ? 'Modifier la prestation' : 'Nouvelle prestation' }}
    </h1>

    <form [formGroup]="form" (ngSubmit)="onSubmit()" class="max-w-2xl space-y-6">
      <fieldset class="space-y-6 border-0 p-0 m-0">
        <legend class="sr-only">Informations de la prestation</legend>

        <div>
          <label for="title" class="block text-sm font-medium text-foreground mb-1.5"
            >Titre</label
          >
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
            rows="3"
            class="w-full px-4 py-2.5 rounded-lg bg-foreground/5 border border-foreground/20 text-foreground placeholder-muted focus:border-primary focus:outline-none transition-colors resize-y"
          ></textarea>
          @if (form.controls.description.touched && form.controls.description.errors?.['required']) {
            <span class="text-red-400 text-xs mt-1 block">Ce champ est obligatoire</span>
          }
        </div>

        <div>
          <label for="price" class="block text-sm font-medium text-foreground mb-1.5">Prix</label>
          <input
            id="price"
            type="text"
            formControlName="price"
            placeholder="ex: 500€/jour"
            class="w-full px-4 py-2.5 rounded-lg bg-foreground/5 border border-foreground/20 text-foreground placeholder-muted focus:border-primary focus:outline-none transition-colors"
          />
          @if (form.controls.price.touched && form.controls.price.errors?.['required']) {
            <span class="text-red-400 text-xs mt-1 block">Ce champ est obligatoire</span>
          }
        </div>

        <div>
          <label for="order" class="block text-sm font-medium text-foreground mb-1.5"
            >Ordre</label
          >
          <input
            id="order"
            type="number"
            formControlName="order"
            class="w-full px-4 py-2.5 rounded-lg bg-foreground/5 border border-foreground/20 text-foreground placeholder-muted focus:border-primary focus:outline-none transition-colors"
          />
        </div>

        <div class="flex items-center gap-2">
          <input
            id="highlighted"
            type="checkbox"
            formControlName="highlighted"
            class="w-4 h-4 rounded border-foreground/20 text-primary focus:ring-primary"
          />
          <label for="highlighted" class="text-sm font-medium text-foreground"
            >Mis en avant (populaire)</label
          >
        </div>

        <div>
          <div class="flex items-center justify-between mb-2">
            <span class="text-sm font-medium text-foreground">Fonctionnalités</span>
            <button
              type="button"
              (click)="addFeature()"
              class="px-3 py-1 text-xs rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
            >
              Ajouter
            </button>
          </div>
          <div formArrayName="features" class="space-y-2">
            @for (control of featuresArray.controls; track $index; let i = $index) {
              <div class="flex gap-2">
                <input
                  [formControlName]="i"
                  type="text"
                  placeholder="Ex: Développement sur mesure"
                  class="flex-1 px-4 py-2.5 rounded-lg bg-foreground/5 border border-foreground/20 text-foreground placeholder-muted focus:border-primary focus:outline-none transition-colors"
                />
                <button
                  type="button"
                  (click)="removeFeature(i)"
                  class="px-3 py-2.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors"
                >
                  <svg class="w-4 h-4">
                    <use href="/icons/sprite.svg#lucide-x"></use>
                  </svg>
                </button>
              </div>
            }
          </div>
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
export class AdminServiceForm {
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
    price: ['', Validators.required],
    order: [0],
    highlighted: [false],
    enabled: [true],
    features: this.fb.array<FormControl<string>>([]),
  });

  get featuresArray(): FormArray<FormControl<string>> {
    return this.form.controls.features;
  }

  private readonly editData = rxResource({
    params: () => this.id() ? { id: this.id()! } : undefined,
    stream: ({ params }) => this.homeGateway.getServicePricingById(params.id),
  });

  private readonly patchForm = effect(() => {
    const service = this.editData.value();
    if (service) {
      this.form.patchValue({
        title: service.title,
        description: service.description,
        price: service.price,
        order: service.order,
        highlighted: service.highlighted,
        enabled: service.enabled,
      });
      this.featuresArray.clear();
      service.features.forEach((f) =>
        this.featuresArray.push(this.fb.nonNullable.control(f, Validators.required)),
      );
    }
  });

  addFeature(): void {
    this.featuresArray.push(this.fb.nonNullable.control('', Validators.required));
  }

  removeFeature(index: number): void {
    this.featuresArray.removeAt(index);
  }

  onSubmit(): void {
    if (this.form.invalid) return;
    const values = this.form.getRawValue();
    const id = this.id();

    const request$ = id
      ? this.homeGateway.updateServicePricing(id, values)
      : this.homeGateway.createServicePricing(values);

    request$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.toast.success(id ? 'Prestation mise à jour' : 'Prestation créée');
        this.router.navigate(['/admin/home/services']);
      },
      error: () => this.toast.error("Erreur lors de l'enregistrement"),
    });
  }

  cancel(): void {
    this.router.navigate(['/admin/home/services']);
  }
}
