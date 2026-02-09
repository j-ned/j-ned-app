import { Component, inject, input, signal, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, FormArray, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { PROFILE_GATEWAY } from '../../profile/domain';

@Component({
  selector: 'app-admin-diploma-form',
  imports: [ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  template: `
    <h1 class="text-2xl font-bold text-foreground mb-8">
      {{ isEditMode() ? 'Modifier le diplôme' : 'Nouveau diplôme' }}
    </h1>

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
        <label for="provider" class="block text-sm font-medium text-foreground mb-1.5"
          >Organisme</label
        >
        <input
          id="provider"
          type="text"
          formControlName="provider"
          class="w-full px-4 py-2.5 rounded-lg bg-foreground/5 border border-foreground/20 text-foreground placeholder-muted focus:border-primary focus:outline-none transition-colors"
        />
      </div>

      <div>
        <label for="shortDescription" class="block text-sm font-medium text-foreground mb-1.5"
          >Description courte</label
        >
        <textarea
          id="shortDescription"
          formControlName="shortDescription"
          rows="3"
          class="w-full px-4 py-2.5 rounded-lg bg-foreground/5 border border-foreground/20 text-foreground placeholder-muted focus:border-primary focus:outline-none transition-colors resize-y"
        ></textarea>
      </div>

      <div>
        <div class="flex items-center justify-between mb-1.5">
          <span class="block text-sm font-medium text-foreground">Compétences</span>
          <button
            type="button"
            (click)="addSkill()"
            class="px-3 py-1 text-xs rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
          >
            Ajouter une compétence
          </button>
        </div>
        <div formArrayName="skills" class="space-y-2">
          @for (ctrl of skills.controls; track $index) {
            <div class="flex gap-2">
              <input
                [formControlName]="$index"
                type="text"
                class="flex-1 px-4 py-2.5 rounded-lg bg-foreground/5 border border-foreground/20 text-foreground placeholder-muted focus:border-primary focus:outline-none transition-colors"
              />
              <button
                type="button"
                (click)="removeSkill($index)"
                class="px-3 py-1.5 text-xs rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors"
              >
                Supprimer
              </button>
            </div>
          }
        </div>
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
export class AdminDiplomaForm implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly profileGateway = inject(PROFILE_GATEWAY);

  readonly id = input<string>();
  readonly isEditMode = signal(false);

  readonly form = this.fb.nonNullable.group({
    title: ['', Validators.required],
    provider: ['', Validators.required],
    shortDescription: [''],
    skills: this.fb.array<string>([]),
  });

  get skills(): FormArray {
    return this.form.controls.skills;
  }

  ngOnInit(): void {
    const id = this.id();
    if (id) {
      this.isEditMode.set(true);
      this.profileGateway.getDiplomaById(Number(id)).subscribe((diploma) => {
        this.form.patchValue({
          title: diploma.title,
          provider: diploma.provider,
          shortDescription: diploma.shortDescription,
        });
        this.skills.clear();
        diploma.skills.forEach((s) => this.skills.push(this.fb.nonNullable.control(s)));
      });
    }
  }

  addSkill(): void {
    this.skills.push(this.fb.nonNullable.control(''));
  }

  removeSkill(index: number): void {
    this.skills.removeAt(index);
  }

  onSubmit(): void {
    if (this.form.invalid) return;
    const { title, provider, shortDescription, skills } = this.form.getRawValue();
    const data = {
      title,
      provider,
      shortDescription,
      skills: skills.filter((s): s is string => s !== null),
    };
    const id = this.id();

    const request$ = id
      ? this.profileGateway.updateDiploma(Number(id), data)
      : this.profileGateway.createDiploma(data);

    request$.subscribe(() => this.router.navigate(['/admin/about/diplomas']));
  }

  cancel(): void {
    this.router.navigate(['/admin/about/diplomas']);
  }
}
