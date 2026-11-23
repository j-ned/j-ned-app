import { Component, input, output } from '@angular/core';
import type { ProjectImage } from '@features/projects/domain/models/project.model';
import { AdminEmptyState } from './admin-empty-state';
import { AdminFormSection } from './admin-form-section';
import { AdminProjectGallery } from './admin-project-gallery';

@Component({
  selector: 'app-admin-project-gallery-section',
  imports: [AdminEmptyState, AdminFormSection, AdminProjectGallery],
  host: { class: 'mt-8.5 block' },
  template: `
    <fieldset
      app-admin-form-section
      id="project-gallery"
      number="05"
      heading="Galerie"
      description="Captures de la fiche, dans cet ordre. Chaque capture a un texte alternatif."
    >
      @if (projectId(); as id) {
        <app-admin-project-gallery
          [projectId]="id"
          [images]="images()"
          (galleryChange)="galleryChange.emit($event)"
          (versionWritten)="versionWritten.emit($event)"
        />
      } @else {
        <app-admin-empty-state data-testid="admin-project-gallery-pending" stamp="Galerie vide">
          <p>Enregistre le projet pour ajouter des captures.</p>
        </app-admin-empty-state>
      }
    </fieldset>
  `,
})
export class AdminProjectGallerySection {
  readonly projectId = input<string>();
  readonly images = input.required<readonly ProjectImage[]>();
  readonly galleryChange = output<readonly ProjectImage[]>();
  readonly versionWritten = output<number>();
}
