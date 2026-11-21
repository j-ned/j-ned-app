import {
  ConflictException,
  NotFoundException,
  ServiceUnavailableException,
  TooManyRequestsException,
} from '../common/http-errors';
import { Logger } from '../common/logger';
import type { PaginatedResult, PaginationParams } from '../common/pagination';
import type { BlogComment, CommentStatus } from '../database/schema';
import { fireAndForget, subDays } from '../common/utils';
import {
  COMMENT_NOTIFICATION_TEMPLATE,
  OWNER_EMAIL,
} from '../mailer/mailer.constants';
import type { MailSender } from '../mailer/mail-transport';
import { toAdminComment, type AdminComment } from './admin-comment';
import {
  PENDING_PER_SENDER,
  PENDING_TOTAL,
  REFUSED_RETENTION_DAYS,
} from './comment-limits';
import { toCommentRecord, type CommentRecord } from './comment-record';
import type { CommentStore, PostRef } from './comment-store';
import type { CreateCommentDto } from './dto/create-comment.dto';
import { toPublicCommentPage, type PublicCommentPage } from './public-comment';

export type CommentSender = { readonly ip: string };

const POST_NOT_FOUND = 'Article introuvable.';
const COMMENT_NOT_FOUND = 'Commentaire introuvable.';
const REPLY_TO_REPLY = 'Tu ne peux pas répondre à une réponse.';
const TOO_MANY_PENDING =
  'Tu as déjà plusieurs commentaires en attente de relecture. Réessaie plus tard.';
const QUEUE_CLOSED =
  'Les commentaires sont momentanément fermés. Réessaie plus tard.';

const REPLY_BEFORE_PUBLISHING =
  'Publie d’abord ce commentaire avant d’y répondre.';
const TRANSITION_REFUSED = 'Ce commentaire ne peut pas passer à ce statut.';
const PARENT_NOT_PUBLISHED =
  'Publie d’abord le commentaire auquel cette réponse est rattachée.';

// Statuts depuis lesquels chaque décision est permise ; un refus est définitif.
const TRANSITIONS_TO: Record<
  'published' | 'refused',
  readonly CommentStatus[]
> = {
  published: ['pending'],
  refused: ['pending', 'published'],
};

export class BlogCommentsService {
  private readonly logger = new Logger(BlogCommentsService.name);

  constructor(
    private readonly store: CommentStore,
    private readonly mailer: MailSender,
    private readonly hashSender: (ip: string) => string,
    private readonly now: () => Date = () => new Date(),
  ) {}

  // Ne renvoie rien : un robot ne distingue pas un commentaire enregistré d'un commentaire écarté.
  async submit(
    slug: string,
    dto: CreateCommentDto,
    sender: CommentSender,
  ): Promise<void> {
    if (dto.website) {
      this.logger.warn('Comment honeypot filled: comment dropped');
      return;
    }
    const post = await this.publishedPost(slug);
    const parent =
      dto.parentId === undefined
        ? null
        : await this.publishedParent(dto.parentId, post.id);

    const result = await this.store.insertPending(
      {
        postId: post.id,
        parentId: parent?.id ?? null,
        name: dto.name,
        email: dto.email,
        senderHash: this.hashSender(sender.ip),
        body: dto.body,
      },
      { perSender: PENDING_PER_SENDER, total: PENDING_TOTAL },
    );
    switch (result.kind) {
      case 'target-gone':
        throw new NotFoundException(
          parent === null ? POST_NOT_FOUND : COMMENT_NOT_FOUND,
        );
      case 'sender-cap':
        throw new TooManyRequestsException(undefined, TOO_MANY_PENDING);
      case 'total-cap':
        throw new ServiceUnavailableException(QUEUE_CLOSED);
      case 'inserted':
        // Mail au mieux : le commentaire est enregistré, un échec d'envoi le laisse dans la file.
        fireAndForget(
          this.notifyOwner(dto, post, parent),
          this.logger,
          `Failed to send comment notification for ${result.row.id}`,
        );
    }
  }

  // Commentaires publiés d'un article publié, chacun avec ses réponses publiées.
  async findPublished(
    slug: string,
    page: PaginationParams,
  ): Promise<PublicCommentPage> {
    const post = await this.publishedPost(slug);
    return toPublicCommentPage(
      await this.store.findPublishedThreads(post.id, page),
      page,
    );
  }

  // Tous les commentaires, du plus récent au plus ancien, e-mail compris : réservé à l'admin.
  async findAllForAdmin(
    status: CommentStatus | undefined,
    page: PaginationParams,
  ): Promise<PaginatedResult<AdminComment>> {
    const { rows, total } = await this.store.findAdminPage(status, page);
    return {
      data: rows.map(toAdminComment),
      total,
      page: page.page,
      limit: page.limit,
    };
  }

  async pendingCount(): Promise<{ count: number }> {
    return { count: await this.store.countPending() };
  }

  async moderate(
    id: string,
    status: 'published' | 'refused',
  ): Promise<AdminComment> {
    const current = await this.existing(id);
    const from = TRANSITIONS_TO[status];
    if (!from.includes(current.status)) {
      throw new ConflictException(TRANSITION_REFUSED);
    }
    if (status === 'published' && current.parentId !== null) {
      const parent = await this.store.findById(current.parentId);
      if (parent?.status !== 'published') {
        throw new ConflictException(PARENT_NOT_PUBLISHED);
      }
    }
    if (!(await this.store.moderate(id, from, status, this.now()))) {
      // Rien d'écrit : la ligne a disparu (404) ou une autre requête l'a déjà modérée (409).
      await this.existing(id);
      throw new ConflictException(TRANSITION_REFUSED);
    }
    return this.adminComment(id);
  }

  // Les réponses partent avec leur commentaire (cascade de la base).
  async remove(id: string): Promise<void> {
    if (!(await this.store.remove(id))) {
      throw new NotFoundException(COMMENT_NOT_FOUND);
    }
  }

  // Réponse du propriétaire : publiée d'emblée, sans nom ni e-mail, sans notification.
  async reply(id: string, body: string): Promise<AdminComment> {
    const parent = await this.existing(id);
    if (parent.parentId !== null) throw new ConflictException(REPLY_TO_REPLY);
    if (parent.status !== 'published') {
      throw new ConflictException(REPLY_BEFORE_PUBLISHING);
    }
    const row = await this.store.insertOwnerReply({
      postId: parent.postId,
      parentId: parent.id,
      body,
      publishedAt: this.now(),
    });
    if (row === undefined) throw new NotFoundException(COMMENT_NOT_FOUND);
    return this.adminComment(row.id);
  }

  // Un refus garde sa ligne 30 jours (reconnaître un expéditeur insistant), puis disparaît.
  async purgeExpired(): Promise<void> {
    await this.store.purgeRefusedBefore(
      subDays(this.now(), REFUSED_RETENTION_DAYS),
    );
  }

  private async existing(id: string): Promise<BlogComment> {
    const row = await this.store.findById(id);
    if (row === undefined) throw new NotFoundException(COMMENT_NOT_FOUND);
    return row;
  }

  private async adminComment(id: string): Promise<AdminComment> {
    const row = await this.store.findAdminById(id);
    if (row === undefined) throw new NotFoundException(COMMENT_NOT_FOUND);
    return toAdminComment(row);
  }

  private async publishedPost(slug: string): Promise<PostRef> {
    const post = await this.store.findPublishedPost(slug);
    if (post === undefined) throw new NotFoundException(POST_NOT_FOUND);
    return post;
  }

  // Un commentaire en attente ou refusé répond comme un commentaire inconnu : son existence ne fuit pas.
  private async publishedParent(
    parentId: string,
    postId: string,
  ): Promise<CommentRecord> {
    const row = await this.store.findById(parentId);
    if (
      row === undefined ||
      row.postId !== postId ||
      row.status !== 'published'
    ) {
      throw new NotFoundException(COMMENT_NOT_FOUND);
    }
    if (row.parentId !== null) throw new ConflictException(REPLY_TO_REPLY);
    return toCommentRecord(row);
  }

  // Seul le propriétaire est notifié : aucun mail ne part vers une adresse saisie par un inconnu.
  private async notifyOwner(
    dto: CreateCommentDto,
    post: PostRef,
    parent: CommentRecord | null,
  ): Promise<void> {
    await this.mailer.sendMail({
      to: OWNER_EMAIL,
      subject: `Commentaire en attente : ${post.title}`,
      replyTo: dto.email,
      template: {
        id: COMMENT_NOTIFICATION_TEMPLATE,
        variables: {
          NAME: dto.name,
          SENDER_EMAIL: dto.email,
          POST_TITLE: post.title,
          POST_SLUG: post.slug,
          PARENT_NAME: parentName(parent),
          MESSAGE: dto.body,
          YEAR: String(this.now().getUTCFullYear()),
        },
      },
    });
  }
}

function parentName(parent: CommentRecord | null): string {
  if (parent === null) return '';
  return parent.author.kind === 'owner' ? 'l’auteur' : parent.author.name;
}
