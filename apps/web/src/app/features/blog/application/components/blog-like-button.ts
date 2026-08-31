import { Component, inject, input, signal, computed, ChangeDetectionStrategy } from '@angular/core';
import { BlogGateway } from '../../domain/gateways/blog.gateway';
import { AppIcon } from '@shared/icons/app-icon';

const STORAGE_KEY = 'blog-liked-posts';

function likedSlugs(): string[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]') as string[];
  } catch {
    return [];
  }
}

@Component({
  selector: 'app-blog-like-button',
  imports: [AppIcon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'inline-flex' },
  template: `
    <button
      type="button"
      data-testid="blog-like-button"
      [disabled]="liked()"
      (click)="like()"
      class="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-foreground/10 hover:border-primary/40 disabled:opacity-70 disabled:cursor-default transition-colors"
    >
      <app-icon name="lucide-heart" [size]="18" />
      <span>{{ liked() ? 'Merci !' : "J'ai trouvé ça utile" }} ({{ count() }})</span>
    </button>
  `,
})
export class BlogLikeButton {
  private readonly _gateway = inject(BlogGateway);

  readonly slug = input.required<string>();
  readonly likesCount = input.required<number>();

  private readonly _liked = signal(false);
  private readonly _count = signal<number | null>(null);

  protected readonly liked = computed(() => this._liked() || likedSlugs().includes(this.slug()));
  protected readonly count = computed(() => this._count() ?? this.likesCount());

  protected like(): void {
    if (this.liked()) return;
    this._gateway.likePost(this.slug()).subscribe((res) => {
      this._count.set(res.likesCount);
      this._liked.set(true);
      const slugs = likedSlugs();
      slugs.push(this.slug());
      localStorage.setItem(STORAGE_KEY, JSON.stringify(slugs));
    });
  }
}
