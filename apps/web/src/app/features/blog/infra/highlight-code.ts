import hljs from 'highlight.js/lib/core';
import bash from 'highlight.js/lib/languages/bash';
import css from 'highlight.js/lib/languages/css';
import dockerfile from 'highlight.js/lib/languages/dockerfile';
import javascript from 'highlight.js/lib/languages/javascript';
import json from 'highlight.js/lib/languages/json';
import markdown from 'highlight.js/lib/languages/markdown';
import python from 'highlight.js/lib/languages/python';
import scss from 'highlight.js/lib/languages/scss';
import sql from 'highlight.js/lib/languages/sql';
import typescript from 'highlight.js/lib/languages/typescript';
import xml from 'highlight.js/lib/languages/xml';
import yaml from 'highlight.js/lib/languages/yaml';
import type { LanguageFn } from 'highlight.js';
import type { CodeLanguageId } from '../domain/code-language';

const GRAMMARS = {
  typescript,
  javascript,
  html: xml,
  css,
  scss,
  json,
  bash,
  sql,
  yaml,
  markdown,
  dockerfile,
  python,
} satisfies Record<CodeLanguageId, LanguageFn>;

for (const [id, grammar] of Object.entries(GRAMMARS)) hljs.registerLanguage(id, grammar);

export function highlightCode(code: string, language: CodeLanguageId): string {
  // Sans `ignoreIllegals`, un seul caractère inattendu rend tout le bloc en texte brut.
  return hljs.highlight(code, { language, ignoreIllegals: true }).value;
}
