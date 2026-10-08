import { Component, computed, input, output } from '@angular/core';
import { FormField, type FieldTree } from '@angular/forms/signals';
import {
  PROJECT_FACT_MAX_LENGTH,
  PROJECT_PITCH_MAX_LENGTH,
} from '@features/projects/domain/models/project.model';
import { ProjectCover } from '@features/projects/application/components/project-cover';
import { FieldError } from '@shared/ui/field-error';
import { FileDropzone } from '@shared/ui/file-dropzone';
import { RequiredMark } from './required-mark';
import type { ProjectDraft } from '../project-draft';

type PresentationText = {
  readonly key: 'pitch' | 'highlight' | 'scope';
  readonly label: string;
  readonly max: number;
  readonly hint: string;
  readonly hintId: string;
  readonly errorId: string;
};

const presentationText = (
  key: PresentationText['key'],
  label: string,
  max: number,
): PresentationText => ({
  key,
  label,
  max,
  hint: `${max}\u00a0caractères au plus`,
  hintId: `project-${key}-hint`,
  errorId: `project-${key}-error`,
});

@Component({
  selector: 'app-admin-project-presentation-fields',
  imports: [FormField, FieldError, FileDropzone, ProjectCover, RequiredMark],
  host: { class: 'grid gap-5' },
  template: `
    @let project = form();
    <div data-testid="admin-project-presentation" class="grid gap-5 sm:grid-cols-2">
      @for (text of presentation; track text.key) {
        @let field = project[text.key];
        @let textInError = field().touched() && field().invalid();
        <div [class.sm:col-span-full]="text.key === 'pitch'">
          <label [for]="'project-' + text.key" class="field-label">{{ text.label }}</label>
          @if (text.key === 'pitch') {
            <textarea
              [id]="'project-' + text.key"
              [attr.data-testid]="'admin-project-' + text.key"
              [formField]="field"
              rows="3"
              [attr.aria-invalid]="textInError"
              [attr.aria-describedby]="textInError ? text.hintId + ' ' + text.errorId : text.hintId"
              class="form-textarea min-h-0"
            ></textarea>
          } @else {
            <input
              type="text"
              [id]="'project-' + text.key"
              [attr.data-testid]="'admin-project-' + text.key"
              [formField]="field"
              [attr.aria-invalid]="textInError"
              [attr.aria-describedby]="textInError ? text.hintId + ' ' + text.errorId : text.hintId"
              class="form-input"
            />
          }
          <p class="field-hint">
            <span [id]="text.hintId">{{ text.hint }}</span>
            <span
              [attr.data-testid]="'admin-project-' + text.key + '-count'"
              class="font-mono text-xs tabular-nums"
              >{{ field().value().length }} / {{ text.max }}</span
            >
          </p>
          <app-field-error
            [field]="field"
            [errorId]="text.errorId"
            [testId]="'admin-project-' + text.key + '-error'"
          />
        </div>
      }
    </div>

    <div>
      @let descriptionInError = project.description().touched() && project.description().invalid();
      <label for="project-description" class="field-label">
        Description longue <app-required-mark />
      </label>
      <textarea
        id="project-description"
        data-testid="admin-project-description"
        [formField]="project.description"
        [attr.aria-invalid]="descriptionInError"
        [attr.aria-describedby]="
          descriptionInError
            ? 'project-description-hint project-description-error'
            : 'project-description-hint'
        "
        rows="4"
        class="form-textarea"
      ></textarea>
      <p id="project-description-hint" class="field-hint">Affichée sur la fiche du projet.</p>
      <app-field-error
        [field]="project.description"
        errorId="project-description-error"
        testId="admin-project-description-error"
      />
    </div>

    <div>
      <span id="project-cover-label" class="field-label">Couverture</span>
      <div
        data-testid="admin-project-cover-field"
        role="group"
        aria-labelledby="project-cover-label"
        class="grid items-start gap-4.5"
        [class]="persistedCover() ? 'sm:grid-cols-[15rem_minmax(0,1fr)]' : ''"
      >
        @if (persistedCover(); as cover) {
          <app-project-cover
            data-testid="admin-project-cover-current"
            [image]="cover"
            [alt]="currentCoverAlt()"
            [kind]="currentKind()"
          />
        }
        <app-file-dropzone
          data-testid="admin-project-cover"
          accept="image/*"
          label="Remplacer l'image"
          helperText="AVIF, WebP, JPG ou PNG · ratio 16/10 conseillé"
          [resetToken]="coverResetToken()"
          (fileSelected)="selectCover($event)"
          (cleared)="coverCleared.emit()"
        />
      </div>
    </div>
  `,
})
export class AdminProjectPresentationFields {
  readonly form = input.required<FieldTree<ProjectDraft>>();
  readonly persistedCover = input('');
  readonly coverResetToken = input<number>();
  readonly coverSelected = output<File>();
  readonly coverCleared = output<void>();
  readonly coverRejected = output<void>();

  protected readonly currentCoverAlt = computed(
    () => `Couverture actuelle de ${this.form().title().value()}`,
  );
  protected readonly currentKind = computed(() => this.form().kind().value() || null);
  protected readonly presentation = [
    presentationText('pitch', 'Accroche', PROJECT_PITCH_MAX_LENGTH),
    presentationText('highlight', 'Point fort', PROJECT_FACT_MAX_LENGTH),
    presentationText('scope', 'Périmètre', PROJECT_FACT_MAX_LENGTH),
  ];

  protected selectCover(file: File): void {
    if (file.type.startsWith('image/')) this.coverSelected.emit(file);
    else this.coverRejected.emit();
  }
}
