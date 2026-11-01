import { PROFILE_LIMITS } from './profile-limits';

describe('PROFILE_LIMITS', () => {
  it('Given the bounds enforced by the API When the front copy is read Then it holds the same values', () => {
    expect(PROFILE_LIMITS).toEqual({
      biography: { title: 80, summary: 200, leadEmphasis: 160, paragraph: 1200, paragraphs: 8 },
      sectionSummary: 200,
      highlight: { title: 60, description: 400, items: 6 },
      whatIDo: { title: 60, description: 600, items: 6 },
      technology: { name: 40, category: 40, items: 18 },
      diploma: {
        title: 120,
        provider: 80,
        level: 80,
        shortDescription: 600,
        skill: 80,
        skills: 12,
        items: 8,
      },
      motivation: { title: 60, statement: 240, description: 600 },
    });
  });
});
