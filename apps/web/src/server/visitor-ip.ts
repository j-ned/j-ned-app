type RequestHeaders = Readonly<Record<string, string | readonly string[] | undefined>>;

type ProxyEnv = { readonly VISITOR_IP_HEADER?: string | undefined };

// Seul l'en-tête réécrit par le proxy (`VISITOR_IP_HEADER`) est fiable ; sans proxy déclaré
// (`ng serve`), aucun ne l'est.
export function visitorIpFromProxy(headers: RequestHeaders, env: ProxyEnv): string | null {
  const trusted = env.VISITOR_IP_HEADER?.toLowerCase();
  if (!trusted) return null;
  const value = headers[trusted];
  return typeof value === 'string' && value !== '' ? value : null;
}
