import { HttpErrorResponse } from '@angular/common/http';
import { apiRejection } from '@shared/testing/api-rejection';
import { withValidationDetail } from './with-validation-detail';

const LABEL = 'Erreur lors de la mise à jour du projet';

describe('withValidationDetail', () => {
  it.each([
    {
      given: 'a 400 with an array',
      err: apiRejection(400, [
        'pitch must be shorter than or equal to 160 characters',
        'title should not be empty',
      ]),
      expected: `${LABEL}\u00a0: pitch must be shorter than or equal to 160 characters; title should not be empty`,
    },
    {
      given: 'a 422 with a string',
      err: apiRejection(422, 'slug already exists'),
      expected: `${LABEL}\u00a0: slug already exists`,
    },
    { given: 'a 400 without body', err: apiRejection(400), expected: LABEL },
  ])(
    'Given $given When the label is completed Then it reads « $expected »',
    ({ err, expected }) => {
      expect(withValidationDetail(LABEL, err)).toBe(expected);
    },
  );

  it('Given a label that ends a sentence When a 400 is completed Then the detail starts a new sentence', () => {
    const label = "Projet créé, mais l'envoi de l'image a échoué. Réessayez depuis sa page.";

    expect(withValidationDetail(label, apiRejection(400, 'file must be an image'))).toBe(
      `${label} Détail\u00a0: file must be an image`,
    );
  });

  it.each([
    {
      given: 'a 500 with a message',
      err: apiRejection(500, 'Internal server error'),
      expected: LABEL,
    },
    {
      given: 'a 403 with a message',
      err: apiRejection(403, 'Forbidden resource'),
      expected: LABEL,
    },
    { given: 'a network failure', err: new HttpErrorResponse({ status: 0 }), expected: LABEL },
    { given: 'an Error', err: new Error('boom'), expected: LABEL },
    {
      given: 'a plain 400-like body',
      err: { status: 400, error: { message: 'x' } },
      expected: LABEL,
    },
  ])(
    'Given $given When the label is completed Then it reads « $expected »',
    ({ err, expected }) => {
      expect(withValidationDetail(LABEL, err)).toBe(expected);
    },
  );
});
