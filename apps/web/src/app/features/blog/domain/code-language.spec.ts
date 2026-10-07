import { describe, it, expect } from 'vitest';
import { CODE_LANGUAGES, resolveCodeLanguage } from './code-language';

describe('CODE_LANGUAGES', () => {
  it('Given the catalogue When it is read Then it lists the twelve languages of the blog, each with its label', () => {
    expect(CODE_LANGUAGES.map(({ id, label }) => ({ id, label }))).toEqual([
      { id: 'typescript', label: 'TypeScript' },
      { id: 'javascript', label: 'JavaScript' },
      { id: 'html', label: 'HTML' },
      { id: 'css', label: 'CSS' },
      { id: 'scss', label: 'SCSS' },
      { id: 'json', label: 'JSON' },
      { id: 'bash', label: 'Bash' },
      { id: 'sql', label: 'SQL' },
      { id: 'yaml', label: 'YAML' },
      { id: 'markdown', label: 'Markdown' },
      { id: 'dockerfile', label: 'Dockerfile' },
      { id: 'python', label: 'Python' },
    ]);
  });

  it('Given the catalogue When each alias is resolved Then it gives back its own language, so no alias is shared', () => {
    const aliases = CODE_LANGUAGES.flatMap((language) =>
      language.aliases.map((alias) => ({ alias, owner: language.id })),
    );

    expect({
      count: aliases.length >= 20,
      misrouted: aliases.filter(({ alias, owner }) => resolveCodeLanguage(alias)?.id !== owner),
    }).toEqual({ count: true, misrouted: [] });
  });
});

describe('resolveCodeLanguage', () => {
  it.each([
    ['ts', 'typescript'],
    ['typescript', 'typescript'],
    ['js', 'javascript'],
    ['javascript', 'javascript'],
    ['html', 'html'],
    ['css', 'css'],
    ['scss', 'scss'],
    ['json', 'json'],
    ['bash', 'bash'],
    ['sh', 'bash'],
    ['shell', 'bash'],
    ['sql', 'sql'],
    ['yaml', 'yaml'],
    ['yml', 'yaml'],
    ['md', 'markdown'],
    ['markdown', 'markdown'],
    ['dockerfile', 'dockerfile'],
    ['docker', 'dockerfile'],
    ['py', 'python'],
    ['python', 'python'],
  ])('Given the info string « %s » When it is resolved Then the language is %s', (info, id) => {
    expect(resolveCodeLanguage(info)?.id).toBe(id);
  });

  it.each([
    ['TS', 'typescript'],
    ['Dockerfile', 'dockerfile'],
    ['ts title="main.ts"', 'typescript'],
    ['py {1,3}', 'python'],
  ])(
    'Given the info string « %s » When it is resolved Then only its first word counts, whatever the case, and gives %s',
    (info, id) => {
      expect(resolveCodeLanguage(info)?.id).toBe(id);
    },
  );

  it.each([['rust'], ['tsx'], ['plaintext'], [''], ['   '], [undefined]])(
    'Given the info string %j When it is resolved Then no language is found',
    (info) => {
      expect(resolveCodeLanguage(info)).toBeNull();
    },
  );

  it('Given an alias When it is resolved Then the very catalogue entry comes back', () => {
    expect(resolveCodeLanguage('yml')).toBe(CODE_LANGUAGES.find(({ id }) => id === 'yaml'));
  });
});
