// `/api/storage/…` (images) passe aussi par ici : sans API locale, les images ne s'affichent pas en dev.
module.exports = {
  '/api': {
    target: 'http://localhost:3000',
    secure: false,
  },
};
