// Lecture d'une collection publique de l'API au build (sitemap, RSS). Même politique que
// `fetchPrerenderSlugs` (src/app/app.routes.server.ts) : un 429 est réessayé après le délai annoncé,
// toute autre erreur fait échouer le build plutôt que publier un artefact amputé en silence.
const MAX_ATTEMPTS = 3;
const DEFAULT_RETRY_DELAY_MS = 5_000;

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function retryDelayMs(res) {
  const seconds = Number(res.headers.get('retry-after') ?? res.headers.get('x-ratelimit-reset'));
  return Number.isFinite(seconds) && seconds > 0 ? seconds * 1000 : DEFAULT_RETRY_DELAY_MS;
}

export async function fetchPublicJson(url) {
  for (let attempt = 1; ; attempt++) {
    let res;
    try {
      res = await fetch(url);
    } catch (cause) {
      throw new Error(`Build: ${url} unreachable, build aborted`, { cause });
    }
    if (res.ok) return res.json();
    if (res.status === 429 && attempt < MAX_ATTEMPTS) {
      await wait(retryDelayMs(res));
      continue;
    }
    throw new Error(
      `Build: ${url} answered HTTP ${res.status} after ${attempt} attempt(s), build aborted`,
    );
  }
}
