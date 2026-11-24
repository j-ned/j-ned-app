import { toBackupCodes } from './two-factor-enable.adapter';

describe('toBackupCodes', () => {
  it('Given the API answer, Then the backup codes come out in order', () => {
    expect(toBackupCodes({ backupCodes: ['a1b2-c3d4', 'e5f6-g7h8'] })).toEqual([
      'a1b2-c3d4',
      'e5f6-g7h8',
    ]);
  });

  // Une activation réussie sans codes lisibles laisserait l'administrateur sans recours : on échoue.
  it.each([
    ['no body', null],
    ['no backupCodes', { ok: true }],
    ['backupCodes not a list', { backupCodes: 'a1b2-c3d4' }],
    ['a code that is not a string', { backupCodes: ['a1b2-c3d4', 42] }],
    ['an empty list', { backupCodes: [] }],
  ])('Given %s, Then it is refused', (_, body) => {
    expect(() => toBackupCodes(body)).toThrow(TypeError);
  });
});
