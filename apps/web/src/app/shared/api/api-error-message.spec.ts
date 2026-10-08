import { HttpErrorResponse } from '@angular/common/http';
import { apiRejection } from '@shared/testing/api-rejection';
import { apiErrorMessage } from './api-error-message';

describe('apiErrorMessage', () => {
  it.each([
    {
      given: 'a string message',
      err: apiRejection(400, 'Quota dépassé'),
      expected: 'Quota dépassé',
    },
    {
      given: 'an array of messages',
      err: apiRejection(400, [
        'pitch must be shorter than or equal to 160 characters',
        'title should not be empty',
      ]),
      expected: 'pitch must be shorter than or equal to 160 characters; title should not be empty',
    },
    {
      given: 'an array with duplicates',
      err: apiRejection(400, [
        'title should not be empty',
        'slug is taken',
        'title should not be empty',
      ]),
      expected: 'title should not be empty; slug is taken',
    },
    {
      given: 'a plain error body',
      err: { error: { message: 'Quota dépassé' } },
      expected: 'Quota dépassé',
    },
    { given: 'an empty object', err: {}, expected: null },
    { given: 'a body without message', err: { error: {} }, expected: null },
    { given: 'an empty array', err: apiRejection(400, []), expected: null },
    { given: 'a blank message', err: apiRejection(400, '   '), expected: null },
    {
      given: 'an HttpErrorResponse without body',
      err: new HttpErrorResponse({ status: 0 }),
      expected: null,
    },
    { given: 'an Error', err: new Error('boom'), expected: null },
    { given: 'null', err: null, expected: null },
    { given: 'a string', err: 'oops', expected: null },
  ])('Given $given When it is read Then it gives $expected', ({ err, expected }) => {
    expect(apiErrorMessage(err)).toBe(expected);
  });

  it('Given an array with blank and non-string items When it is read Then only the texts are kept', () => {
    const err = { error: { message: ['', 'title should not be empty', 42, null, '  '] } };

    expect(apiErrorMessage(err)).toBe('title should not be empty');
  });

  it('Given a message spread over lines When it is read Then its whitespace is collapsed to single spaces', () => {
    expect(apiErrorMessage(apiRejection(400, '  title\n\tshould   not be empty '))).toBe(
      'title should not be empty',
    );
  });

  it('Given a very long message When it is read Then it is cut to 300 characters ending with an ellipsis', () => {
    const message = apiErrorMessage(apiRejection(400, 'x'.repeat(1000)));

    expect({ length: message?.length, end: message?.slice(-1) }).toEqual({ length: 300, end: '…' });
  });
});
