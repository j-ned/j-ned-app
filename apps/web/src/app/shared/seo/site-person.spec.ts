import { SITE_IDENTITY } from '@shared/identity/site-identity.static-data';
import { OWNER_NAME, PERSON_ID, PERSON_REF, pageTitle } from './site-person';

describe('site person', () => {
  it('Given a page title When it is suffixed Then the owner name follows a pipe', () => {
    expect(pageTitle('Mentions légales')).toBe('Mentions légales | Julien Nédellec');
  });

  it('Given the site owner When referenced in JSON-LD Then every page points to the same person node', () => {
    expect({ ownerName: OWNER_NAME, personId: PERSON_ID, personRef: PERSON_REF }).toEqual({
      ownerName: 'Julien Nédellec',
      personId: `${SITE_IDENTITY.siteUrl}/#person`,
      personRef: {
        '@type': 'Person',
        '@id': `${SITE_IDENTITY.siteUrl}/#person`,
        name: 'Julien Nédellec',
        url: SITE_IDENTITY.siteUrl,
      },
    });
  });
});
