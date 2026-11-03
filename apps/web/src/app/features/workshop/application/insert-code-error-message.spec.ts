import { describe, expect, it } from 'vitest';
import type { InsertCodeError } from '../domain/models/insert-code.model';
import { insertCodeErrorMessage } from './insert-code-error-message';

describe('insertCodeErrorMessage', () => {
  it.each<[InsertCodeError, string]>([
    [
      { position: 1, reason: 'unknown', found: 'X' },
      '1re position, «\u00a0X\u00a0»\u00a0: forme inconnue.',
    ],
    [
      { position: 5, reason: 'unknown', found: '99' },
      '5ᵉ position, «\u00a099\u00a0»\u00a0: taille inconnue pour cette forme.',
    ],
  ])(
    'Given an unknown value %o When explained Then the message names the position and the value',
    (error, message) => {
      expect(insertCodeErrorMessage(error)).toBe(message);
    },
  );

  it.each<[InsertCodeError, string]>([
    [
      { position: 1, reason: 'missing', found: '' },
      'Tape un code de plaquette, par exemple CNMG 120408.',
    ],
    [
      { position: 4, reason: 'missing', found: '' },
      'Code incomplet\u00a0: il manque la 4ᵉ position (fixation).',
    ],
  ])(
    'Given a code cut short %o When explained Then the message names the missing position',
    (error, message) => {
      expect(insertCodeErrorMessage(error)).toBe(message);
    },
  );

  it('Given an inch code When explained Then the message says it is ANSI, which this decoder does not read', () => {
    expect(insertCodeErrorMessage({ position: 5, reason: 'ansi', found: '432' })).toBe(
      '«\u00a0432\u00a0» est une taille en pouces (code ANSI)\u00a0: ce décodeur ne lit que le code ISO métrique.',
    );
  });
});
