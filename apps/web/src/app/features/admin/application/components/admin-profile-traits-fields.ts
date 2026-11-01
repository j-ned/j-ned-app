import { Component, input } from '@angular/core';
import type { FieldTree } from '@angular/forms/signals';
import { PROFILE_LIMITS } from '@features/profile/domain/models/profile-limits';
import { AdminOrderedList, type OrderedListConfig } from './admin-ordered-list';
import { AdminProfileTextField } from './admin-profile-text-field';
import type { ProfileDraft } from '../profile-draft';

const HIGHLIGHTS: OrderedListConfig<ProfileDraft['highlights'][number]> = {
  testIdPrefix: 'admin-profile-highlight',
  item: 'le trait',
  moved: 'Trait déplacé',
  added: 'Trait ajouté',
  removed: 'Trait supprimé',
  add: 'Ajouter un trait',
  max: PROFILE_LIMITS.highlight.items,
  create: () => ({ id: crypto.randomUUID(), title: '', description: '' }),
  trackKey: (row) => row.id,
  label: 'Traits',
  labelVisible: false,
};

@Component({
  selector: 'app-admin-profile-traits-fields',
  imports: [AdminOrderedList, AdminProfileTextField],
  host: { class: 'block' },
  template: `
    <app-admin-ordered-list [rows]="form().highlights" [config]="highlights">
      <ng-template let-row let-rank="rank">
        <app-admin-profile-text-field
          [field]="row.title"
          key="highlight-title"
          [rank]="rank"
          [label]="'Titre du trait ' + rank"
        />
        <app-admin-profile-text-field
          [field]="row.description"
          key="highlight-description"
          [rank]="rank"
          [label]="'Description du trait ' + rank"
          [rows]="3"
        />
      </ng-template>
    </app-admin-ordered-list>
  `,
})
export class AdminProfileTraitsFields {
  readonly form = input.required<FieldTree<ProfileDraft>>();

  protected readonly highlights = HIGHLIGHTS;
}
