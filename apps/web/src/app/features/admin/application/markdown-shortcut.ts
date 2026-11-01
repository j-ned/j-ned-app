import type { MarkdownAction } from './markdown-edit';
import { TOOLBAR_TOOLS } from './markdown-toolbar-controls';

type ShortcutKeys = Pick<KeyboardEvent, 'key' | 'ctrlKey' | 'metaKey' | 'altKey' | 'shiftKey'>;

// Alt refusé : Ctrl+Alt est AltGr sur les dispositions européennes, qui saisit un caractère.
export function shortcutAction({
  key,
  ctrlKey,
  metaKey,
  altKey,
  shiftKey,
}: ShortcutKeys): MarkdownAction | null {
  if (altKey || shiftKey || !(ctrlKey || metaKey)) return null;
  return TOOLBAR_TOOLS.find((tool) => tool.key === key.toLowerCase())?.action ?? null;
}
