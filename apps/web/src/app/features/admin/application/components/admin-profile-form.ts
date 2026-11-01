import { Component, model, output } from '@angular/core';
import {
  FormRoot,
  apply,
  applyEach,
  form,
  required,
  schema,
  validate,
  type Schema,
} from '@angular/forms/signals';
import type { ProfileContent } from '@features/profile/domain/models/profile-content.model';
import { PROFILE_LIMITS } from '@features/profile/domain/models/profile-limits';
import { focusFirstInvalid } from '@shared/forms/focus-first-invalid';
import { AdminFormSection } from './admin-form-section';
import { AdminProfileBiographyFields } from './admin-profile-biography-fields';
import { AdminProfileDiplomasFields } from './admin-profile-diplomas-fields';
import { AdminProfileMotivationFields } from './admin-profile-motivation-fields';
import { AdminProfileTraitsFields } from './admin-profile-traits-fields';
import { AdminProfileWorkFields } from './admin-profile-work-fields';
import { REQUIRED_MESSAGE } from './required-message';
import { toProfileContent, toSkills, type ProfileDraft } from '../profile-draft';

// Bornes comptées sur le texte coupé de ses espaces de bord : c'est lui qui part à l'API.
const profileText = (limit: number, subject: string): Schema<string> =>
  schema<string>((path) => {
    validate(path, ({ value }) => {
      const text = value().trim();
      if (!text) return { kind: 'required', message: REQUIRED_MESSAGE };
      if (text.length > limit) {
        return {
          kind: 'maxLength',
          message: `${subject} ne doit pas dépasser ${limit}\u00a0caractères`,
        };
      }
      return null;
    });
  });

type ListError = { readonly kind: 'required'; readonly message: string } | null;

const atLeastOne =
  (message: string) =>
  ({ value }: { readonly value: () => readonly unknown[] }): ListError =>
    value().length > 0 ? null : { kind: 'required', message };

const skillList = schema<string>((path) => {
  const { skill, skills } = PROFILE_LIMITS.diploma;
  validate(path, ({ value }) => {
    const lines = toSkills(value());
    if (lines.length === 0) return { kind: 'required', message: REQUIRED_MESSAGE };
    if (lines.some((line) => line.length > skill)) {
      return {
        kind: 'maxLength',
        message: `Chaque compétence ne doit pas dépasser ${skill}\u00a0caractères`,
      };
    }
    if (lines.length > skills)
      return { kind: 'maxItems', message: `${skills} compétences au plus` };
    return null;
  });
});

const { biography, sectionSummary, highlight, whatIDo, technology, diploma, motivation } =
  PROFILE_LIMITS;

@Component({
  selector: 'app-admin-profile-form',
  imports: [
    FormRoot,
    AdminFormSection,
    AdminProfileBiographyFields,
    AdminProfileTraitsFields,
    AdminProfileWorkFields,
    AdminProfileDiplomasFields,
    AdminProfileMotivationFields,
  ],
  host: { class: 'block' },
  template: `
    <form
      id="profile-form"
      data-testid="admin-profile-form"
      [formRoot]="form"
      novalidate
      class="grid gap-8.5"
    >
      <fieldset
        app-admin-form-section
        id="profile-biography"
        number="01"
        heading="Parcours"
        description="Le haut de la page À propos&nbsp;: titre, résumé et accroche."
      >
        <app-admin-profile-biography-fields [form]="form" />
      </fieldset>

      <fieldset
        app-admin-form-section
        id="profile-traits"
        number="02"
        heading="Traits"
        description="Les traits de caractère présentés en cartes."
      >
        <app-admin-profile-traits-fields [form]="form" />
      </fieldset>

      <fieldset
        app-admin-form-section
        id="profile-work"
        number="03"
        heading="Ce que je fais"
        description="Les activités proposées et la stack technique."
      >
        <app-admin-profile-work-fields [form]="form" />
      </fieldset>

      <fieldset
        app-admin-form-section
        id="profile-diplomas"
        number="04"
        heading="Formations"
        description="Les formations suivies et leurs compétences."
      >
        <app-admin-profile-diplomas-fields [form]="form" />
      </fieldset>

      <fieldset
        app-admin-form-section
        id="profile-motivation"
        number="05"
        heading="Motivation"
        description="Le bloc qui conclut la page."
      >
        <app-admin-profile-motivation-fields [form]="form" />
      </fieldset>
    </form>
  `,
})
export class AdminProfileForm {
  readonly value = model.required<ProfileDraft>();
  readonly submitted = output<ProfileContent>();

  readonly form = form(
    this.value,
    (path) => {
      apply(path.biographyTitle, profileText(biography.title, 'Le titre'));
      apply(path.biographySummary, profileText(biography.summary, 'Le résumé'));
      apply(path.leadEmphasis, profileText(biography.leadEmphasis, "La suite de l'accroche"));
      validate(path.paragraphs, atLeastOne('Ajoutez au moins un paragraphe.'));
      applyEach(path.paragraphs, (row) => {
        apply(row.text, profileText(biography.paragraph, 'Le paragraphe'));
      });
      validate(path.highlights, atLeastOne('Ajoutez au moins un trait.'));
      applyEach(path.highlights, (row) => {
        apply(row.title, profileText(highlight.title, 'Le titre'));
        apply(row.description, profileText(highlight.description, 'La description'));
      });
      apply(path.workSummary, profileText(sectionSummary, 'Le résumé'));
      validate(path.whatIDo, atLeastOne('Ajoutez au moins une activité.'));
      applyEach(path.whatIDo, (row) => {
        apply(row.title, profileText(whatIDo.title, 'Le titre'));
        apply(row.description, profileText(whatIDo.description, 'La description'));
      });
      validate(path.technologies, atLeastOne('Ajoutez au moins une technologie.'));
      applyEach(path.technologies, (row) => {
        apply(row.name, profileText(technology.name, 'Le nom'));
        apply(row.category, profileText(technology.category, 'La catégorie'));
        required(row.icon, { message: REQUIRED_MESSAGE });
      });
      apply(path.diplomasSummary, profileText(sectionSummary, 'Le résumé'));
      validate(path.diplomas, atLeastOne('Ajoutez au moins une formation.'));
      applyEach(path.diplomas, (row) => {
        apply(row.title, profileText(diploma.title, "L'intitulé"));
        apply(row.provider, profileText(diploma.provider, "L'organisme"));
        apply(row.level, profileText(diploma.level, 'Le niveau'));
        apply(row.shortDescription, profileText(diploma.shortDescription, 'La description'));
        apply(row.skills, skillList);
      });
      apply(path.motivationTitle, profileText(motivation.title, 'Le titre'));
      apply(path.motivationStatement, profileText(motivation.statement, "L'énoncé"));
      apply(path.motivationDescription, profileText(motivation.description, 'La description'));
    },
    {
      submission: {
        action: async () => {
          this.submitted.emit(toProfileContent(this.value()));
        },
        onInvalid: (field) => focusFirstInvalid(field),
      },
    },
  );
}
