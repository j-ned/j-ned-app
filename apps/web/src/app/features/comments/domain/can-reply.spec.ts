import { canReply } from './can-reply';

const PARENT = { id: 'c-0', author: { kind: 'owner' }, excerpt: 'Oui' } as const;

describe('canReply', () => {
  it.each([
    { name: 'a published comment', status: 'published', parent: null, expected: true },
    { name: 'a pending comment', status: 'pending', parent: null, expected: false },
    { name: 'a published reply', status: 'published', parent: PARENT, expected: false },
    { name: 'a pending reply', status: 'pending', parent: PARENT, expected: false },
  ] as const)('Given $name When a reply is considered Then it is allowed: $expected', (comment) => {
    expect(canReply(comment)).toBe(comment.expected);
  });
});
