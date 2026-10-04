import { composeContactMessage } from './compose-contact-message';

const MESSAGE = 'Bonjour,\nje voudrais un site pour mon atelier.';

describe('composeContactMessage', () => {
  it('Given no qualification When the message is composed Then it is the typed message, unchanged', () => {
    expect(composeContactMessage({ message: MESSAGE, projectType: '', timeline: '' })).toBe(
      MESSAGE,
    );
  });

  it.each([
    ['a project type only', 'Site vitrine', '', `Type de projet\u00a0: Site vitrine\n\n${MESSAGE}`],
    ['a timeline only', '', 'Dans le mois', `Délai souhaité\u00a0: Dans le mois\n\n${MESSAGE}`],
    [
      'both',
      'Autre',
      "D'ici 3 mois",
      `Type de projet\u00a0: Autre\nDélai souhaité\u00a0: D'ici 3 mois\n\n${MESSAGE}`,
    ],
  ])(
    'Given %s When the message is composed Then only the chosen lines prefix it, then a blank line',
    (_case, projectType, timeline, expected) => {
      expect(composeContactMessage({ message: MESSAGE, projectType, timeline })).toBe(expected);
    },
  );
});
