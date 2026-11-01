import { expect } from 'vitest';
import type { ApiResponse } from './client';

const ERROR_KEYS = ['error', 'message', 'path', 'statusCode', 'timestamp'];

/**
 * Format d'erreur unique de l'API, quel que soit le code : JSON, ces cinq clés exactement (aucune pile,
 * aucun détail interne), `message` en texte ou en liste de textes (seul champ lu par le front, avec le
 * statut), `path` = chemin demandé.
 *
 * `error` n'est vérifié que comme texte non vide : NestJS y met l'intitulé HTTP (« Forbidden ») ou le
 * nom de son énumération (« UNAUTHORIZED ») selon l'origine de l'exception. Incohérence à normaliser
 * au portage, pas à reproduire (voir README).
 */
export function expectApiError(response: ApiResponse, status: number, path?: string): void {
  expect(response.status, response.text).toBe(status);
  expect(response.headers.get('content-type')).toMatch(/^application\/json/);
  const body = response.body as Record<string, unknown>;
  expect(Object.keys(body).sort()).toEqual(ERROR_KEYS);
  expect(body['statusCode']).toBe(status);
  expect(body['error']).toEqual(expect.stringMatching(/\S/));
  const message = body['message'];
  expect(
    typeof message === 'string' ||
      (Array.isArray(message) && message.every((part) => typeof part === 'string')),
    `message: ${JSON.stringify(message)}`,
  ).toBe(true);
  expect(Number.isNaN(Date.parse(String(body['timestamp'])))).toBe(false);
  if (path !== undefined) expect(String(body['path']).split('?')[0]).toBe(path);
  expect(response.text).not.toMatch(/\n\s+at |node_modules|\.ts:\d+/);
}
