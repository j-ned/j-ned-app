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
import { finalize } from 'rxjs';
import { BlogGateway } from '../../domain/gateways/blog.gateway';
import { AppIcon } from '@shared/icons/app-icon';
import {
  injectStorageHost,
  readStored,
  writeStored,
  type StorageHost,
} from '@core/storage/browser-storage';

const STORAGE_KEY = 'blog-liked-posts';
const LIKED_LABEL = 'Merci\u202f!';
const UNLIKED_LABEL = "J'ai trouvé ça utile";

const isSlugList = (value: unknown): value is readonly string[] =>
  Array.isArray(value) && value.every((item) => typeof item === 'string');

function likedSlugs(host: StorageHost): readonly string[] {
  try {
    const stored: unknown = JSON.parse(readStored(host, 'localStorage', STORAGE_KEY) ?? '[]');
    return isSlugList(stored) ? stored : [];
  } catch {
    return [];
  }
}

// Stockage indisponible (navigation privée, quota) : le like est compté, seule sa mémoire locale manque.
function rememberLiked(host: StorageHost, slug: string): void {
  writeStored(host, 'localStorage', STORAGE_KEY, JSON.stringify([...likedSlugs(host), slug]));
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
  private readonly _storage = injectStorageHost();

  readonly slug = input.required<string>();
  readonly likesCount = input.required<number>();

  protected readonly liked = linkedSignal(() => likedSlugs(this._storage).includes(this.slug()));
  protected readonly count = linkedSignal(() => this.likesCount());
  protected readonly label = computed(() => (this.liked() ? LIKED_LABEL : UNLIKED_LABEL));

  private _pending = false;

  protected like(): void {
    if (this.liked() || this._pending) return;
    this._pending = true;
    const slug = this.slug();
    this._gateway
      .likePost(slug)
      .pipe(
        finalize(() => (this._pending = false)),
        takeUntilDestroyed(this._destroyRef),
      )
      .subscribe({
        next: (res) => {
          this.count.set(res.likesCount);
          this.liked.set(true);
          rememberLiked(this._storage, slug);
        },
        error: () => {
          // No UI state change on failure; the button stays enabled so the user can retry.
        },
      });
  }
}
