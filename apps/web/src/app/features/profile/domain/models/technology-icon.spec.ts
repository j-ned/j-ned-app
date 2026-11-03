/// <reference types="node" />
import { existsSync } from 'node:fs';
import { TECHNOLOGY_ICONS } from './technology-icon';

const API_ICON_PATTERN = /^[a-z0-9-]{1,40}$/;

describe('TECHNOLOGY_ICONS', () => {
  it('Given the closed list When each icon is checked against the API pattern Then every one is accepted', () => {
    expect(TECHNOLOGY_ICONS.filter((icon) => !API_ICON_PATTERN.test(icon))).toEqual([]);
  });

  // La page Parcours charge `/icons/<icon>.svg` par un chemin calculé : aucune recherche du nom de
  // fichier ne le voit, et une suppression « d'actif inutilisé » casse l'image en production.
  it('Given the closed list When each icon file is looked up Then every one is served from public/icons', () => {
    expect(TECHNOLOGY_ICONS.filter((icon) => !existsSync(`public/icons/${icon}.svg`))).toEqual([]);
  });
});
