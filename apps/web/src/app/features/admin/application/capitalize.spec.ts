import { capitalize } from './capitalize';

describe('capitalize', () => {
  it.each([
    ['mardi 7 octobre 2026', 'Mardi 7 octobre 2026'],
    ['éditer', 'Éditer'],
    ['Déjà', 'Déjà'],
    ['', ''],
  ])('Given « %s », When on met la capitale, Then on obtient « %s »', (text, expected) => {
    expect(capitalize(text)).toBe(expected);
  });
});
