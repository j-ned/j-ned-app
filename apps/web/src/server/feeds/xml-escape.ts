const XML_ENTITIES: Readonly<Record<string, string>> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&apos;',
};

export const escapeXml = (text: string): string =>
  text.replace(/[&<>"']/g, (char) => XML_ENTITIES[char] ?? char);
