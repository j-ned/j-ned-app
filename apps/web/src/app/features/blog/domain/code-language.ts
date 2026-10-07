export type CodeLanguageId =
  | 'typescript'
  | 'javascript'
  | 'html'
  | 'css'
  | 'scss'
  | 'json'
  | 'bash'
  | 'sql'
  | 'yaml'
  | 'markdown'
  | 'dockerfile'
  | 'python';

export type CodeLanguage = {
  readonly id: CodeLanguageId;
  readonly label: string;
  // Le premier est l'identifiant court proposé à la saisie.
  readonly aliases: readonly string[];
};

export const CODE_LANGUAGES: readonly CodeLanguage[] = [
  { id: 'typescript', label: 'TypeScript', aliases: ['ts', 'typescript'] },
  { id: 'javascript', label: 'JavaScript', aliases: ['js', 'javascript'] },
  { id: 'html', label: 'HTML', aliases: ['html'] },
  { id: 'css', label: 'CSS', aliases: ['css'] },
  { id: 'scss', label: 'SCSS', aliases: ['scss'] },
  { id: 'json', label: 'JSON', aliases: ['json'] },
  { id: 'bash', label: 'Bash', aliases: ['bash', 'sh', 'shell'] },
  { id: 'sql', label: 'SQL', aliases: ['sql'] },
  { id: 'yaml', label: 'YAML', aliases: ['yaml', 'yml'] },
  { id: 'markdown', label: 'Markdown', aliases: ['md', 'markdown'] },
  { id: 'dockerfile', label: 'Dockerfile', aliases: ['dockerfile', 'docker'] },
  { id: 'python', label: 'Python', aliases: ['py', 'python'] },
];

// Seul le premier mot de l'info string compte (```ts title="main.ts"), casse ignorée.
export function resolveCodeLanguage(info: string | undefined): CodeLanguage | null {
  const word = info?.trim().split(/\s+/, 1)[0]?.toLowerCase();
  if (!word) return null;
  return CODE_LANGUAGES.find(({ aliases }) => aliases.includes(word)) ?? null;
}
