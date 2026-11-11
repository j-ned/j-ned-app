import {
  Component,
  computed,
  DestroyRef,
  inject,
  input,
  linkedSignal,
  ChangeDetectionStrategy,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { BlogGateway } from '../../domain/gateways/blog.gateway';
import { AppIcon } from '@shared/icons/app-icon';

const STORAGE_KEY = 'blog-liked-posts';
const LIKED_LABEL = 'Merci\u202f!';
const UNLIKED_LABEL = "J'ai trouvé ça utile";

function likedSlugs(): string[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]') as string[];
  } catch {
    return [];
  }
}

function rememberLiked(slug: string): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...likedSlugs(), slug]));
  } catch {
    // Stockage indisponible (navigation privée, quota) : le like est compté, seule sa mémoire locale manque.
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
      class="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-foreground/10 hover:border-primary/40 disabled:opacity-70 disabled:cursor-default transition-colors"
    >
      <app-icon name="lucide-heart" [size]="18" />
      <span>{{ label() }} ({{ count() }})</span>
    </button>
  `,
})
export class BlogLikeButton {
  private readonly _gateway = inject(BlogGateway);
  private readonly _destroyRef = inject(DestroyRef);

  readonly slug = input.required<string>();
  readonly likesCount = input.required<number>();

  protected readonly liked = linkedSignal(() => likedSlugs().includes(this.slug()));
  protected readonly count = linkedSignal(() => this.likesCount());
  protected readonly label = computed(() => (this.liked() ? LIKED_LABEL : UNLIKED_LABEL));

  protected like(): void {
    if (this.liked()) return;
    const slug = this.slug();
    this._gateway
      .likePost(slug)
      .pipe(takeUntilDestroyed(this._destroyRef))
      .subscribe({
        next: (res) => {
          this.count.set(res.likesCount);
          this.liked.set(true);
          rememberLiked(slug);
        },
        error: () => {
          // No UI state change on failure; the button stays enabled so the user can retry.
        },
      });
  }
}
