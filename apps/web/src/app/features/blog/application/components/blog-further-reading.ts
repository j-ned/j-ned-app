import { Component, input, output } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { LinkCard } from '@shared/ui/link-card';
import type { BlogPost } from '../../domain/models/blog-post.model';
import type { ProjectTag } from '../../domain/models/project-tag.model';
import { FURTHER_READING_COPY } from '../further-reading-copy';

@Component({
  selector: 'app-blog-further-reading',
  imports: [DatePipe, RouterLink, LinkCard],
  host: { class: 'block pb-10' },
  template: `
    <section data-testid="further-reading" aria-labelledby="further-reading-title">
      <h2 id="further-reading-title" class="mb-4 text-2xl font-bold tracking-tight">
        {{ copy.heading }}
      </h2>
      <ul role="list" class="grid gap-3 sm:grid-cols-2">
        @for (project of projects(); track project.projectSlug) {
          <li class="grid">
            <a
              app-link-card
              data-testid="project-link"
              [routerLink]="['/projects', project.projectSlug]"
              [overline]="copy.projectOverline"
              [heading]="project.tag"
              (click)="projectFollowed.emit()"
            ></a>
          </li>
        }
        @for (post of posts(); track post.id) {
          <li class="grid">
            <a
              app-link-card
              data-testid="related-post"
              [routerLink]="['/blog', post.slug]"
              [overline]="(post.publishedAt | date: 'd MMM y') ?? ''"
              [heading]="post.title"
              (click)="postFollowed.emit()"
            ></a>
          </li>
        }
      </ul>
    </section>
  `,
})
export class BlogFurtherReading {
  readonly projects = input.required<readonly ProjectTag[]>();
  readonly posts = input.required<readonly BlogPost[]>();
  readonly projectFollowed = output();
  readonly postFollowed = output();

  protected readonly copy = FURTHER_READING_COPY;
}
