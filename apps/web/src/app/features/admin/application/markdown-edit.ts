export type TextSelection = { readonly start: number; readonly end: number };
export type InlineFormat = 'bold' | 'italic' | 'underline' | 'strikethrough' | 'inline-code';
export type BlockLevel = 'paragraph' | 'h2' | 'h3' | 'h4';
export type LinePrefix = 'bullet-list' | 'ordered-list' | 'quote';
export type MarkdownAction =
  | { readonly kind: 'inline'; readonly format: InlineFormat }
  | { readonly kind: 'block-level'; readonly level: BlockLevel }
  | { readonly kind: 'line-prefix'; readonly prefix: LinePrefix }
  | { readonly kind: 'link' }
  | { readonly kind: 'code-block' }
  | { readonly kind: 'rule' }
  | { readonly kind: 'image'; readonly alt: string; readonly url: string };
export type MarkdownEdit = {
  readonly from: number;
  readonly to: number;
  readonly text: string;
  readonly selection: TextSelection;
  readonly removed: boolean;
};

type Markers = { readonly open: string; readonly close: string };

const MARKERS: Readonly<Record<InlineFormat, Markers>> = {
  bold: { open: '**', close: '**' },
  italic: { open: '*', close: '*' },
  underline: { open: '<u>', close: '</u>' },
  strikethrough: { open: '~~', close: '~~' },
  'inline-code': { open: '`', close: '`' },
};

// Gras et italique partagent l'astérisque : une suite de 3 porte les deux.
const STAR_RUNS: Readonly<
  Partial<Record<InlineFormat, (before: number, after: number) => boolean>>
> = {
  bold: (before, after) => before >= 2 && after >= 2,
  italic: (before, after) => before % 2 === 1 && after % 2 === 1,
};

const LEVEL_PREFIX: Readonly<Record<BlockLevel, string>> = {
  paragraph: '',
  h2: '## ',
  h3: '### ',
  h4: '#### ',
};

const HEADING_PREFIX = /^(#{1,6}) /;

const LINE_PREFIX: Readonly<Record<LinePrefix, RegExp>> = {
  'bullet-list': /^- /,
  'ordered-list': /^\d+\. /,
  quote: /^> /,
};

// Une liste remplace l'autre ; la citation se pose devant une liste sans la retirer.
const LIST_PREFIX = /^(?:- |\d+\. )/;

export function markdownEdit(
  text: string,
  selection: TextSelection,
  action: MarkdownAction,
): MarkdownEdit {
  switch (action.kind) {
    case 'inline':
      return inlineEdit(text, selection, action.format);
    case 'block-level':
      return blockLevelEdit(text, selection, action.level);
    case 'line-prefix':
      return linePrefixEdit(text, selection, action.prefix);
    case 'link':
      return linkEdit(text, selection);
    case 'code-block':
      return codeBlockEdit(text, selection);
    case 'rule':
      return ownParagraph(text, selection, '---');
    case 'image':
      return ownParagraph(text, selection, `![${escapedAlt(action.alt)}](${action.url})`);
  }
}

export function blockLevelAt(text: string, caret: number): BlockLevel | null {
  const { start, end } = lineAround(text, caret);
  const hashes = HEADING_PREFIX.exec(text.slice(start, end))?.[1].length ?? 0;
  if (hashes === 0) return 'paragraph';
  if (hashes === 2) return 'h2';
  if (hashes === 3) return 'h3';
  if (hashes === 4) return 'h4';
  return null;
}

function inlineEdit(text: string, selection: TextSelection, format: InlineFormat): MarkdownEdit {
  const selected = text.slice(selection.start, selection.end);
  return selected.includes('\n')
    ? multiLineInlineEdit(selected, selection.start, format)
    : singleLineInlineEdit(text, trimmed(text, selection), format);
}

function singleLineInlineEdit(
  text: string,
  range: TextSelection,
  format: InlineFormat,
): MarkdownEdit {
  const inner = text.slice(range.start, range.end);
  const { open, close } = MARKERS[format];
  if (formatAround(text.slice(0, range.start), text.slice(range.end), format)) {
    return replaced(range.start - open.length, range.end + close.length, inner, true);
  }
  if (formatInside(inner, format)) {
    return replaced(range.start, range.end, unwrapped(inner, format), true);
  }
  const start = range.start + open.length;
  return {
    from: range.start,
    to: range.end,
    text: wrapped(inner, format),
    selection: { start, end: start + inner.length },
    removed: false,
  };
}

function replaced(from: number, to: number, text: string, removed: boolean): MarkdownEdit {
  return { from, to, text, selection: { start: from, end: from + text.length }, removed };
}

function multiLineInlineEdit(selected: string, offset: number, format: InlineFormat): MarkdownEdit {
  const lines = selected.split('\n');
  const remove = lines
    .map((line) => line.trim())
    .filter((content) => content !== '')
    .every((content) => formatInside(content, format));
  const block = lines
    .map((line) => {
      const content = line.trim();
      if (content === '' || formatInside(content, format) !== remove) return line;
      const lead = line.slice(0, line.indexOf(content));
      const tail = line.slice(lead.length + content.length);
      return `${lead}${remove ? unwrapped(content, format) : wrapped(content, format)}${tail}`;
    })
    .join('\n');
  return replaced(offset, offset + selected.length, block, remove);
}

function formatAround(before: string, after: string, format: InlineFormat): boolean {
  const starRuns = STAR_RUNS[format];
  if (starRuns) return starRuns(trailingStars(before), leadingStars(after));
  const { open, close } = MARKERS[format];
  return before.endsWith(open) && after.startsWith(close);
}

function formatInside(content: string, format: InlineFormat): boolean {
  const { open, close } = MARKERS[format];
  if (content.length <= open.length + close.length) return false;
  const starRuns = STAR_RUNS[format];
  if (starRuns) return starRuns(leadingStars(content), trailingStars(content));
  return content.startsWith(open) && content.endsWith(close);
}

function wrapped(content: string, format: InlineFormat): string {
  const { open, close } = MARKERS[format];
  return `${open}${content}${close}`;
}

function unwrapped(content: string, format: InlineFormat): string {
  const { open, close } = MARKERS[format];
  return content.slice(open.length, -close.length);
}

function trimmed(text: string, { start, end }: TextSelection): TextSelection {
  let from = start;
  let to = end;
  while (from < to && /\s/.test(text[from])) from++;
  while (to > from && /\s/.test(text[to - 1])) to--;
  return { start: from, end: to };
}

const leadingStars = (value: string): number => /^\**/.exec(value)?.[0].length ?? 0;
const trailingStars = (value: string): number => /\**$/.exec(value)?.[0].length ?? 0;

function blockLevelEdit(text: string, selection: TextSelection, level: BlockLevel): MarkdownEdit {
  const prefix = LEVEL_PREFIX[level];
  const removed = level === 'paragraph';
  if (selection.start === selection.end) {
    return caretLineEdit(text, selection.start, HEADING_PREFIX, prefix, removed);
  }

  const { start, end } = touchedLines(text, selection);
  const block = text
    .slice(start, end)
    .split('\n')
    .map((line) => (line.trim() === '' ? line : `${prefix}${line.replace(HEADING_PREFIX, '')}`))
    .join('\n');
  return replaced(start, end, block, removed);
}

function linePrefixEdit(text: string, selection: TextSelection, prefix: LinePrefix): MarkdownEdit {
  const own = LINE_PREFIX[prefix];
  if (selection.start === selection.end) {
    const { start, end } = lineAround(text, selection.start);
    const remove = own.test(text.slice(start, end));
    return remove
      ? caretLineEdit(text, selection.start, own, '', true)
      : caretLineEdit(text, selection.start, strippedBy(prefix), lineMarker(prefix, 1), false);
  }

  const { start, end } = touchedLines(text, selection);
  const lines = text.slice(start, end).split('\n');
  const filled = (line: string): boolean => line.trim() !== '';
  const remove = lines.filter(filled).every((line) => own.test(line));
  const block = lines
    .map((line, index) => {
      if (!filled(line)) return line;
      if (remove) return line.replace(own, '');
      const rank = lines.slice(0, index).filter(filled).length + 1;
      return `${lineMarker(prefix, rank)}${line.replace(strippedBy(prefix), '')}`;
    })
    .join('\n');
  return replaced(start, end, block, remove);
}

const strippedBy = (prefix: LinePrefix): RegExp =>
  prefix === 'quote' ? LINE_PREFIX.quote : LIST_PREFIX;

const lineMarker = (prefix: LinePrefix, rank: number): string =>
  prefix === 'bullet-list' ? '- ' : prefix === 'ordered-list' ? `${rank}. ` : '> ';

// Le curseur suit son texte ; placé dans l'ancien préfixe, il va au début du texte.
function caretLineEdit(
  text: string,
  caret: number,
  oldPrefix: RegExp,
  marker: string,
  removed: boolean,
): MarkdownEdit {
  const { start, end } = lineAround(text, caret);
  const line = text.slice(start, end);
  const old = oldPrefix.exec(line)?.[0].length ?? 0;
  const at = start + marker.length + Math.max(caret - start - old, 0);
  return {
    from: start,
    to: end,
    text: `${marker}${line.slice(old)}`,
    selection: { start: at, end: at },
    removed,
  };
}

function linkEdit(text: string, selection: TextSelection): MarkdownEdit {
  const range = trimmed(text, selection);
  const label = text.slice(range.start, range.end);
  const address = range.start + label.length + 3;
  return {
    from: range.start,
    to: range.end,
    text: `[${label}](https://)`,
    selection: label
      ? { start: address, end: address + 'https://'.length }
      : { start: range.start + 1, end: range.start + 1 },
    removed: false,
  };
}

// Paragraphe propre : une ligne vide sépare le bloc de ses voisins, sans en ajouter une de trop.
function ownParagraph(
  text: string,
  selection: TextSelection,
  block: string,
  selected: TextSelection = { start: block.length, end: block.length },
): MarkdownEdit {
  const before = text.slice(0, selection.start);
  const after = text.slice(selection.end);
  const lead = separator(before.endsWith('\n\n') || before === '', before.endsWith('\n'));
  const trail = separator(after.startsWith('\n\n') || after === '', after.startsWith('\n'));
  const offset = selection.start + lead.length;
  return {
    from: selection.start,
    to: selection.end,
    text: `${lead}${block}${trail}`,
    selection: { start: offset + selected.start, end: offset + selected.end },
    removed: false,
  };
}

const separator = (separated: boolean, oneNewline: boolean): string =>
  separated ? '' : oneNewline ? '\n' : '\n\n';

// `ts` sélectionné : la frappe suivante choisit le langage.
function codeBlockEdit(text: string, selection: TextSelection): MarkdownEdit {
  const code = text.slice(selection.start, selection.end);
  return ownParagraph(text, selection, ['```ts', code, '```'].join('\n'), { start: 3, end: 5 });
}

// marked interprète `\`, `[`, `]` et l'emphase dans le texte alternatif : échappé, il reste tel que saisi.
const escapedAlt = (alt: string): string =>
  alt
    .replace(/\r?\n/g, ' ')
    .trim()
    .replace(/[\\[\]*_`]/g, '\\$&');

// Une sélection qui finit juste après un saut de ligne n'entraîne pas la ligne suivante.
function touchedLines(text: string, selection: TextSelection): TextSelection {
  const last =
    selection.end > selection.start && text[selection.end - 1] === '\n'
      ? selection.end - 1
      : selection.end;
  return { start: lineAround(text, selection.start).start, end: lineAround(text, last).end };
}

function lineAround(text: string, caret: number): TextSelection {
  const start = caret === 0 ? 0 : text.lastIndexOf('\n', caret - 1) + 1;
  const newline = text.indexOf('\n', caret);
  return { start, end: newline === -1 ? text.length : newline };
}
