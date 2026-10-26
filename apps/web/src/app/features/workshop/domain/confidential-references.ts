const WORD_START = '(?<![\\p{L}\\p{N}])';

const REFERENCE_PATTERNS: readonly string[] = [
  `${WORD_START}P/N\\s*[\\p{L}\\p{N}-]+`,
  `${WORD_START}PN\\s*:\\s*[\\p{L}\\p{N}-]+`,
  `${WORD_START}[Rr]éf\\.\\s*(?:pièce|plan|client)`,
  `${WORD_START}[Pp]lan\\s+n°\\s*\\d+`,
  `${WORD_START}[Nn]°\\s+de\\s+plan`,
  `${WORD_START}OF\\s+n°\\s*\\d+`,
  `${WORD_START}[Ii]ndice\\s+[A-Z0-9](?![\\p{L}\\p{N}])`,
  '(?<!\\d)\\d{5,}(?!\\d)',
];

const CONFIDENTIAL_REFERENCE = new RegExp(REFERENCE_PATTERNS.join('|'), 'gu');

export function findConfidentialReferences(text: string): readonly string[] {
  return Array.from(text.matchAll(CONFIDENTIAL_REFERENCE), ([fragment]) => fragment);
}
