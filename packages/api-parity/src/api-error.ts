import { expect } from 'vitest';
import type { ApiResponse } from './client';

const ERROR_KEYS = ['error', 'message', 'path', 'statusCode', 'timestamp'];

// Cinq clés exactement, sans pile ni détail interne ; `message` (texte ou liste) est le seul champ lu
// par le front. `error` n'est vérifié que non vide : NestJS y met l'intitulé HTTP ou son énumération.
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
