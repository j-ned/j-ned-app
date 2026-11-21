import { SITE_IDENTITY } from '@shared/identity/site-identity.static-data';

export const OWNER_NAME = 'Julien Nédellec';

export const PERSON_ID = `${SITE_IDENTITY.siteUrl}/#person`;

// Même `@id` partout : les moteurs fusionnent alors les pages en une seule entité Person.
export const PERSON_REF = {
  '@type': 'Person',
  '@id': PERSON_ID,
  name: OWNER_NAME,
  url: SITE_IDENTITY.siteUrl,
} as const;

export const pageTitle = (title: string): string => `${title} | ${OWNER_NAME}`;
