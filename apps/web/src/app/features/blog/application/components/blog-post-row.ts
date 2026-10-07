import { Component, input } from '@angular/core';
import { NgOptimizedImage, DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AppIcon } from '@shared/icons/app-icon';
import { FactList } from '@shared/ui/fact-list';
import type { BlogPostRowView } from '../blog-list-view';

@Component({
  selector: 'app-blog-post-row',
  imports: [NgOptimizedImage, RouterLink, DatePipe, AppIcon, FactList],
  host: { class: '@container block', '[class.animate-fade-up]': '!post().priority' },
  template: `
    @let p = post();
    <article
      data-testid="post-row"
      class="group relative grid gap-5 border-b border-line py-10 @min-[60rem]:grid-cols-[minmax(0,1fr)_20rem] @min-[60rem]:items-start @min-[60rem]:gap-12"
    >
      <div>
        <p data-testid="post-overline" class="font-mono text-xs text-muted">
          @if (p.publishedAt; as date) {
            <time [attr.datetime]="date">{{ date | date: 'd MMM y' }}</time> ·
          }
          <span data-testid="reading-time">{{ p.readingTime }}</span>
        </p>
        <h2
          data-testid="post-title"
          class="mt-3 text-[clamp(1.375rem,2.3vw,1.875rem)] font-bold leading-[1.18] tracking-tight text-balance transition-colors group-hover:text-primary"
        >
          {{ p.title }}
        </h2>
        <p data-testid="post-excerpt" class="mt-3 max-w-[62ch] text-muted">{{ p.excerpt }}</p>
        @if (p.facts.length) {
          <app-fact-list class="mt-5 max-w-[62ch]" [facts]="p.facts" />
        }
        <a
          data-testid="post-link"
          class="mt-1 inline-flex min-h-11 items-center gap-1.5 text-sm font-semibold text-primary after:absolute after:inset-0 hover:underline"
          [routerLink]="['/blog', p.slug]"
          >Lire l'article<span data-testid="post-link-context" class="sr-only">{{
            p.linkContext
          }}</span>
          <app-icon name="arrow-right" [size]="14" />
        </a>
      </div>

      @if (p.coverImage) {
        <figure
          data-testid="post-cover"
          class="pointer-events-none relative -order-1 aspect-[1200/630] w-full overflow-hidden rounded-md border border-line-strong bg-surface @min-[60rem]:order-none"
        >
          <img [ngSrc]="p.coverImage" alt="" fill [priority]="p.priority" class="object-cover" />
        </figure>
      }
    </article>
  `,
})
export class BlogPostRow {
  readonly post = input.required<BlogPostRowView>();
}
