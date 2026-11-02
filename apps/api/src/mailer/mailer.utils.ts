const HTML_ESCAPES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
};

export function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (char) => HTML_ESCAPES[char]);
}

/** `camille@example.com` → `c***@example.com` : assez pour diagnostiquer un domaine, pas pour identifier. */
export function maskEmail(address: string): string {
  const at = address.lastIndexOf('@');
  if (at === -1) return '***';
  return `${address.slice(0, Math.min(at, 1))}***${address.slice(at)}`;
}
