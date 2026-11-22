import { createHash, createHmac } from 'node:crypto';

export type SenderHashScope = 'contact' | 'comments';

// Empreinte d'expéditeur : HMAC de l'IP sous une clé dérivée du secret, propre à chaque usage, pour
// qu'un commentaire ne se relie pas à un message de contact. Sans jour : stable d'un jour à l'autre.
export function senderHasher(
  secret: string,
  scope: SenderHashScope,
): (ip: string) => string {
  const key = createHash('sha256').update(`${scope}|${secret}`).digest();
  return (ip) => createHmac('sha256', key).update(ip).digest('hex');
}
