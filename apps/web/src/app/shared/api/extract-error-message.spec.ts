import { extractErrorMessage } from './extract-error-message';

describe('extractErrorMessage', () => {
  it('renvoie le message d’une instance Error', () => {
    expect(extractErrorMessage(new Error('boom'))).toBe('boom');
  });

  it('renvoie le message d’erreur API (error.message)', () => {
    expect(extractErrorMessage({ error: { message: 'Quota dépassé' } })).toBe('Quota dépassé');
  });

  it('joint et dédoublonne un message d’erreur API en tableau (validation)', () => {
    expect(
      extractErrorMessage({
        error: { message: ['file is required', 'file is required', 'too large'] },
      }),
    ).toBe('file is required; too large');
  });

  it('renvoie le défaut pour une erreur sans forme connue', () => {
    expect(extractErrorMessage(null)).toBe('Erreur inconnue');
    expect(extractErrorMessage('oops')).toBe('Erreur inconnue');
    expect(extractErrorMessage({ error: {} })).toBe('Erreur inconnue');
  });
});
