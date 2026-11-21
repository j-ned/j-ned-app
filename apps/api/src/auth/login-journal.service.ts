import { desc, lt, sql } from 'drizzle-orm';
import { Logger } from '../common/logger';
import type { PaginatedResult, PaginationParams } from '../common/pagination';
import { describeUserAgent } from '../common/user-agent';
import { subDays } from '../common/utils';
import type { Database } from '../database/drizzle.types';
import {
  loginEvent,
  type LoginEvent,
  type LoginEventKind,
} from '../database/schema';

/** Ce que la requête dit de sa provenance ; l'adresse IP n'en fait pas partie. */
export type LoginOrigin = {
  readonly userAgent: string;
  /** Code ISO à 2 lettres écrit par le proxy du site, `null` s'il est inconnu. */
  readonly country: string | null;
};

const RETENTION_DAYS = 90;

/** Instant avant lequel une ligne du journal est purgée. */
export function loginEventCutoff(now: Date): Date {
  return subDays(now, RETENTION_DAYS);
}

export class LoginJournalService {
  private readonly logger = new Logger(LoginJournalService.name);

  constructor(private readonly db: Database) {}

  /**
   * Ne lève jamais : un journal indisponible ne doit ni bloquer la connexion de l'admin ni changer
   * la réponse faite à une tentative refusée. L'échec d'écriture est journalisé en erreur.
   */
  async record(
    kind: LoginEventKind,
    userId: string | null,
    origin: LoginOrigin,
  ): Promise<void> {
    try {
      await this.db.insert(loginEvent).values({
        kind,
        userId,
        ...describeUserAgent(origin.userAgent),
        country: origin.country,
      });
    } catch (error) {
      this.logger.error(
        `login journal write failed (${kind}): ${error instanceof Error ? error.message : String(error)}`,
        error instanceof Error ? error.stack : undefined,
      );
    }
  }

  /** Paginé, du plus récent au plus ancien. */
  async findAll(
    params: PaginationParams,
  ): Promise<PaginatedResult<LoginEvent>> {
    const [totalRow, data] = await Promise.all([
      this.db.select({ count: sql<number>`count(*)::int` }).from(loginEvent),
      this.db
        .select()
        .from(loginEvent)
        .orderBy(desc(loginEvent.createdAt))
        .limit(params.limit)
        .offset(params.offset),
    ]);
    return {
      data,
      total: totalRow[0]?.count ?? 0,
      page: params.page,
      limit: params.limit,
    };
  }

  async purgeExpired(now: Date = new Date()): Promise<void> {
    await this.db
      .delete(loginEvent)
      .where(lt(loginEvent.createdAt, loginEventCutoff(now)));
  }
}
