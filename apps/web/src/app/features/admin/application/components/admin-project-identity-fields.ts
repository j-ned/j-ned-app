import { Component, input } from '@angular/core';
import { FormField, type FieldTree } from '@angular/forms/signals';
import { PROJECT_KINDS } from '@features/projects/domain/models/project.model';
import { PROJECT_KIND_DEFINITIONS } from '@features/projects/application/project-kind-copy';
import { ProjectKindStamp } from '@features/projects/application/components/project-kind-stamp';
import { FieldError } from '@shared/ui/field-error';
import { PROJECT_CATEGORIES } from './admin-project-form-data';
import { RequiredMark } from './required-mark';
import type { ProjectDraft } from '../project-draft';

@Component({
  selector: 'app-admin-project-identity-fields',
  imports: [FormField, FieldError, RequiredMark, ProjectKindStamp],
  host: { class: 'grid gap-5' },
  template: `
    @let project = form();
    <div class="grid gap-5 sm:grid-cols-2">
      <div>
        @let titleInError = project.title().touched() && project.title().invalid();
        <label for="project-title" class="field-label">Titre <app-required-mark /></label>
        <input
          id="project-title"
          type="text"
          data-testid="admin-project-title"
          [formField]="project.title"
          [attr.aria-invalid]="titleInError"
          [attr.aria-describedby]="titleInError ? 'project-title-error' : null"
          class="form-input"
        />
        <app-field-error
          [field]="project.title"
          errorId="project-title-error"
          testId="admin-project-title-error"
        />
      </div>
      <div>
        @let categoryInError = project.category().touched() && project.category().invalid();
        <label for="project-category" class="field-label"> Catégorie <app-required-mark /> </label>
        <select
          id="project-category"
          data-testid="admin-project-category"
          [formField]="project.category"
          [attr.aria-invalid]="categoryInError"
          [attr.aria-describedby]="categoryInError ? 'project-category-error' : null"
          class="app-select w-full"
        >
          <option value="" disabled>Choisir une catégorie</option>
          @for (option of categories; track option) {
            <option [value]="option">{{ option }}</option>
          }
        </select>
        <app-field-error
          [field]="project.category"
          errorId="project-category-error"
          testId="admin-project-category-error"
        />
      </div>
    </div>

    @let kindInError = project.kind().touched() && project.kind().invalid();
    <fieldset
      data-testid="admin-project-kind"
      role="radiogroup"
      [attr.aria-invalid]="kindInError"
      [attr.aria-describedby]="kindInError ? 'project-kind-error' : null"
      class="min-w-0"
    >
      <legend class="field-label w-full">
        <span data-testid="admin-project-kind-legend">Nature</span>
        <app-required-mark />
      </legend>
      <div class="grid gap-2.5 sm:grid-cols-3">
        @for (option of kinds; track option.value) {
          <label
            class="group relative grid cursor-pointer content-start gap-2 rounded-md border border-field p-3.5 has-checked:border-primary has-checked:shadow-[inset_0_0_0_1px_var(--color-primary)] has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-primary"
          >
            <input
              type="radio"
              class="peer absolute inset-0 size-full cursor-pointer opacity-0"
              [value]="option.value"
              [attr.data-testid]="'admin-project-kind-' + option.value"
              [formField]="project.kind"
            />
            <span
              aria-hidden="true"
              class="absolute top-3 right-3 size-4.5 rounded-full border-[1.5px] border-field group-has-checked:border-[5px] group-has-checked:border-primary"
            ></span>
            <app-project-kind-stamp
              data-testid="admin-project-kind-stamp"
              class="justify-self-start"
              [kind]="option.value"
            />
            <span data-testid="admin-project-kind-definition" class="text-[0.8125rem] text-muted">
              {{ option.definition }}
            </span>
          </label>
        }
      </div>
      <app-field-error
        [field]="project.kind"
        errorId="project-kind-error"
        testId="admin-project-kind-error"
      />
    </fieldset>

    <div class="grid items-end gap-5 sm:grid-cols-2">
      <div>
        <label for="project-order" class="field-label">Position dans la liste</label>
        <input
          id="project-order"
          type="number"
          data-testid="admin-project-order"
          aria-describedby="project-order-hint"
          [formField]="project.order"
          class="form-input max-w-32"
        />
        <p id="project-order-hint" class="field-hint">1 = en tête de Réalisations</p>
      </div>
      <label for="project-featured" class="flex min-h-11 items-center gap-3 text-[0.90625rem]">
        <input
          id="project-featured"
          type="checkbox"
          data-testid="admin-project-featured-input"
          [formField]="project.featured"
          class="accent-primary-bg size-5"
        />
        Mettre en avant sur l'accueil
      </label>
    </div>
  `,
})
export class AdminProjectIdentityFields {
  readonly form = input.required<FieldTree<ProjectDraft>>();

  protected readonly categories = PROJECT_CATEGORIES;
  protected readonly kinds = PROJECT_KINDS.map((value) => ({
    value,
    definition: PROJECT_KIND_DEFINITIONS[value],
  }));
}
