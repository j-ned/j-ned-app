import { HttpErrorResponse } from '@angular/common/http';
import { apiRejection } from '@shared/testing/api-rejection';
import { uploadFailureMessage } from './upload-failure-message';
import { UploadRejectedError } from '@shared/upload/upload-rejected-error';

const LABEL = "Le portrait n'a pas pu être remplacé.";

// Refus de la plateforme, avant l'API : corps en texte brut, pas le JSON d'erreur de l'API.
const platformRefusal = (status: number): HttpErrorResponse =>
  new HttpErrorResponse({
    status,
    url: '/api/profile/portrait',
    error: 'The deployment is currently unavailable\n\nSERVICE_UNAVAILABLE\n\ncdg1::abc\n',
  });

describe('uploadFailureMessage', () => {
  it.each([
    {
      given: 'a file the browser could not bring under the target',
      error: new UploadRejectedError("L'image dépasse 900\u00a0Ko, même compressée."),
      expected: `${LABEL} L'image dépasse 900\u00a0Ko, même compressée.`,
    },
    {
      given: 'a request cut by the network',
      error: new HttpErrorResponse({ status: 0, url: '/api/profile/portrait' }),
      expected: `${LABEL} La connexion a été coupée pendant l'envoi\u00a0: vérifiez votre réseau, puis réessayez.`,
    },
    {
      given: 'a 413 from the API',
      error: apiRejection(413, 'File too large'),
      expected: `${LABEL} Le fichier dépasse 4\u00a0Mo, la taille maximale acceptée.`,
    },
    {
      given: 'a 400 explained by the API',
      error: apiRejection(400, 'file must be an image'),
      expected: `${LABEL} file must be an image.`,
    },
    {
      given: 'a 422 explained by the API',
      error: apiRejection(422, 'Image illisible : fichier corrompu ou format non supporté'),
      expected: `${LABEL} Image illisible : fichier corrompu ou format non supporté.`,
    },
    {
      given: 'a 422 without explanation',
      error: apiRejection(422),
      expected: `${LABEL} Le format n'est pas pris en charge ou le fichier est illisible\u00a0: choisissez une image JPEG, PNG, WebP ou AVIF.`,
    },
    {
      given: 'a 429',
      error: apiRejection(429, 'Too Many Requests'),
      expected: `${LABEL} Trop d'envois en peu de temps\u00a0: patientez une minute, puis réessayez.`,
    },
    {
      given: 'a 503 explained by the API (profile locked)',
      error: apiRejection(
        503,
        'Le parcours est en cours de modification : réessayez dans quelques secondes',
      ),
      expected: `${LABEL} Le parcours est en cours de modification : réessayez dans quelques secondes.`,
    },
    {
      given: 'a 503 from the hosting platform, before the API',
      error: platformRefusal(503),
      expected: `${LABEL} L'hébergeur a refusé le fichier, sans doute trop lourd\u00a0: réduisez-le sous 900\u00a0Ko, puis réessayez.`,
    },
    {
      given: 'another server error',
      error: apiRejection(500, 'Internal Server Error'),
      expected: `${LABEL} Le serveur a rencontré un problème\u00a0: réessayez dans un instant.`,
    },
    {
      given: 'an unknown failure',
      error: new Error('boom'),
      expected: `${LABEL} Réessayez.`,
    },
  ])(
    'Given $given When the failure is described Then it says what happened and what to do',
    ({ error, expected }) => {
      expect(uploadFailureMessage(LABEL, error)).toBe(expected);
    },
  );
});
