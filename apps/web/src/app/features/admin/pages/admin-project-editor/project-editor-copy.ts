import { withValidationDetail } from '@shared/api/with-validation-detail';
import type { AdminEditorCopy } from '../../application/components/admin-editor-frame';
import type { EditedDraft } from '../../application/editor-draft';
import type { FormTocSection } from '../../application/form-toc-entries';
import { isStaleVersion } from '../../application/is-stale-version';
import { isTitleTaken } from '../../application/is-title-taken';
import type { ProjectDraft } from '../../application/project-draft';
import { uploadFailureMessage } from '../../application/upload-failure-message';

export const PROJECT_FORM_SECTIONS: readonly FormTocSection<EditedDraft<ProjectDraft>>[] = [
  {
    id: 'project-identity',
    label: '01 · Identité',
    fields: ['title', 'category', 'kind', 'order', 'featured'],
  },
  {
    id: 'project-presentation',
    label: '02 · Présentation',
    fields: ['pitch', 'highlight', 'scope', 'description', 'cover'],
  },
  {
    id: 'project-links',
    label: '03 · Liens',
    fields: ['liveUrl', 'repoUrl', 'repoUrlFront', 'repoUrlBack'],
  },
  {
    id: 'project-stack',
    label: '04 · Choix techniques',
    fields: ['tags', 'techChoices', 'architectureDecisions'],
  },
  { id: 'project-gallery', label: '05 · Galerie', fields: [] },
];

export const PROJECT_EDITOR_COPY: AdminEditorCopy = {
  testIdPrefix: 'admin-project',
  loading: 'Chargement du projet…',
  loadError: "Le projet n'a pas pu être chargé. Vérifie ta connexion, puis réessaie.",
  missing: "Ce projet n'existe pas ou a été supprimé.",
  backRoute: '/admin/projects',
  backLabel: 'Retour aux projets',
  leave: 'Les modifications non enregistrées de ce projet seront perdues.',
  entity: 'de ce projet',
};

const CONFLICT_MESSAGE =
  "Le projet n'a pas été enregistré : une version plus récente a été enregistrée ailleurs.";

const TITLE_TAKEN_MESSAGE = 'Un autre projet porte déjà ce titre : choisis-en un autre.';

export function projectSaveFailure(error: unknown, existing: boolean): string {
  if (isStaleVersion(error)) return CONFLICT_MESSAGE;
  if (isTitleTaken(error)) return TITLE_TAKEN_MESSAGE;
  const failure = existing
    ? 'Erreur lors de la mise à jour du projet'
    : 'Erreur lors de la création du projet';
  return withValidationDetail(failure, error);
}

export function projectCoverFailure(error: unknown, existing: boolean): string {
  const warning = existing
    ? "Projet mis à jour, mais l'image de couverture n'a pas été envoyée."
    : "Projet créé, mais l'image de couverture n'a pas été envoyée : renvoie-la depuis sa page.";
  return uploadFailureMessage(warning, error);
}
