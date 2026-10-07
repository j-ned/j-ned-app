import { shortcutAction } from './markdown-shortcut';

type Keys = Parameters<typeof shortcutAction>[0];

const keys = (key: string, overrides: Partial<Keys> = {}): Keys => ({
  key,
  ctrlKey: false,
  metaKey: false,
  altKey: false,
  shiftKey: false,
  ...overrides,
});

describe('shortcutAction', () => {
  it.each([
    { key: 'b', format: 'bold' },
    { key: 'i', format: 'italic' },
    { key: 'u', format: 'underline' },
    { key: 'e', format: 'inline-code' },
  ] as const)('Given Ctrl + $key Then the action is $format', ({ key, format }) => {
    expect(shortcutAction(keys(key, { ctrlKey: true }))).toEqual({ kind: 'inline', format });
  });

  it.each([
    { key: 'b', format: 'bold' },
    { key: 'i', format: 'italic' },
    { key: 'u', format: 'underline' },
    { key: 'e', format: 'inline-code' },
  ] as const)('Given ⌘ + $key Then the action is $format', ({ key, format }) => {
    expect(shortcutAction(keys(key, { metaKey: true }))).toEqual({ kind: 'inline', format });
  });

  it('Given Ctrl + B with caps lock on Then the action is still bold', () => {
    expect(shortcutAction(keys('B', { ctrlKey: true }))).toEqual({
      kind: 'inline',
      format: 'bold',
    });
  });

  it.each([
    { case: 'B alone', input: keys('b') },
    { case: 'Shift + B', input: keys('B', { shiftKey: true }) },
    { case: 'Ctrl + Shift + B', input: keys('B', { ctrlKey: true, shiftKey: true }) },
    { case: 'Ctrl + Alt + B (AltGr)', input: keys('b', { ctrlKey: true, altKey: true }) },
    { case: '⌘ + Alt + I', input: keys('i', { metaKey: true, altKey: true }) },
    { case: '⌘ + Shift + U', input: keys('U', { metaKey: true, shiftKey: true }) },
    { case: 'Alt + E', input: keys('e', { altKey: true }) },
    { case: 'Ctrl + S', input: keys('s', { ctrlKey: true }) },
    { case: 'Ctrl + Z', input: keys('z', { ctrlKey: true }) },
    { case: 'Ctrl + X', input: keys('x', { ctrlKey: true }) },
    { case: 'Ctrl alone', input: keys('Control', { ctrlKey: true }) },
  ])('Given $case Then no action is taken', ({ input }) => {
    expect(shortcutAction(input)).toBeNull();
  });
});

describe('shortcutAction: lien', () => {
  it.each([
    { case: 'Ctrl + K', input: keys('k', { ctrlKey: true }) },
    { case: '⌘ + K', input: keys('k', { metaKey: true }) },
    { case: 'Ctrl + K with caps lock on', input: keys('K', { ctrlKey: true }) },
  ])('Given $case Then the action inserts a link', ({ input }) => {
    expect(shortcutAction(input)).toEqual({ kind: 'link' });
  });

  it.each([
    { case: 'Ctrl + Shift + K', input: keys('K', { ctrlKey: true, shiftKey: true }) },
    { case: 'Ctrl + Alt + K (AltGr)', input: keys('k', { ctrlKey: true, altKey: true }) },
    { case: 'K alone', input: keys('k') },
  ])('Given $case Then no link is inserted', ({ input }) => {
    expect(shortcutAction(input)).toBeNull();
  });
});
