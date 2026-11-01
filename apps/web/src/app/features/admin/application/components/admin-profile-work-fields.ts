import { Component, input } from '@angular/core';
import { FormField, type FieldTree } from '@angular/forms/signals';
import { PROFILE_LIMITS } from '@features/profile/domain/models/profile-limits';
import { TECHNOLOGY_ICONS } from '@features/profile/domain/models/technology-icon';
import { FieldError } from '@shared/ui/field-error';
import { AdminOrderedList, type OrderedListConfig } from './admin-ordered-list';
import { AdminProfileTextField } from './admin-profile-text-field';
import type { ProfileDraft } from '../profile-draft';

const ACTIVITIES: OrderedListConfig<ProfileDraft['whatIDo'][number]> = {
  testIdPrefix: 'admin-profile-activity',
  item: "l'activité",
  moved: 'Activité déplacée',
  added: 'Activité ajoutée',
  removed: 'Activité supprimée',
  add: 'Ajouter une activité',
  max: PROFILE_LIMITS.whatIDo.items,
  create: () => ({ id: crypto.randomUUID(), title: '', description: '' }),
  trackKey: (row) => row.id,
  label: 'Activités',
};

const TECHNOLOGIES: OrderedListConfig<ProfileDraft['technologies'][number]> = {
  testIdPrefix: 'admin-profile-technology',
  item: 'la technologie',
  moved: 'Technologie déplacée',
  added: 'Technologie ajoutée',
  removed: 'Technologie supprimée',
  add: 'Ajouter une technologie',
  max: PROFILE_LIMITS.technology.items,
  create: () => ({ id: crypto.randomUUID(), name: '', category: '', icon: '' }),
  trackKey: (row) => row.id,
  label: 'Stack technique',
};

@Component({
  selector: 'app-admin-profile-work-fields',
  imports: [FormField, FieldError, AdminOrderedList, AdminProfileTextField],
  host: { class: 'grid gap-5' },
  template: `
    @let profile = form();
    <app-admin-profile-text-field
      [field]="profile.workSummary"
      key="work-summary"
      label="Résumé"
      [rows]="2"
    />
    <app-admin-ordered-list [rows]="profile.whatIDo" [config]="activities">
      <ng-template let-row let-rank="rank">
        <app-admin-profile-text-field
          [field]="row.title"
          key="activity-title"
          [rank]="rank"
          label="Titre de l'activité {{ rank }}"
        />
        <app-admin-profile-text-field
          [field]="row.description"
          key="activity-description"
          [rank]="rank"
          label="Description de l'activité {{ rank }}"
          [rows]="4"
        />
      </ng-template>
    </app-admin-ordered-list>
    <app-admin-ordered-list [rows]="profile.technologies" [config]="technologies">
      <ng-template let-row let-rank="rank">
        <div class="grid gap-3 sm:grid-cols-3">
          <app-admin-profile-text-field
            [field]="row.name"
            key="technology-name"
            [rank]="rank"
            [label]="'Nom de la technologie ' + rank"
          />
          <app-admin-profile-text-field
            [field]="row.category"
            key="technology-category"
            [rank]="rank"
            [label]="'Catégorie de la technologie ' + rank"
          />
          <div>
            @let iconId = 'profile-technology-icon-' + rank;
            @let iconInError = row.icon().touched() && row.icon().invalid();
            <label [for]="iconId" class="field-label">Icône de la technologie {{ rank }}</label>
            <select
              [id]="iconId"
              data-testid="admin-profile-technology-icon"
              [formField]="row.icon"
              aria-required="true"
              [attr.aria-invalid]="iconInError"
              [attr.aria-describedby]="iconInError ? iconId + '-error' : null"
              class="app-select w-full"
            >
              <option value="" disabled>Choisir une icône</option>
              @for (icon of icons; track icon) {
                <option [value]="icon">{{ icon }}</option>
              }
            </select>
            <app-field-error
              [field]="row.icon"
              [errorId]="iconId + '-error'"
              testId="admin-profile-technology-icon-error"
            />
          </div>
        </div>
      </ng-template>
    </app-admin-ordered-list>
  `,
})
export class AdminProfileWorkFields {
  readonly form = input.required<FieldTree<ProfileDraft>>();

  protected readonly activities = ACTIVITIES;
  protected readonly technologies = TECHNOLOGIES;
  protected readonly icons = TECHNOLOGY_ICONS;
}
