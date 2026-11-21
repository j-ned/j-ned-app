import { HttpErrorResponse } from '@angular/common/http';
import { apiErrorMessage } from '@shared/api/api-error-message';
import { UploadRejectedError } from '@shared/upload/upload-rejected-error';

const NETWORK_CUT =
  "La connexion a été coupée pendant l'envoi\u00a0: vérifie ton réseau, puis réessaie.";
const TOO_LARGE = 'Le fichier dépasse 4\u00a0Mo, la taille maximale acceptée.';
const UNREADABLE =
  "Le format n'est pas pris en charge ou le fichier est illisible\u00a0: choisis une image JPEG, PNG, WebP ou AVIF.";
const THROTTLED = "Trop d'envois en peu de temps\u00a0: patiente une minute, puis réessaie.";
// Un proxy placé devant l'API peut refuser un envoi trop lourd, avec un corps en texte brut (`IMAGE_UPLOAD_TARGET_BYTES`).
const PLATFORM_REFUSED =
  "L'hébergeur a refusé le fichier, sans doute trop lourd\u00a0: réduis-le sous 900\u00a0Ko, puis réessaie.";
const SERVER_ERROR = 'Le serveur a rencontré un problème\u00a0: réessaie dans un instant.';
const RETRY = 'Réessaie.';

const asSentence = (text: string): string => (/[.!?…]$/.test(text) ? text : `${text}.`);

export type UploadFailureWording = {
  readonly unreadable?: string;
  readonly platformRefused?: string;
};

function detailOf(error: unknown, wording: UploadFailureWording): string {
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
      return explained ? asSentence(explained) : (wording.unreadable ?? UNREADABLE);
    case 429:
      return THROTTLED;
    case 503:
      return explained ? asSentence(explained) : (wording.platformRefused ?? PLATFORM_REFUSED);
    default:
      return error.status >= 500 ? SERVER_ERROR : RETRY;
  }
}

// `label` est une phrase complète : la suite du message y ajoute le pourquoi et quoi faire.
export function uploadFailureMessage(
  label: string,
  error: unknown,
  wording: UploadFailureWording = {},
): string {
  return `${label} ${detailOf(error, wording)}`;
}
