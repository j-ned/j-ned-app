import { Component, inject, input, signal, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { PROFILE_GATEWAY } from '../../profile/domain';

@Component({
  selector: 'app-admin-social-button-form',
  imports: [ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  template: `
    <h1 class="text-2xl font-bold text-foreground mb-8">
      {{ isEditMode() ? 'Modifier le bouton social' : 'Nouveau bouton social' }}
    </h1>

    <form [formGroup]="form" (ngSubmit)="onSubmit()" class="max-w-2xl space-y-6">
      <div>
        <label for="icon" class="block text-sm font-medium text-foreground mb-1.5">Icône</label>
        <input
          id="icon"
          type="text"
          formControlName="icon"
          class="w-full px-4 py-2.5 rounded-lg bg-foreground/5 border border-foreground/20 text-foreground placeholder-muted focus:border-primary focus:outline-none transition-colors"
        />
      </div>

      <div>
        <label for="label" class="block text-sm font-medium text-foreground mb-1.5">Label</label>
        <input
          id="label"
          type="text"
          formControlName="label"
          class="w-full px-4 py-2.5 rounded-lg bg-foreground/5 border border-foreground/20 text-foreground placeholder-muted focus:border-primary focus:outline-none transition-colors"
        />
      </div>

      <div>
        <label for="href" class="block text-sm font-medium text-foreground mb-1.5">Lien</label>
        <input
          id="href"
          type="text"
          formControlName="href"
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
export class AdminSocialButtonForm implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly profileGateway = inject(PROFILE_GATEWAY);

  readonly id = input<string>();
  readonly isEditMode = signal(false);

  readonly form = this.fb.nonNullable.group({
    icon: ['', Validators.required],
    label: ['', Validators.required],
    href: ['', Validators.required],
  });

  ngOnInit(): void {
    const id = this.id();
    if (id) {
      this.isEditMode.set(true);
      this.profileGateway.getSocialButtonById(Number(id)).subscribe((btn) => {
        this.form.patchValue(btn);
      });
    }
  }

  onSubmit(): void {
    if (this.form.invalid) return;
    const values = this.form.getRawValue();
    const id = this.id();

    const request$ = id
      ? this.profileGateway.updateSocialButton(Number(id), values)
      : this.profileGateway.createSocialButton(values);

    request$.subscribe(() => this.router.navigate(['/admin/about/social-buttons']));
  }

  cancel(): void {
    this.router.navigate(['/admin/about/social-buttons']);
  }
}
