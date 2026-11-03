import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { WORKSHOP_GUIDE_SEED } from './workshop-guide.seed';

const MIGRATION = readFileSync(
  resolve(__dirname, '../../drizzle/0030_workshop_guide.sql'),
  'utf8',
);

/** Le document versé par la migration : le JSON entre les délimiteurs `$seed$`. */
const migrationJson = (): string | undefined =>
  /\$seed\$([\s\S]*)\$seed\$/.exec(MIGRATION)?.[1];

describe('0030 — guide des plaquettes (spec 035 du front)', () => {
  it('Given the migration, When its JSON is read, Then it is exactly WORKSHOP_GUIDE_SEED', () => {
    const json = migrationJson();

    expect(json).toBeDefined();
    expect(JSON.parse(json ?? 'null')).toEqual(WORKSHOP_GUIDE_SEED);
  });
});
