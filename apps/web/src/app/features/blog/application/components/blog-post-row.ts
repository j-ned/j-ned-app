import { Component, input, computed } from '@angular/core';
import { NgOptimizedImage, DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import type { BlogPost } from '../../domain/models/blog-post.model';
import { readingTimeMinutes } from '../../domain/reading-time';
import { AppTag } from '@shared/ui/tag';
import { BlogTagLink } from './blog-tag-link';

const MAX_VISIBLE_TAGS = 3;

// Ligne de sommaire : date et durée en mono, titre (lien étiré sur toute la ligne), extrait,
// tags au-dessus du lien étiré, couverture décorative (le titre la nomme déjà).
@Component({
  selector: 'app-blog-post-row',
  imports: [NgOptimizedImage, RouterLink, AppTag, DatePipe, BlogTagLink],
  host: { class: 'block animate-fade-up' },
  template: `
    @let p = post();
    <article
      class="group relative grid gap-5 border-b border-foreground/8 py-9 lg:grid-cols-[10rem_minmax(0,1fr)_17rem] lg:items-start lg:gap-x-12"
    >
      <p
        class="flex flex-wrap gap-x-2.5 font-mono text-[0.8125rem] leading-relaxed text-muted lg:flex-col lg:gap-0.5 lg:pt-1.5"
      >
        @if (p.publishedAt; as date) {
          <time [attr.datetime]="date">{{ date | date: 'd MMM y' }}</time>
        }
        <span data-testid="reading-time">{{ readingTime() }} min de lecture</span>
      </p>

      <div>
        <h2
          class="text-[clamp(1.375rem,2.3vw,1.875rem)] font-bold leading-[1.18] tracking-tight text-balance"
        >
          <a
            [routerLink]="['/blog', p.slug]"
            class="transition-colors after:absolute after:inset-0 group-hover:text-primary"
            data-testid="post-link"
            >{{ p.title }}</a
          >
        </h2>
        <p class="mt-3 max-w-[62ch] text-muted">{{ p.excerpt }}</p>
        <div class="relative z-10 mt-4 flex flex-wrap gap-1.5">
          @for (tag of visibleTags(); track tag) {
            <app-blog-tag-link [tag]="tag" />
          }
          @if (hiddenTagsCount() > 0) {
            <a
              data-testid="more-tags"
              [routerLink]="['/blog', p.slug]"
              class="inline-flex rounded-md"
              [attr.aria-label]="'Voir les ' + hiddenTagsCount() + ' autres tags dans l’article'"
            >
              <app-tag [value]="'+' + hiddenTagsCount()" severity="secondary" />
            </a>
          }
        </div>
      </div>

      @if (p.coverImage) {
        <figure
          class="relative -order-1 aspect-[1200/630] w-full overflow-hidden rounded-[10px] border border-foreground/8 lg:order-none"
        >
          <img
            [ngSrc]="p.coverImage"
            alt=""
            [priority]="priority()"
            fill
            sizes="(max-width: 1024px) 100vw, 17rem"
            class="object-cover transition-transform duration-700 group-hover:scale-[1.03] motion-reduce:transition-none"
          />
        </figure>
      }
    </article>
  `,
})
export class BlogPostRow {
  readonly post = input.required<BlogPost>();
  /** Vrai pour la première ligne de la liste : sa couverture est le LCP de la page. */
  readonly priority = input(false);

  protected readonly readingTime = computed(() => readingTimeMinutes(this.post().contentMarkdown));

  /** Au-delà de 3 tags, un compteur "+N" renvoie vers l'article, qui les affiche tous. */
  protected readonly visibleTags = computed(() => this.post().tags.slice(0, MAX_VISIBLE_TAGS));
  protected readonly hiddenTagsCount = computed(() =>
    Math.max(0, this.post().tags.length - MAX_VISIBLE_TAGS),
  );
}
