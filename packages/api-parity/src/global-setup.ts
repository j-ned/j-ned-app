import { parityEnv } from './env';

// Échoue tôt et lisiblement si la pile n'est pas lancée, au lieu de 200 échecs de connexion.
export default async function checkApiReachable(): Promise<void> {
  const { apiUrl } = parityEnv();
  try {
    const response = await fetch(`${apiUrl}/api/health`, {
      headers: { 'x-forwarded-for': '198.19.255.254' },
    });
    if (!response.ok) throw new Error(`statut ${response.status}`);
  } catch (error) {
    throw new Error(`API injoignable sur ${apiUrl} : ${String(error)}`);
  }
}
