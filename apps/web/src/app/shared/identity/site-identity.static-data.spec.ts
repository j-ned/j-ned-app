import { SITE_IDENTITY } from './site-identity.static-data';

describe('SITE_IDENTITY', () => {
  it('declares the professional status of the publisher', () => {
    expect(SITE_IDENTITY.business).toEqual({
      status: 'entrepreneur individuel',
      siret: '937 999 860 00029',
      ape: '62.01Z',
      vatMention: 'TVA non applicable, art. 293 B du CGI',
    });
  });
});
