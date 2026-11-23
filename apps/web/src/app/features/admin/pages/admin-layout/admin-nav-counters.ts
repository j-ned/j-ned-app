import { computed, inject, type Signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { BlogGateway } from '@features/blog/domain/gateways/blog.gateway';
import { CommentsGateway } from '@features/comments/infra/comments.gateway';
import { ContactGateway } from '@features/contact/domain/gateways/contact.gateway';
import { ProjectsGateway } from '@features/projects/domain/gateways/projects.gateway';
import { resourceValueOr } from '@shared/ui/load-state';
import type { AdminNavCounts } from '../../application/admin-nav-groups';
import { refreshAdminWhenVisible } from '../../application/refresh-admin-when-visible';

// Projets et articles : listes partagées avec leurs écrans, sans corps d'article.
export class AdminNavCounters {
  private readonly _projectsGateway = inject(ProjectsGateway);
  private readonly _blogGateway = inject(BlogGateway);
  private readonly _contactGateway = inject(ContactGateway);
  private readonly _commentsGateway = inject(CommentsGateway);

  private readonly _projects = rxResource({ stream: () => this._projectsGateway.getAllProjects() });
  private readonly _posts = rxResource({ stream: () => this._blogGateway.getAllPostsForAdmin() });
  private readonly _unread = rxResource({ stream: () => this._contactGateway.getUnreadCount() });
  private readonly _pendingComments = rxResource({
    stream: () => this._commentsGateway.getPendingCount(),
  });

  readonly counts: Signal<AdminNavCounts> = computed(() => ({
    projects: resourceValueOr(this._projects, null)?.length ?? null,
    posts: resourceValueOr(this._posts, null)?.length ?? null,
    unread: resourceValueOr(this._unread, null),
    pendingComments: resourceValueOr(this._pendingComments, null),
  }));

  constructor() {
    // Messages et commentaires arrivent des visiteurs : la navigation les recompte au retour.
    refreshAdminWhenVisible(() => {
      this._contactGateway.invalidateUnreadCount();
      this._commentsGateway.invalidatePendingCount();
    });
  }
}
