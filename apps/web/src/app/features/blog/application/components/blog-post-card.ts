import { Component, input, computed, ChangeDetectionStrategy } from '@angular/core';
import { NgOptimizedImage, DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import type { BlogPost } from '../../domain/models/blog-post.model';
import { AppTag } from '@shared/ui/tag';
import { BlogTagLink } from './blog-tag-link';

const MAX_VISIBLE_TAGS = 5;

@Component({
  selector: 'app-blog-post-card',
  imports: [NgOptimizedImage, RouterLink, AppTag, DatePipe, BlogTagLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block h-full animate-fade-up' },
  template: `
    <article
      class="group relative bg-surface border border-foreground/8 rounded-xl overflow-hidden hover:border-primary/30 hover:bg-surface-elevated transition-colors duration-200 flex flex-col h-full"
    >
      <a
        [routerLink]="['/blog', post().slug]"
        class="block aspect-[16/9] md:aspect-[2/1] w-full overflow-hidden relative"
      >
        @if (post().coverImage) {
          <img
            [ngSrc]="post().coverImage"
            [alt]="post().title"
            [priority]="priority()"
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
            class="object-cover"
          />
        } @else {
          <div class="w-full h-full flex items-center justify-center text-muted bg-primary/10">
            <span class="text-lg font-medium">Article</span>
          </div>
        }
      </a>

      <div class="p-5 flex flex-col grow">
        <div class="flex flex-wrap gap-1.5 mb-3">
          @for (tag of visibleTags(); track tag) {
            <app-blog-tag-link [tag]="tag" />
          }
          @if (hiddenTagsCount() > 0) {
            <a
              data-testid="more-tags"
              [routerLink]="['/blog', post().slug]"
              class="inline-flex rounded-md"
              [attr.aria-label]="'Voir les ' + hiddenTagsCount() + ' autres tags dans l’article'"
            >
              <app-tag [value]="'+' + hiddenTagsCount()" severity="secondary" />
            </a>
          }
        </div>

        <h2 class="text-xl md:text-2xl font-bold mb-2 text-foreground line-clamp-3">
          <a [routerLink]="['/blog', post().slug]">{{ post().title }}</a>
        </h2>

        @if (post().publishedAt) {
          <p class="text-muted text-xs mb-2">{{ post().publishedAt | date: 'd MMMM y' }}</p>
        }

        <p class="text-muted text-sm grow line-clamp-4">{{ post().excerpt }}</p>
      </div>
    </article>
  `,
})
export class BlogPostCard {
  readonly post = input.required<BlogPost>();
  /** Vrai pour la première carte de la liste : son visuel est le LCP de la page. */
  readonly priority = input(false);

  /** Limite la hauteur de la carte : au-delà de 5 tags, un compteur "+N" renvoie vers l'article. */
  readonly visibleTags = computed(() => this.post().tags.slice(0, MAX_VISIBLE_TAGS));
  readonly hiddenTagsCount = computed(() =>
    Math.max(0, this.post().tags.length - MAX_VISIBLE_TAGS),
  );
}
