/// <reference types="node" />
import { readFileSync } from 'node:fs';
import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import {
  AngularNodeAppEngine,
  createNodeRequestHandler,
  isMainModule,
  writeResponseToNodeResponse,
} from '@angular/ssr/node';
import type { SsrRequestContext } from '@core/ssr/ssr-request-context';
import { hardenCsp, type CspBuildManifest } from './server/csp/harden-csp';
import { nodeSha256 } from './server/csp/node-sha256';
import { dispatchSsrRequest } from './server/dispatch-ssr-request';
import { createFeedHandler } from './server/feeds/feed-handler';

// nginx est le seul client : il sert les fichiers et ne relaie ici qu'une liste fermée de routes.
const LISTEN_HOST = '127.0.0.1';
const LISTEN_PORT = 4000;

const engine = new AngularNodeAppEngine();

// URL d'API fixée au démarrage, jamais dérivée de la requête (SSRF). Sans variable (`ng serve`),
// pas de contexte : l'application lit l'URL publique.
const apiUpstream = process.env['API_UPSTREAM'];
const apiBaseUrl = apiUpstream ? `${apiUpstream}/api` : null;

// `lastmod` des pages statiques du sitemap : le démarrage du serveur suit le déploiement du code.
const feeds = apiBaseUrl ? createFeedHandler({ apiBaseUrl, fetch, startedAt: new Date() }) : null;

// Écrit par le postbuild à côté de ce module ; absent sous `ng serve`, où la CSP de `src/index.html`
// garde `'unsafe-inline'`.
function readCspManifest(): CspBuildManifest | null {
  try {
    return JSON.parse(readFileSync(new URL('./csp-manifest.json', import.meta.url), 'utf8'));
  } catch {
    return null;
  }
}

const cspManifest = readCspManifest();

async function hardenHtml(response: Response, manifest: CspBuildManifest): Promise<Response> {
  if (!response.headers.get('Content-Type')?.startsWith('text/html')) return response;
  const html = hardenCsp(await response.text(), manifest, nodeSha256, (script) =>
    console.warn(`CSP: inline script not allowed: ${script.slice(0, 120)}`),
  );
  const headers = new Headers(response.headers);
  headers.delete('Content-Length');
  headers.set('Cache-Control', 'no-cache');
  return new Response(html, { status: response.status, statusText: response.statusText, headers });
}

// Seuls 200 et 404 vont au micro-cache nginx. Il compte la validité en secondes entières : « 1s »
// y tient jusqu'à 2 s ; une échéance absolue à la seconde courante expire à la seconde suivante.
async function send(response: Response, res: ServerResponse): Promise<void> {
  if (response.status === 200 || response.status === 404) {
    res.setHeader('X-Accel-Expires', `@${Math.floor(Date.now() / 1000)}`);
  }
  await writeResponseToNodeResponse(response, res);
}

function visitorForwardedFor(req: IncomingMessage): string | null {
  const header = req.headers['x-visitor-forwarded-for'];
  return typeof header === 'string' && header !== '' ? header : null;
}

function requestContext(req: IncomingMessage): SsrRequestContext | undefined {
  return apiBaseUrl ? { apiBaseUrl, visitorForwardedFor: visitorForwardedFor(req) } : undefined;
}

// `false` : aucune route Angular ne correspond, l'appelant décide (404 en production, Vite en dev).
async function respond(req: IncomingMessage, res: ServerResponse): Promise<boolean> {
  const { pathname } = new URL(req.url ?? '/', 'http://localhost');
  const target = dispatchSsrRequest(pathname);
  switch (target) {
    case 'health':
      res.writeHead(200, {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-store',
      });
      res.end('ok');
      return true;
    case 'sitemap':
    case 'rss':
      if (!feeds) return false;
      await send(await feeds(target, visitorForwardedFor(req)), res);
      return true;
    case 'angular': {
      const response = await engine.handle(req, requestContext(req));
      if (!response) return false;
      await send(cspManifest ? await hardenHtml(response, cspManifest) : response, res);
      return true;
    }
  }
}

// Nom d'export `reqHandler` requis par Angular (`ng serve`, extraction des routes au build).
export const reqHandler = createNodeRequestHandler(async (req, res, next) => {
  try {
    if (!(await respond(req, res))) next();
  } catch (error) {
    next(error);
  }
});

if (isMainModule(import.meta.url)) {
  if (!cspManifest) throw new Error('csp-manifest.json missing: run the production build');
  const server = createServer((req, res) => {
    respond(req, res)
      .then((handled) => {
        if (!handled) res.writeHead(404).end();
      })
      .catch((error: unknown) => {
        console.error(error);
        if (!res.headersSent) res.writeHead(500);
        res.end();
      });
  }).listen(LISTEN_PORT, LISTEN_HOST);
  // Arrêt du conteneur : les rendus en cours se terminent, aucun nouveau n'est accepté.
  process.once('SIGTERM', () => server.close(() => process.exit(0)));
}
