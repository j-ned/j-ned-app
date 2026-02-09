import { Component, inject, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { PROFILE_GATEWAY } from '../../profile/domain';

@Component({
  selector: 'app-admin-what-i-seek',
  imports: [ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  template: `
    <h1 class="text-2xl font-bold text-foreground mb-8">Ce que je cherche</h1>

    <form [formGroup]="form" (ngSubmit)="onSubmit()" class="max-w-2xl space-y-6">
      <div>
        <label for="title" class="block text-sm font-medium text-foreground mb-1.5">Titre</label>
        <input
          id="title"
          type="text"
          formControlName="title"
          class="w-full px-4 py-2.5 rounded-lg bg-foreground/5 border border-foreground/20 text-foreground placeholder-muted focus:border-primary focus:outline-none transition-colors"
        />
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
      </div>

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
export class AdminWhatISeek implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly profileGateway = inject(PROFILE_GATEWAY);
  private whatISeekId = 1;

  readonly form = this.fb.nonNullable.group({
    title: ['', Validators.required],
    description: ['', Validators.required],
  });

  ngOnInit(): void {
    this.profileGateway.getWhatISeekForEdit().subscribe((data) => {
      this.whatISeekId = data.id;
      this.form.patchValue({ title: data.title, description: data.description });
    });
  }

  onSubmit(): void {
    if (this.form.invalid) return;
    const values = this.form.getRawValue();
    this.profileGateway
      .updateWhatISeek({ id: this.whatISeekId, ...values })
      .subscribe(() => this.router.navigate(['/admin/about']));
  }

  cancel(): void {
    this.router.navigate(['/admin/about']);
  }
}
