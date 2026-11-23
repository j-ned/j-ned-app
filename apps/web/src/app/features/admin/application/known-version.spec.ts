import { signal } from '@angular/core';
import { KnownVersion } from './known-version';

type Saved = { readonly id: string; readonly version: number } | null;

describe('KnownVersion', () => {
  it('Given nothing saved yet When the version is read Then it is 0', () => {
    expect(new KnownVersion(signal<Saved>(null)).value()).toBe(0);
  });

  it('Given a saved project When the version is read Then it is the saved one', () => {
    expect(new KnownVersion(signal<Saved>({ id: 'p-1', version: 3 })).value()).toBe(3);
  });

  it.each([
    { adopted: [5], expected: 5 },
    { adopted: [2], expected: 3 },
    { adopted: [6, 4], expected: 6 },
  ])(
    'Given version 3 saved When versions $adopted are written meanwhile Then the highest one is kept ($expected)',
    ({ adopted, expected }) => {
      const known = new KnownVersion(signal<Saved>({ id: 'p-1', version: 3 }));

      for (const version of adopted) known.adopt(version);

      expect(known.value()).toBe(expected);
    },
  );

  it('Given a version adopted When the same project is saved again with a lower version Then the adopted one still wins', () => {
    const saved = signal<Saved>({ id: 'p-1', version: 3 });
    const known = new KnownVersion(saved);
    known.adopt(7);

    saved.set({ id: 'p-1', version: 4 });

    expect(known.value()).toBe(7);
  });

  it('Given a version adopted When another project is loaded Then only its own version counts', () => {
    const saved = signal<Saved>({ id: 'p-1', version: 3 });
    const known = new KnownVersion(saved);
    known.adopt(7);

    saved.set({ id: 'p-2', version: 2 });

    expect(known.value()).toBe(2);
  });
});
