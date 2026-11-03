import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { PROFILE_SEED } from './profile.seed';

const MIGRATION = readFileSync(
  resolve(__dirname, '../../drizzle/0021_profile_seed.sql'),
  'utf8',
);

/** Le document versé par la migration : le JSON entre les délimiteurs `$seed$`. */
const migrationJson = (): string | undefined =>
  /\$seed\$([\s\S]*)\$seed\$/.exec(MIGRATION)?.[1];

describe('PROFILE_SEED — contenu initial du parcours (spec 021, A2)', () => {
  it('Given the migration, When its JSON is read, Then it is exactly PROFILE_SEED', () => {
    const json = migrationJson();

    expect(json).toBeDefined();
    expect(JSON.parse(json ?? 'null')).toEqual(PROFILE_SEED);
  });
});
