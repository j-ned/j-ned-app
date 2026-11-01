import { Component, input } from '@angular/core';
import type { FieldTree } from '@angular/forms/signals';
import { PROFILE_LIMITS } from '@features/profile/domain/models/profile-limits';
import { AdminOrderedList, type OrderedListConfig } from './admin-ordered-list';
import { AdminProfileTextField } from './admin-profile-text-field';
import type { ProfileDraft } from '../profile-draft';

const DIPLOMAS: OrderedListConfig<ProfileDraft['diplomas'][number]> = {
  testIdPrefix: 'admin-profile-diploma',
  item: 'la formation',
  moved: 'Formation déplacée',
  added: 'Formation ajoutée',
  removed: 'Formation supprimée',
  add: 'Ajouter une formation',
  max: PROFILE_LIMITS.diploma.items,
  create: () => ({
    id: crypto.randomUUID(),
    title: '',
    provider: '',
    level: '',
    shortDescription: '',
    skills: '',
  }),
  trackKey: (row) => row.id,
  label: 'Formations',
  labelVisible: false,
};

@Component({
  selector: 'app-admin-profile-diplomas-fields',
  imports: [AdminOrderedList, AdminProfileTextField],
  host: { class: 'grid gap-5' },
  template: `
    @let profile = form();
    <app-admin-profile-text-field
      [field]="profile.diplomasSummary"
      key="diplomas-summary"
      label="Résumé"
      [rows]="2"
    />
    <app-admin-ordered-list [rows]="profile.diplomas" [config]="diplomas">
      <ng-template let-row let-rank="rank">
        <app-admin-profile-text-field
          [field]="row.title"
          key="diploma-title"
          [rank]="rank"
          [label]="'Intitulé de la formation ' + rank"
        />
        <div class="grid gap-3 sm:grid-cols-2">
          <app-admin-profile-text-field
            [field]="row.provider"
            key="diploma-provider"
            [rank]="rank"
            [label]="'Organisme de la formation ' + rank"
          />
          <app-admin-profile-text-field
            [field]="row.level"
            key="diploma-level"
            [rank]="rank"
            [label]="'Niveau de la formation ' + rank"
          />
        </div>
        <app-admin-profile-text-field
          [field]="row.shortDescription"
          key="diploma-description"
          [rank]="rank"
          [label]="'Description de la formation ' + rank"
          [rows]="3"
        />
        <app-admin-profile-text-field
          [field]="row.skills"
          key="diploma-skills"
          [rank]="rank"
          [label]="'Compétences de la formation ' + rank"
          hint="Une compétence par ligne."
          [rows]="4"
        />
      </ng-template>
    </app-admin-ordered-list>
  `,
})
export class AdminProfileDiplomasFields {
  readonly form = input.required<FieldTree<ProfileDraft>>();

  protected readonly diplomas = DIPLOMAS;
}
