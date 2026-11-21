// L'API ne croit `x-ssr-visitor-ip` qu'avec le secret partagé ; sans lui (`ng serve`), seul
// `X-Forwarded-For` part, dont l'API lit la dernière entrée.
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
