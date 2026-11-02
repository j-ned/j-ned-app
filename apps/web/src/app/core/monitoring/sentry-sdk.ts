// Seuls points d'entrée du SDK chargés par `main.ts` : un `import('@sentry/angular')` entier embarque
// Replay et Feedback (environ 87 kB gzip), jamais utilisés. Réexport nommé : esbuild élague le reste.
export {
  browserTracingIntegration,
  createErrorHandler,
  getActiveSpan,
  getCurrentScope,
  getRootSpan,
  httpClientIntegration,
  init,
  setUser,
  spanToJSON,
  TraceService,
  updateSpanName,
} from '@sentry/angular';
