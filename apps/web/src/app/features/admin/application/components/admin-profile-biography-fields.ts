import { Component, input } from '@angular/core';
import type { FieldTree } from '@angular/forms/signals';
import { SITE_IDENTITY } from '@shared/identity/site-identity.static-data';
import { PROFILE_LIMITS } from '@features/profile/domain/models/profile-limits';
import { AdminOrderedList, type OrderedListConfig } from './admin-ordered-list';
import { AdminProfileTextField } from './admin-profile-text-field';
import { newParagraphRow, type ProfileDraft } from '../profile-draft';

const PARAGRAPHS: OrderedListConfig<ProfileDraft['paragraphs'][number]> = {
  testIdPrefix: 'admin-profile-paragraph',
  item: 'le paragraphe',
  moved: 'Paragraphe déplacé',
  added: 'Paragraphe ajouté',
  removed: 'Paragraphe supprimé',
  add: 'Ajouter un paragraphe',
  max: PROFILE_LIMITS.biography.paragraphs,
  create: newParagraphRow,
  trackKey: (row) => row.key,
  label: 'Paragraphes',
};

@Component({
  selector: 'app-admin-profile-biography-fields',
  imports: [AdminOrderedList, AdminProfileTextField],
  host: { class: 'grid gap-5' },
  template: `
    @let profile = form();
    <app-admin-profile-text-field
      [field]="profile.biographyTitle"
      key="biography-title"
      label="Titre"
    />
    <app-admin-profile-text-field
      [field]="profile.biographySummary"
      key="biography-summary"
      label="Résumé"
      [rows]="2"
    />
    <div>
      <p class="field-label">Début de l'accroche</p>
      <p data-testid="admin-profile-journey" class="text-[0.90625rem]">{{ journey }}</p>
      <p data-testid="admin-profile-journey-note" class="field-hint">
        Commune à l'accueil et aux offres&nbsp;: se modifie dans le code.
      </p>
    </div>
    <app-admin-profile-text-field
      [field]="profile.leadEmphasis"
      key="lead-emphasis"
      label="Suite de l'accroche"
      [rows]="2"
    />
    <app-admin-ordered-list [rows]="profile.paragraphs" [config]="paragraphs">
      <ng-template let-row let-rank="rank">
        <app-admin-profile-text-field
          [field]="row.text"
          key="paragraph-text"
          [rank]="rank"
          [label]="'Paragraphe ' + rank"
          [rows]="5"
        />
      </ng-template>
    </app-admin-ordered-list>
  `,
})
export class AdminProfileBiographyFields {
  readonly form = input.required<FieldTree<ProfileDraft>>();

  protected readonly journey = SITE_IDENTITY.journey;
  protected readonly paragraphs = PARAGRAPHS;
}
