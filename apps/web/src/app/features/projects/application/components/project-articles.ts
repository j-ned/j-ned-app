import { Component, input, output } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import type { BlogPost } from '@features/blog/domain/models/blog-post.model';
import { LinkCard } from '@shared/ui/link-card';
import { SplitSection } from '@shared/ui/split-section';
import { PROJECT_ARTICLES_COPY } from '../project-articles-copy';

@Component({
  selector: 'app-project-articles',
  imports: [DatePipe, RouterLink, LinkCard, SplitSection],
  host: { class: 'block border-t border-foreground/8', 'data-testid': 'project-articles' },
  template: `
    <app-split-section
      headingId="project-articles-title"
      [heading]="copy.heading"
      [summary]="copy.summary"
    >
      <ul role="list" class="grid gap-3 sm:grid-cols-2">
        @for (post of posts(); track post.id) {
          <li class="grid">
            <a
              app-link-card
              data-testid="project-article"
              [routerLink]="['/blog', post.slug]"
              [overline]="(post.publishedAt | date: 'd MMM y') ?? ''"
              [heading]="post.title"
              (click)="articleFollowed.emit()"
            ></a>
          </li>
        }
      </ul>
    </app-split-section>
  `,
})
export class ProjectArticles {
  readonly posts = input.required<readonly BlogPost[]>();
  readonly articleFollowed = output();

  protected readonly copy = PROJECT_ARTICLES_COPY;
}
