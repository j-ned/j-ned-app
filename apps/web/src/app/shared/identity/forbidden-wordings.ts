type ForbiddenWording = { readonly label: string; readonly pattern: RegExp };

export const FORBIDDEN_WORDINGS: readonly ForbiddenWording[] = [
  { label: '20 ans', pattern: /(?<!\d)20\s+ans\b/iu },
  { label: 'vingt ans', pattern: /vingt\s+ans\b/iu },
  { label: 'métallurgie', pattern: /m[eé]tallurgie/iu },
];
