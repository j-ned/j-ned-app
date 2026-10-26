import { describe, expect, expectTypeOf, it } from 'vitest';
import type { WorkshopSpace } from './models/workshop-space.model';
import { WORKSHOP_SPACE } from './workshop-space.static-data';

describe('WORKSHOP_SPACE', () => {
  it('Given the workshop space When its type is read Then it is the workshop space model', () => {
    expectTypeOf(WORKSHOP_SPACE).toEqualTypeOf<WorkshopSpace>();
  });

  it('Given the workshop space When its heading is read Then the space is named « L’atelier »', () => {
    expect(WORKSHOP_SPACE.heading).toBe("L'atelier");
  });

  it('Given the workshop space When its intro is read Then no paragraph is blank or padded with spaces', () => {
    expect(
      WORKSHOP_SPACE.intro.filter(
        (paragraph) => paragraph === '' || paragraph !== paragraph.trim(),
      ),
    ).toEqual([]);
  });
});
