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
      { position: 2, reason: 'unknown', found: 'O' },
      '2ᵉ position, «\u00a0O\u00a0»\u00a0: dépouille inconnue.',
    ],
    [
      { position: 3, reason: 'unknown', found: 'P' },
      '3ᵉ position, «\u00a0P\u00a0»\u00a0: classe de tolérance inconnue.',
    ],
    [
      { position: 4, reason: 'unknown', found: 'Z' },
      '4ᵉ position, «\u00a0Z\u00a0»\u00a0: fixation inconnue.',
    ],
    [
      { position: 5, reason: 'unknown', found: '99' },
      '5ᵉ position, «\u00a099\u00a0»\u00a0: taille inconnue pour cette forme.',
    ],
    [
      { position: 6, reason: 'unknown', found: 'S1' },
      '6ᵉ position, «\u00a0S1\u00a0»\u00a0: épaisseur inconnue.',
    ],
    [
      { position: 7, reason: 'unknown', found: 'V3' },
      '7ᵉ position, «\u00a0V3\u00a0»\u00a0: rayon de bec inconnu.',
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
    [
      { position: 7, reason: 'missing', found: '0' },
      'Code incomplet\u00a0: il manque la 7ᵉ position (rayon de bec).',
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
