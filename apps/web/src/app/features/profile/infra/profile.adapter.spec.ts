import { aProfileContent, aProfileDocument } from '../testing/profile-builders';
import { toProfileDocument } from './profile.adapter';
import type { ProfileDto } from './profile.types';

const STORAGE_BASE = '/api';
const PORTRAIT_PATH = '/storage/portfolio-storage/profile/portrait-1a2b3c4d.avif';

const dto = (overrides: Partial<ProfileDto> = {}): ProfileDto => ({
  ...aProfileContent(),
  version: 4,
  updatedAt: '2026-10-11T09:30:00.000Z',
  portrait: null,
  ...overrides,
});

describe('toProfileDocument', () => {
  it('Given the API document When adapted Then version, date and the eight content sections are kept, apart from the portrait', () => {
    expect(toProfileDocument(dto(), STORAGE_BASE)).toEqual(
      aProfileDocument({
        version: 4,
        updatedAt: '2026-10-11T09:30:00.000Z',
        content: aProfileContent(),
        portraitUrl: null,
      }),
    );
  });

  it.each([
    { cas: 'no portrait yet', portrait: null, expected: null },
    { cas: 'a stored portrait', portrait: PORTRAIT_PATH, expected: `/api${PORTRAIT_PATH}` },
  ])('Given $cas When adapted Then portraitUrl is $expected', ({ portrait, expected }) => {
    expect(toProfileDocument(dto({ portrait }), STORAGE_BASE).portraitUrl).toBe(expected);
  });
});
