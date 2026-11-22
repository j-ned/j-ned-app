import { getConnInfo } from '@hono/node-server/conninfo';
import { timingSafeEqual } from 'node:crypto';
import { isIP } from 'node:net';
import type { MiddlewareHandler } from 'hono';
import type { Context } from 'hono';
import type { ContentfulStatusCode } from 'hono/utils/http-status';
import type * as z from 'zod';
import type { User } from '../database/schema';
import {
  BadRequestException,
  PayloadTooLargeException,
  UnprocessableEntityException,
} from './http-errors';
import { validateDto } from './validation';

export type AppEnv = { Variables: { user: User; clientIp: string } };
export type AppContext = Context<AppEnv>;

// Même contrat que NestJS : `undefined` ou `null` donnent un corps vide (le client lit `null`).
export function reply(
  c: Context,
  value: unknown,
  status: ContentfulStatusCode = 200,
): Response {
  return value === undefined || value === null
    ? c.body(null, status)
    : c.json(value, status);
}

// Même limite que le parseur JSON d'Express (body-parser) devant l'API NestJS.
export const JSON_BODY_LIMIT_BYTES = 100 * 1024;

// Comme Express avec `trust proxy 1` : la dernière entrée de `X-Forwarded-For`, écrite par le proxy
// de confiance (les précédentes viennent du client) ; sinon, ou si elle n'est pas une IP, la socket.
export function clientIp(c: Context): string {
  const forwarded = (c as AppContext).var.clientIp;
  if (forwarded) return forwarded;
  const last = c.req.header('x-forwarded-for')?.split(',').at(-1)?.trim();
  if (last && isIP(last) !== 0) return last;
  try {
    return getConnInfo(c).remote.address ?? '';
  } catch {
    return '';
  }
}

// Cru seulement avec le secret partagé : l'appel du rendu serveur arrive avec l'adresse de son
// conteneur, et tous les visiteurs partageraient un quota. Sans secret configuré, rien n'est cru.
export function forwardedVisitorIp(
  secret: string | undefined,
): MiddlewareHandler<AppEnv> {
  const expected = secret ? Buffer.from(secret) : undefined;
  return async (c, next) => {
    const given = c.req.header('x-ssr-secret');
    const ip = c.req.header('x-ssr-visitor-ip')?.trim();
    if (
      expected &&
      given !== undefined &&
      ip &&
      isIP(ip) !== 0 &&
      given.length === expected.length &&
      timingSafeEqual(Buffer.from(given), expected)
    ) {
      c.set('clientIp', ip);
    }
    await next();
  };
}

const COUNTRY_CODE = /^[A-Z]{2}$/;

// Écrit par le proxy du site d'après Cloudflare ; `null` sans lui ou hors code ISO à deux lettres.
export function visitorCountry(c: Context): string | null {
  const country = c.req.header('x-visitor-country')?.toUpperCase();
  return country && COUNTRY_CODE.test(country) ? country : null;
}

// Comme `req.originalUrl` d'Express.
export function originalUrl(c: Context): string {
  const url = new URL(c.req.url);
  return `${url.pathname}${url.search}`;
}

// Comme body-parser : seul `application/json` est lu (sinon corps vide), 100 ko au plus (413), JSON
// invalide → 400, corps vide → `{}`.
export async function jsonBody<T>(
  c: Context,
  schema: z.ZodType<T>,
): Promise<T> {
  return validateDto(schema, await readJson(c));
}

export async function readJson(c: Context): Promise<unknown> {
  const type = c.req.header('content-type') ?? '';
  if (!/^application\/json\b/i.test(type)) return {};
  const length = Number(c.req.header('content-length') ?? '0');
  if (length > JSON_BODY_LIMIT_BYTES) {
    throw new PayloadTooLargeException('request entity too large');
  }
  const bytes = await readLimited(c.req.raw, JSON_BODY_LIMIT_BYTES, () => {
    throw new PayloadTooLargeException('request entity too large');
  });
  const text = new TextDecoder().decode(bytes);
  if (text.trim() === '') return {};
  try {
    return JSON.parse(text);
  } catch (error) {
    throw new BadRequestException(
      error instanceof Error ? error.message : 'Invalid JSON',
    );
  }
}

// Une clé répétée donne une liste, comme Express.
export function queryParams<T>(c: Context, schema: z.ZodType<T>): T {
  const raw = c.req.queries();
  const plain = Object.fromEntries(
    Object.entries(raw).map(([key, values]) => [
      key,
      values.length === 1 ? values[0] : values,
    ]),
  );
  return validateDto(schema, plain);
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Comme le `ParseUUIDPipe` de NestJS.
export function uuidParam(c: Context, name: string): string {
  const value = c.req.param(name) ?? '';
  if (!UUID.test(value)) {
    throw new BadRequestException('Validation failed (uuid is expected)');
  }
  return value;
}

// Mêmes champs utiles que le fichier de multer.
export type UploadedFile = {
  readonly buffer: Buffer;
  readonly mimetype: string;
  readonly originalname: string;
  readonly size: number;
};

// Enveloppe multipart en plus (le relais nginx du site accepte 5 Mo) ; l'admin réduit les images dans
// le navigateur avant l'envoi.
export const UPLOAD_MAX_BYTES = 4 * 1024 * 1024;

export type UploadRule = {
  readonly maxBytes: number;
  // Vérifié sur les octets du fichier (magic number), pas sur l'en-tête.
  readonly fileType: RegExp;
};

export const IMAGE_UPLOAD = {
  maxBytes: UPLOAD_MAX_BYTES,
  fileType: /^image\/(webp|jpeg|png|avif)$/,
} as const satisfies UploadRule;

// Enveloppe multipart (limites, en-têtes de partie) tolérée au-delà de la taille du fichier.
const MULTIPART_OVERHEAD_BYTES = 64 * 1024;

// Comme `FileInterceptor` + `ParseFilePipe` : trop gros → 413 « File too large » sans lire plus loin ;
// absent ou d'un autre type → 422.
export async function uploadedFile(
  c: Context,
  rule: UploadRule,
): Promise<UploadedFile> {
  const tooLarge = (): never => {
    throw new PayloadTooLargeException('File too large');
  };
  const length = Number(c.req.header('content-length') ?? '0');
  if (length > rule.maxBytes + MULTIPART_OVERHEAD_BYTES) tooLarge();
  const bytes = await readLimited(
    c.req.raw,
    rule.maxBytes + MULTIPART_OVERHEAD_BYTES,
    tooLarge,
  );

  let form: FormData;
  try {
    form = await new Request(c.req.url, {
      method: 'POST',
      headers: { 'content-type': c.req.header('content-type') ?? '' },
      body: bytes as Uint8Array<ArrayBuffer>,
    }).formData();
  } catch {
    throw new UnprocessableEntityException('File is required');
  }
  const entry = form.get('file');
  if (!(entry instanceof File)) {
    throw new UnprocessableEntityException('File is required');
  }
  if (entry.size > rule.maxBytes) tooLarge();

  const buffer = Buffer.from(await entry.arrayBuffer());
  const { fileTypeFromBuffer } = await import('file-type');
  const detected = await fileTypeFromBuffer(buffer);
  if (!detected || !rule.fileType.test(detected.mime)) {
    throw new UnprocessableEntityException(
      `Validation failed (current file type is ${entry.type}, expected type is ${String(rule.fileType)})`,
    );
  }
  return {
    buffer,
    mimetype: entry.type,
    originalname: entry.name,
    size: entry.size,
  };
}

// Ordre d'erreurs figé par le contrat : fichier trop gros (413), UUID invalide (400), puis fichier
// absent ou d'un autre type (422).
export async function uuidParamAndFile(
  c: Context,
  name: string,
  rule: UploadRule,
): Promise<{ id: string; file: UploadedFile }> {
  let file: UploadedFile | undefined;
  let fileError: unknown;
  try {
    file = await uploadedFile(c, rule);
  } catch (error) {
    if (error instanceof PayloadTooLargeException) throw error;
    fileError = error;
  }
  const id = uuidParam(c, name);
  if (!file) throw fileError;
  return { id, file };
}

// Au-delà de `limit`, `onOverflow` est appelé sans lire la suite.
async function readLimited(
  request: Request,
  limit: number,
  onOverflow: () => never,
): Promise<Uint8Array> {
  if (!request.body) return new Uint8Array();
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > limit) {
      // Un flux déjà entièrement reçu est fermé : l'annuler lève, sans conséquence ici.
      await reader.cancel().catch(() => undefined);
      onOverflow();
    }
    chunks.push(value);
  }
  const bytes = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return bytes;
}
