import { Component, input, ChangeDetectionStrategy } from '@angular/core';
import { NgOptimizedImage } from '@angular/common';
import { RouterLink } from '@angular/router';
import type { BlogPost } from '../../domain/models/blog-post.model';
import { AppTag } from '@shared/ui/tag';

@Component({
  selector: 'app-blog-post-card',
  imports: [NgOptimizedImage, RouterLink, AppTag],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block h-full animate-fade-up' },
  template: `
    <article
      class="group relative bg-surface border border-foreground/8 rounded-xl overflow-hidden hover:border-primary/30 hover:bg-surface-elevated transition-colors duration-200 flex flex-col h-full"
    >
      <a [routerLink]="['/blog', post().slug]" class="block aspect-[16/9] md:aspect-[2/1] w-full overflow-hidden relative">
        @if (post().coverImage) {
          <img
            [ngSrc]="post().coverImage"
            [alt]="post().title"
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
        <div class="flex flex-wrap gap-1.5 mb-2">
          @for (tag of post().tags; track tag) {
            <app-tag [value]="tag" severity="info" />
          }
        </div>

        <h2 class="text-xl md:text-2xl font-bold mb-2 text-foreground">
          <a [routerLink]="['/blog', post().slug]">{{ post().title }}</a>
        </h2>

        <p class="text-muted text-sm grow">{{ post().excerpt }}</p>
      </div>
    </article>
  `,
})
export class BlogPostCard {
  readonly post = input.required<BlogPost>();
}
