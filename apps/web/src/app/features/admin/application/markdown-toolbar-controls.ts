import type { InlineFormat, LinePrefix, MarkdownAction } from './markdown-edit';

type ToolbarTool = {
  readonly id: string;
  readonly label: string;
  readonly icon: string;
  readonly key: string | null;
  // null : le bouton ouvre le panneau d'image, l'action arrive avec l'image envoyée.
  readonly action: MarkdownAction | null;
  readonly applied: string;
  readonly removed: string;
};

const inline = (
  format: InlineFormat,
  label: string,
  icon: string,
  key: string | null,
): ToolbarTool => ({
  id: format,
  label,
  icon,
  key,
  action: { kind: 'inline', format },
  applied: `${label} appliqué`,
  removed: `${label} retiré`,
});

const linePrefix = (prefix: LinePrefix, label: string, icon: string): ToolbarTool => ({
  id: prefix,
  label,
  icon,
  key: null,
  action: { kind: 'line-prefix', prefix },
  applied: `${label} appliquée`,
  removed: `${label} retirée`,
});

const insertion = (
  id: 'link' | 'image' | 'code-block' | 'rule',
  label: string,
  icon: string,
  key: string | null,
  inserted: string,
): ToolbarTool => ({
  id,
  label,
  icon,
  key,
  action: id === 'image' ? null : { kind: id },
  applied: inserted,
  removed: inserted,
});

export const TOOLBAR_TOOLS: readonly ToolbarTool[] = [
  inline('bold', 'Gras', 'bold', 'b'),
  inline('italic', 'Italique', 'italic', 'i'),
  inline('underline', 'Souligné', 'underline', 'u'),
  inline('strikethrough', 'Barré', 'strikethrough', null),
  inline('inline-code', 'Code en ligne', 'code', 'e'),
  insertion('link', 'Lien', 'link', 'k', 'Lien inséré'),
  insertion('image', 'Image', 'image', null, 'Image insérée'),
  linePrefix('bullet-list', 'Liste à puces', 'list-ul'),
  linePrefix('ordered-list', 'Liste numérotée', 'list-ol'),
  linePrefix('quote', 'Citation', 'quote-left'),
  insertion('code-block', 'Bloc de code', 'file-code', null, 'Bloc de code inséré'),
  insertion('rule', 'Séparateur', 'minus', null, 'Séparateur inséré'),
];

export function toolbarToolOf(action: MarkdownAction): ToolbarTool | undefined {
  const id =
    action.kind === 'inline'
      ? action.format
      : action.kind === 'line-prefix'
        ? action.prefix
        : action.kind;
  return TOOLBAR_TOOLS.find((tool) => tool.id === id);
}
