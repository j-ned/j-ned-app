import { describe, it, expect } from 'vitest';
import { addTag, TAG_MAX_LENGTH } from './add-tag';

const RULES = { known: ['Angular', 'Sécurité web'], maxCount: 3 };

describe('addTag', () => {
  it.each([
    { tags: [], raw: 'Playwright', added: 'Playwright' },
    { tags: ['Angular'], raw: '  Freelance  ', added: 'Freelance' },
    { tags: [], raw: 'Tests   de\tbout en bout', added: 'Tests de bout en bout' },
    { tags: [], raw: 'angular', added: 'Angular' },
    { tags: [], raw: 'SÉCURITÉ WEB', added: 'Sécurité web' },
    { tags: ['A', 'B'], raw: 'C', added: 'C' },
  ])('Given $tags When "$raw" is added Then "$added" closes the list', ({ tags, raw, added }) => {
    expect(addTag(tags, raw, RULES)).toEqual({
      success: true,
      data: { tags: [...tags, added], added },
    });
  });

  it.each([
    { tags: ['Angular'], raw: 'angular', error: 'duplicate', tag: 'Angular' },
    { tags: ['Freelance'], raw: ' FREELANCE ', error: 'duplicate', tag: 'Freelance' },
    { tags: [], raw: ' \t ', error: 'empty', tag: '' },
    { tags: [], raw: 'x'.repeat(TAG_MAX_LENGTH + 1), error: 'too-long', tag: 'x'.repeat(51) },
    { tags: ['A', 'B', 'C'], raw: 'Playwright', error: 'too-many', tag: 'Playwright' },
  ])(
    'Given $tags When "$raw" is added Then it is refused as $error',
    ({ tags, raw, error, tag }) => {
      expect(addTag(tags, raw, RULES)).toEqual({ success: false, error, tag });
    },
  );

  it('Given a tag of exactly the maximum length When it is added Then it is accepted', () => {
    const tag = 'x'.repeat(TAG_MAX_LENGTH);

    expect(addTag([], ` ${tag} `, RULES)).toEqual({
      success: true,
      data: { tags: [tag], added: tag },
    });
  });

  it('Given the API limit When it is read Then a tag counts 50 characters at most, as the DTOs of the API', () => {
    expect(TAG_MAX_LENGTH).toBe(50);
  });

  it('Given a list When a tag is added Then the original list is left untouched', () => {
    const tags = ['Angular'];

    addTag(tags, 'RxJS', RULES);

    expect(tags).toEqual(['Angular']);
  });
});
