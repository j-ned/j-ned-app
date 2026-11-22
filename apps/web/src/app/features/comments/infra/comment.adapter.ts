import type { AdminComment, AdminCommentPage } from '../domain/models/comment.model';
import type { AdminCommentDto, AdminCommentPageDto } from './comment.types';

// Liste de champs fermée : l'écran ne reçoit que ce qu'il affiche.
function toAdminComment(dto: AdminCommentDto): AdminComment {
  return {
    id: dto.id,
    post: { id: dto.post.id, slug: dto.post.slug, title: dto.post.title },
    parent: dto.parent && {
      id: dto.parent.id,
      author:
        dto.parent.author.kind === 'owner'
          ? { kind: 'owner' }
          : { kind: 'visitor', name: dto.parent.author.name },
      excerpt: dto.parent.excerpt,
    },
    author:
      dto.author.kind === 'owner'
        ? { kind: 'owner' }
        : { kind: 'visitor', name: dto.author.name, email: dto.author.email },
    body: dto.body,
    status: dto.status,
    createdAt: dto.createdAt,
    replyCount: dto.replyCount,
  };
}

export function toAdminCommentPage(dto: AdminCommentPageDto): AdminCommentPage {
  return { comments: dto.data.map(toAdminComment), total: dto.total };
}
