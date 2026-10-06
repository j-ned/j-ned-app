import { makeProject } from '../testing/project-builders';
import { projectPitch } from './project-pitch';

describe('projectPitch', () => {
  it('Given a project with a pitch When its pitch is read Then the pitch is used as written', () => {
    const project = makeProject({
      pitch: 'Le budget et la santé du foyer dans une seule app.',
      description: 'DashFlow centralise tout. Il chiffre les données.',
    });

    expect(projectPitch(project)).toBe('Le budget et la santé du foyer dans une seule app.');
  });

  it.each([
    {
      label: 'several sentences',
      description: 'DashFlow centralise tout. Il chiffre les données. Il tourne partout.',
      expected: 'DashFlow centralise tout.',
    },
    {
      label: 'a single sentence',
      description: 'Un tracker de candidatures dédié.',
      expected: 'Un tracker de candidatures dédié.',
    },
    {
      label: 'no full stop',
      description: 'Synchronise les étiquettes GitHub',
      expected: 'Synchronise les étiquettes GitHub',
    },
    {
      label: 'a dot inside a word',
      description: 'Site statique Astro.js, déployé partout. Suite.',
      expected: 'Site statique Astro.js, déployé partout.',
    },
  ])(
    'Given no pitch and a description with $label When its pitch is read Then it falls back to the first sentence',
    ({ description, expected }) => {
      expect(projectPitch(makeProject({ pitch: null, description }))).toBe(expected);
    },
  );
});
