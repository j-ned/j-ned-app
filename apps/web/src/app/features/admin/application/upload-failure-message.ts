import { HttpErrorResponse } from '@angular/common/http';
import { apiErrorMessage } from '@shared/api/api-error-message';
import { UploadRejectedError } from '@shared/upload/upload-rejected-error';

const NETWORK_CUT =
  "La connexion a été coupée pendant l'envoi\u00a0: vérifiez votre réseau, puis réessayez.";
const TOO_LARGE = 'Le fichier dépasse 4\u00a0Mo, la taille maximale acceptée.';
const UNREADABLE =
  "Le format n'est pas pris en charge ou le fichier est illisible\u00a0: choisissez une image JPEG, PNG, WebP ou AVIF.";
const THROTTLED = "Trop d'envois en peu de temps\u00a0: patientez une minute, puis réessayez.";
// Un proxy placé devant l'API peut refuser un envoi trop lourd, avec un corps en texte brut (`IMAGE_UPLOAD_TARGET_BYTES`).
const PLATFORM_REFUSED =
  "L'hébergeur a refusé le fichier, sans doute trop lourd\u00a0: réduisez-le sous 900\u00a0Ko, puis réessayez.";
const SERVER_ERROR = 'Le serveur a rencontré un problème\u00a0: réessayez dans un instant.';
const RETRY = 'Réessayez.';

const asSentence = (text: string): string => (/[.!?…]$/.test(text) ? text : `${text}.`);

function detailOf(error: unknown): string {
  if (error instanceof UploadRejectedError) return error.message;
  if (!(error instanceof HttpErrorResponse)) return RETRY;
  const explained = apiErrorMessage(error);
  switch (error.status) {
    case 0:
      return NETWORK_CUT;
    case 413:
      return TOO_LARGE;
    case 400:
      return explained ? asSentence(explained) : RETRY;
    case 422:
      return explained ? asSentence(explained) : UNREADABLE;
    case 429:
      return THROTTLED;
    case 503:
      return explained ? asSentence(explained) : PLATFORM_REFUSED;
    default:
      return error.status >= 500 ? SERVER_ERROR : RETRY;
  }
}

/**
 * Message d'un envoi de fichier en échec : `label` (une phrase complète) dit ce qui n'a pas abouti, la
 * suite dit pourquoi et quoi faire. Le motif donné par l'API passe tel quel quand il existe.
 */
export function uploadFailureMessage(label: string, error: unknown): string {
  return `${label} ${detailOf(error)}`;
}
