import { Component, input } from '@angular/core';
import type { FieldTree } from '@angular/forms/signals';
import { AdminProfileTextField } from './admin-profile-text-field';
import type { ProfileDraft } from '../profile-draft';

@Component({
  selector: 'app-admin-profile-motivation-fields',
  imports: [AdminProfileTextField],
  host: { class: 'grid gap-5' },
  template: `
    @let profile = form();
    <app-admin-profile-text-field
      [field]="profile.motivationTitle"
      key="motivation-title"
      label="Titre"
    />
    <app-admin-profile-text-field
      [field]="profile.motivationStatement"
      key="motivation-statement"
      label="Énoncé"
      [rows]="2"
    />
    <app-admin-profile-text-field
      [field]="profile.motivationDescription"
      key="motivation-description"
      label="Description"
      [rows]="4"
    />
  `,
})
export class AdminProfileMotivationFields {
  readonly form = input.required<FieldTree<ProfileDraft>>();
}
