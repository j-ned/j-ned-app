import type { InsertCodeError, InsertCodePosition } from '../domain/models/insert-code.model';

const POSITION_NAMES: Readonly<Record<InsertCodePosition, string>> = {
  1: 'forme',
  2: 'dépouille',
  3: 'classe de tolérance',
  4: 'fixation',
  5: 'taille',
  6: 'épaisseur',
  7: 'rayon de bec',
};

const UNKNOWN: Readonly<Record<InsertCodePosition, string>> = {
  1: 'forme inconnue',
  2: 'dépouille inconnue',
  3: 'classe de tolérance inconnue',
  4: 'fixation inconnue',
  5: 'taille inconnue pour cette forme',
  6: 'épaisseur inconnue',
  7: 'rayon de bec inconnu',
};

const ordinal = (position: InsertCodePosition): string => (position === 1 ? '1re' : `${position}ᵉ`);

const quoted = (value: string): string => `«\u00a0${value}\u00a0»`;

export function insertCodeErrorMessage({ position, reason, found }: InsertCodeError): string {
  switch (reason) {
    case 'ansi':
      return `${quoted(found)} est une taille en pouces (code ANSI)\u00a0: ce décodeur ne lit que le code ISO métrique.`;
    case 'missing':
      return position === 1
        ? 'Tape un code de plaquette, par exemple CNMG 120408.'
        : `Code incomplet\u00a0: il manque la ${ordinal(position)} position (${POSITION_NAMES[position]}).`;
    case 'unknown':
      return `${ordinal(position)} position, ${quoted(found)}\u00a0: ${UNKNOWN[position]}.`;
  }
}
