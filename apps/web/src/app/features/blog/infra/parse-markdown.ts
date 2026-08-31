import { marked } from 'marked';

marked.setOptions({ gfm: true, breaks: false });

export function parseMarkdown(markdown: string): string {
  return marked.parse(markdown, { async: false }) as string;
}
