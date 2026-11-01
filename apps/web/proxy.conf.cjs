// `/api/storage/…` (images) passe aussi par ici : sans API locale, les images ne s'affichent pas en dev.
// L'API écarte les IP privées : sans adresse publique de documentation (TEST-NET-3), rien n'est mesuré en local.
module.exports = {
  '/api': {
    target: 'http://localhost:3000',
    secure: false,
    headers: { 'X-Forwarded-For': '203.0.113.10' },
  },
};
