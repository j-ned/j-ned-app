type RequestHeaders = Readonly<Record<string, string | readonly string[] | undefined>>;

type ProxyEnv = { readonly VISITOR_IP_HEADER?: string | undefined };

/**
 * Adresse du visiteur, lue dans l'en-tête que le proxy placé devant le rendu écrit lui-même (une valeur
 * envoyée par le client y est remplacée) : celui que nomme `VISITOR_IP_HEADER`. Sans proxy déclaré
 * (`ng serve`), aucun en-tête n'est digne de confiance : `null`.
 */
export function visitorIpFromProxy(headers: RequestHeaders, env: ProxyEnv): string | null {
  const trusted = env.VISITOR_IP_HEADER?.toLowerCase();
  if (!trusted) return null;
  const value = headers[trusted];
  return typeof value === 'string' && value !== '' ? value : null;
}
