const MAX_LENGTH = 300;

export function apiErrorMessage(err: unknown): string | null {
  const raw = (err as { error?: { message?: unknown } } | null)?.error?.message;
  const parts = (Array.isArray(raw) ? raw : [raw])
    .filter((part): part is string => typeof part === 'string')
    .map((part) => part.replace(/\s+/g, ' ').trim())
    .filter((part) => part !== '');
  const message = [...new Set(parts)].join('; ');
  if (message === '') return null;
  return message.length > MAX_LENGTH ? `${message.slice(0, MAX_LENGTH - 1)}…` : message;
}
