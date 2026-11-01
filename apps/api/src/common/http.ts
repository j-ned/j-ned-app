import { getConnInfo } from '@hono/node-server/conninfo';
import type { ClassConstructor } from 'class-transformer';
import type { Context } from 'hono';
import type { ContentfulStatusCode } from 'hono/utils/http-status';
import type { User } from '../database/schema';
import {
  BadRequestException,
  PayloadTooLargeException,
  UnprocessableEntityException,
} from './http-errors';
import { validateDto } from './validation';

/** Variables de contexte posées par les middlewares (`requireAuth`). */
export type AppEnv = { Variables: { user: User } };
export type AppContext = Context<AppEnv>;

/**
 * Réponse d'une route, comme NestJS : `undefined` ou `null` → corps vide (le client lit `null`),
 * toute autre valeur → JSON. Statut 200 par défaut.
 */
export function reply(
  c: Context,
  value: unknown,
  status: ContentfulStatusCode = 200,
): Response {
  return value === undefined || value === null
    ? c.body(null, status)
    : c.json(value, status);
}

/** Même limite que le parseur JSON d'Express (body-parser) devant l'API NestJS. */
export const JSON_BODY_LIMIT_BYTES = 100 * 1024;

/**
 * Adresse du visiteur, comme Express avec `trust proxy 1` : la dernière entrée de `X-Forwarded-For`,
 * écrite par le proxy de confiance (les entrées antérieures viennent du client) ; sinon la socket.
 */
export function clientIp(c: Context): string {
  const forwarded = c.req.header('x-forwarded-for');
  const last = forwarded?.split(',').at(-1)?.trim();
  if (last) return last;
  try {
    return getConnInfo(c).remote.address ?? '';
  } catch {
    return '';
  }
}

/** Chemin et query string de la requête, comme `req.originalUrl` d'Express. */
export function originalUrl(c: Context): string {
  const url = new URL(c.req.url);
  return `${url.pathname}${url.search}`;
}

/**
 * Corps JSON validé par le DTO. Comme body-parser : seul `application/json` est lu (sinon corps
 * vide), 100 ko au plus (413), JSON invalide → 400, corps vide → `{}`.
 */
export async function jsonBody<T extends object>(
  c: Context,
  dto: ClassConstructor<T>,
): Promise<T> {
  return validateDto(dto, await readJson(c));
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

/** Query string validée par le DTO (une clé répétée donne une liste, comme Express). */
export function queryParams<T extends object>(
  c: Context,
  dto: ClassConstructor<T>,
): Promise<T> {
  const raw = c.req.queries();
  const plain = Object.fromEntries(
    Object.entries(raw).map(([key, values]) => [
      key,
      values.length === 1 ? values[0] : values,
    ]),
  );
  return validateDto(dto, plain);
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Paramètre de chemin UUID, comme le `ParseUUIDPipe` de NestJS. */
export function uuidParam(c: Context, name: string): string {
  const value = c.req.param(name) ?? '';
  if (!UUID.test(value)) {
    throw new BadRequestException('Validation failed (uuid is expected)');
  }
  return value;
}

/** Fichier reçu en multipart, mêmes champs utiles que celui de multer. */
export type UploadedFile = {
  readonly buffer: Buffer;
  readonly mimetype: string;
  readonly originalname: string;
  readonly size: number;
};

export type UploadRule = {
  readonly maxBytes: number;
  /** Type MIME attendu, vérifié sur les octets du fichier (magic number), pas sur l'en-tête. */
  readonly fileType: RegExp;
};

// Enveloppe multipart (limites, en-têtes de partie) tolérée au-delà de la taille du fichier.
const MULTIPART_OVERHEAD_BYTES = 64 * 1024;

/**
 * Fichier du champ `file`, comme `FileInterceptor` + `ParseFilePipe` de l'API NestJS : au-delà de la
 * taille permise → 413 « File too large » (sans lire plus loin) ; absent ou d'un autre type → 422.
 */
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

/** Lit le corps au plus `limit` octets ; au-delà, `onOverflow` est appelé sans lire la suite. */
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
      await reader.cancel();
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
