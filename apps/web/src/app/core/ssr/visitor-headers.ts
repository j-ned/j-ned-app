/**
 * En-têtes d'un appel serveur → API pour un visiteur donné, qui garde chaque lecture dans le quota de ce
 * visiteur. L'appel arrive avec l'adresse du conteneur du rendu : l'API ne croit `x-ssr-visitor-ip`
 * qu'accompagné du secret partagé (`SSR_FORWARD_SECRET`). Sans secret (`ng serve`), seul
 * `X-Forwarded-For` part, dont l'API lit la dernière entrée.
 */
export function visitorHeaders(
  visitor: string | null,
  forwardSecret: string | null,
): Record<string, string> {
  if (!visitor) return {};
  return {
    'X-Forwarded-For': visitor,
    ...(forwardSecret ? { 'x-ssr-visitor-ip': visitor, 'x-ssr-secret': forwardSecret } : {}),
  };
}
