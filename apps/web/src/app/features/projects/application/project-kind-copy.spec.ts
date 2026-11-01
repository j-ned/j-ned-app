import { projectCoverAlt, sheetLinkContext } from './project-kind-copy';

describe('project kind copy', () => {
  it.each([
    ['DashFlow', '\u00a0: DashFlow'],
    ['Le Vieux Comptoir', '\u00a0: Le Vieux Comptoir'],
  ])(
    'Given the title %s When the sheet link context is built Then it reads %j, glued by a non-breaking space',
    (title, expected) => {
      expect(sheetLinkContext(title)).toBe(expected);
    },
  );

  it.each([
    ['DashFlow', 'Aperçu du projet DashFlow'],
    ['Le Vieux Comptoir', 'Aperçu du projet Le Vieux Comptoir'],
  ])('Given the title %s When the cover alt is built Then it reads %j', (title, expected) => {
    expect(projectCoverAlt(title)).toBe(expected);
  });
});
