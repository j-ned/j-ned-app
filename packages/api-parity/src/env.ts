import { existsSync, readFileSync } from 'node:fs';

export type ParityEnv = {
  readonly apiUrl: string;
  readonly adminEmail: string;
  readonly adminPassword: string;
};

// Écrit par `scripts/stack.sh up` ; les variables d'environnement déjà posées l'emportent.
const ENV_FILE = new URL('../.parity-env', import.meta.url);

function fileValues(): Record<string, string> {
  if (!existsSync(ENV_FILE)) return {};
  return Object.fromEntries(
    readFileSync(ENV_FILE, 'utf8')
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line !== '' && !line.startsWith('#'))
      .map((line) => {
        const index = line.indexOf('=');
        return [line.slice(0, index), line.slice(index + 1)];
      }),
  );
}

export function parityEnv(): ParityEnv {
  const values = { ...fileValues(), ...process.env };
  const read = (key: string): string => {
    const value = values[key];
    if (!value)
      throw new Error(
        `${key} manquant : lancer \`pnpm stack:up\` ou le poser dans l'environnement`,
      );
    return value;
  };
  return {
    apiUrl: read('PARITY_API_URL').replace(/\/$/, ''),
    adminEmail: read('PARITY_ADMIN_EMAIL'),
    adminPassword: read('PARITY_ADMIN_PASSWORD'),
  };
}
