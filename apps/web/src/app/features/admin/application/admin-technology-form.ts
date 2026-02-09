import { Component, inject, input, signal, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { PROFILE_GATEWAY } from '../../profile/domain';

@Component({
  selector: 'app-admin-technology-form',
  imports: [ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  template: `
    <h1 class="text-2xl font-bold text-foreground mb-8">
      {{ isEditMode() ? 'Modifier la technologie' : 'Nouvelle technologie' }}
    </h1>

    <form [formGroup]="form" (ngSubmit)="onSubmit()" class="max-w-2xl space-y-6">
      <div>
        <label for="name" class="block text-sm font-medium text-foreground mb-1.5">Nom</label>
        <input
          id="name"
          type="text"
          formControlName="name"
          class="w-full px-4 py-2.5 rounded-lg bg-foreground/5 border border-foreground/20 text-foreground placeholder-muted focus:border-primary focus:outline-none transition-colors"
        />
      </div>

      <div>
        <label for="category" class="block text-sm font-medium text-foreground mb-1.5"
          >Catégorie</label
        >
        <select
          id="category"
          formControlName="category"
          class="w-full px-4 py-2.5 rounded-lg bg-foreground/5 border border-foreground/20 text-foreground focus:border-primary focus:outline-none transition-colors"
        >
          <option value="" disabled>Choisir une catégorie</option>
          @for (cat of categories; track cat) {
            <option [value]="cat">{{ cat }}</option>
          }
        </select>
      </div>

      <div>
        <label for="icon" class="block text-sm font-medium text-foreground mb-1.5">Icône</label>
        <input
          id="icon"
          type="text"
          formControlName="icon"
          class="w-full px-4 py-2.5 rounded-lg bg-foreground/5 border border-foreground/20 text-foreground placeholder-muted focus:border-primary focus:outline-none transition-colors"
        />
      </div>

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
export class AdminTechnologyForm implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly profileGateway = inject(PROFILE_GATEWAY);

  readonly id = input<string>();
  readonly isEditMode = signal(false);

  readonly categories = ['Framework', 'Langage', 'Styling', 'Backend', 'Base de données', 'Devops'];

  readonly form = this.fb.nonNullable.group({
    name: ['', Validators.required],
    category: ['', Validators.required],
    icon: ['', Validators.required],
  });

  ngOnInit(): void {
    const id = this.id();
    if (id) {
      this.isEditMode.set(true);
      this.profileGateway.getTechnologyById(Number(id)).subscribe((tech) => {
        this.form.patchValue(tech);
      });
    }
  }

  onSubmit(): void {
    if (this.form.invalid) return;
    const values = this.form.getRawValue();
    const id = this.id();

    const request$ = id
      ? this.profileGateway.updateTechnology(Number(id), values)
      : this.profileGateway.createTechnology(values);

    request$.subscribe(() => this.router.navigate(['/admin/about/technologies']));
  }

  cancel(): void {
    this.router.navigate(['/admin/about/technologies']);
  }
}
