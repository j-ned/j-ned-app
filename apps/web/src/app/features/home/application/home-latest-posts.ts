import { Component, computed, input } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { toBlogPostRowView } from '@features/blog/application/blog-list-view';
import type { BlogPost } from '@features/blog/domain/models/blog-post.model';
import { AppIcon } from '@shared/icons/app-icon';
import { Button } from '@shared/ui/button';

const LATEST_POSTS_SECTION = {
  title: "Ce que j'écris",
  description:
    'Des problèmes réels rencontrés en construisant ce site et mes projets, avec le code et les compromis.',
  allLink: 'Tous les articles',
} as const;

@Component({
  selector: 'app-home-latest-posts',
  imports: [DatePipe, RouterLink, AppIcon, Button],
  host: { class: 'block animate-fade-up' },
  template: `
    <section aria-labelledby="latest-posts-heading" data-testid="home-latest-posts">
      <header class="grid gap-4 mb-10 lg:grid-cols-2 lg:items-end lg:gap-12">
        <h2 id="latest-posts-heading" class="section-title">{{ copy.title }}</h2>
        <p class="max-w-[52ch] text-muted">{{ copy.description }}</p>
      </header>

      <ul class="grid border-t border-line" role="list">
        @for (post of rows(); track post.slug) {
          <li>
            <article
              data-testid="home-latest-post"
              class="group relative grid gap-2 border-b border-line py-7"
            >
              <p class="font-mono text-xs text-muted">
                @if (post.publishedAt; as date) {
                  <time [attr.datetime]="date">{{ date | date: 'd MMM y' }}</time> ·
                }
                {{ post.readingTime }}
              </p>
              <h3
                class="text-xl font-bold leading-snug tracking-tight text-balance transition-colors group-hover:text-primary"
              >
                <a
                  data-testid="home-latest-post-link"
                  class="after:absolute after:inset-0"
                  [routerLink]="['/blog', post.slug]"
                  >{{ post.title }}</a
                >
              </h3>
              <p class="max-w-[68ch] text-muted">{{ post.excerpt }}</p>
            </article>
          </li>
        }
      </ul>

      <nav class="mt-10" aria-label="Voir tous les articles">
        <a appButton routerLink="/blog" data-testid="home-latest-posts-all">
          {{ copy.allLink }}
          <app-icon name="arrow-right" [size]="20" />
        </a>
      </nav>
    </section>
  `,
})
export class HomeLatestPosts {
  readonly posts = input<readonly BlogPost[]>([]);

  protected readonly rows = computed(() =>
    this.posts().map((post) => toBlogPostRowView(post, false)),
  );
  protected readonly copy = LATEST_POSTS_SECTION;
}
