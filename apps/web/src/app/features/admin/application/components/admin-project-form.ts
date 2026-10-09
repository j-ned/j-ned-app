import { Component, input, model, output } from '@angular/core';
import { FormField, FormRoot, applyEach, form, maxLength, required } from '@angular/forms/signals';
import {
  PROJECT_FACT_MAX_LENGTH,
  PROJECT_PITCH_MAX_LENGTH,
  type ProjectInput,
} from '@features/projects/domain/models/project.model';
import { isProjectKind } from '@features/projects/domain/is-project-kind';
import { focusFirstInvalid } from '@shared/forms/focus-first-invalid';
import { AdminTagsSelector } from './admin-tags-selector';
import { AdminFormSection } from './admin-form-section';
import { AdminPairRows } from './admin-pair-rows';
import { AdminProjectIdentityFields } from './admin-project-identity-fields';
import { AdminProjectPresentationFields } from './admin-project-presentation-fields';
import { AVAILABLE_PROJECT_TAGS, DECISION_ROWS, TECH_CHOICE_ROWS } from './admin-project-form-data';
import { REQUIRED_MESSAGE } from './required-message';
import { toProjectInput, type ProjectDraft } from '../project-draft';

@Component({
  selector: 'app-admin-project-form',
  imports: [
    FormRoot,
    FormField,
    AdminTagsSelector,
    AdminFormSection,
    AdminPairRows,
    AdminProjectIdentityFields,
    AdminProjectPresentationFields,
  ],
  host: { class: 'block' },
  template: `
    <form
      id="project-form"
      data-testid="admin-project-form"
      [formRoot]="form"
      novalidate
      class="grid gap-8.5"
    >
      <fieldset
        app-admin-form-section
        id="project-identity"
        number="01"
        heading="Identité"
        description="Ce qui range le projet&nbsp;: nom, nature, ordre."
      >
        <app-admin-project-identity-fields [form]="form" />
      </fieldset>

      <fieldset
        app-admin-form-section
        id="project-presentation"
        number="02"
        heading="Présentation dans les Réalisations"
        description="Les textes de la carte publique."
      >
        <app-admin-project-presentation-fields
          [form]="form"
          [persistedCover]="persistedCover()"
          [coverResetToken]="coverResetToken()"
          (coverSelected)="coverSelected.emit($event)"
          (coverCleared)="coverCleared.emit()"
          (coverRejected)="coverRejected.emit()"
        />
      </fieldset>

      <fieldset
        app-admin-form-section
        id="project-links"
        number="03"
        heading="Liens"
        description="Vides si le projet n'en a pas&nbsp;: le bouton n'apparaît pas."
      >
        <div class="grid gap-5 sm:grid-cols-2">
          @for (link of links; track link.key) {
            <div>
              <label [for]="'project-' + link.key" class="field-label">{{ link.label }}</label>
              <input
                type="text"
                inputmode="url"
                [id]="'project-' + link.key"
                [attr.data-testid]="link.testId"
                [formField]="form[link.key]"
                placeholder="https://…"
                class="form-input"
              />
            </div>
          }
        </div>
      </fieldset>

      <fieldset
        app-admin-form-section
        id="project-stack"
        number="04"
        heading="Choix techniques"
        description="La stack résumée sur la carte, puis le détail de la fiche."
      >
        <app-admin-tags-selector
          data-testid="admin-project-tags"
          [availableTags]="availableTags"
          [formField]="form.tags"
        />
        <app-admin-pair-rows [rows]="form.techChoices" [config]="techChoiceRows" />
        <app-admin-pair-rows [rows]="form.architectureDecisions" [config]="decisionRows" />
      </fieldset>
    </form>
  `,
})
export class AdminProjectForm {
  readonly value = model.required<ProjectDraft>();
  readonly persistedCover = input('');
  readonly coverResetToken = input<number>();
  readonly submitted = output<ProjectInput>();
  readonly coverSelected = output<File>();
  readonly coverCleared = output<void>();
  readonly coverRejected = output<void>();

  protected readonly availableTags = AVAILABLE_PROJECT_TAGS;
  protected readonly techChoiceRows = TECH_CHOICE_ROWS;
  protected readonly decisionRows = DECISION_ROWS;
  protected readonly links = [
    { key: 'liveUrl', label: 'Site en ligne', testId: 'admin-project-live-url' },
    { key: 'repoUrl', label: 'Dépôt unique', testId: 'admin-project-repo-url' },
    { key: 'repoUrlFront', label: 'Dépôt front', testId: 'admin-project-repo-url-front' },
    { key: 'repoUrlBack', label: 'Dépôt API', testId: 'admin-project-repo-url-back' },
  ] as const;

  readonly form = form(
    this.value,
    (path) => {
      required(path.title, { message: REQUIRED_MESSAGE });
      required(path.category, { message: REQUIRED_MESSAGE });
      required(path.description, { message: REQUIRED_MESSAGE });
      required(path.kind, { message: REQUIRED_MESSAGE });
      maxLength(path.pitch, PROJECT_PITCH_MAX_LENGTH, {
        message: `L'accroche ne doit pas dépasser ${PROJECT_PITCH_MAX_LENGTH}\u00a0caractères`,
      });
      maxLength(path.highlight, PROJECT_FACT_MAX_LENGTH, {
        message: `Le point fort ne doit pas dépasser ${PROJECT_FACT_MAX_LENGTH}\u00a0caractères`,
      });
      maxLength(path.scope, PROJECT_FACT_MAX_LENGTH, {
        message: `Le périmètre ne doit pas dépasser ${PROJECT_FACT_MAX_LENGTH}\u00a0caractères`,
      });
      applyEach(path.techChoices, (item) => {
        required(item.techno, { message: REQUIRED_MESSAGE });
        required(item.why, { message: REQUIRED_MESSAGE });
      });
      applyEach(path.architectureDecisions, (item) => {
        required(item.decision, { message: REQUIRED_MESSAGE });
        required(item.rationale, { message: REQUIRED_MESSAGE });
      });
    },
    {
      submission: {
        action: async () => {
          const draft = this.value();
          if (isProjectKind(draft.kind)) {
            this.submitted.emit(toProjectInput(draft, draft.kind));
          }
        },
        onInvalid: (field) => focusFirstInvalid(field),
      },
    },
  );
}
