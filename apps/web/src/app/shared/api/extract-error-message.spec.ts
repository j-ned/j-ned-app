import { extractErrorMessage } from './extract-error-message';

describe('extractErrorMessage', () => {
  it('renvoie le message d’une instance Error', () => {
    expect(extractErrorMessage(new Error('boom'))).toBe('boom');
  });

  it('renvoie le message d’erreur API (error.message)', () => {
    expect(extractErrorMessage({ error: { message: 'Quota dépassé' } })).toBe('Quota dépassé');
  });

  it('renvoie le défaut pour une erreur sans forme connue', () => {
    expect(extractErrorMessage(null)).toBe('Erreur inconnue');
    expect(extractErrorMessage('oops')).toBe('Erreur inconnue');
    expect(extractErrorMessage({ error: {} })).toBe('Erreur inconnue');
  });
});
