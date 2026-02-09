import {
  Component,
  inject,
  signal,
  viewChild,
  ElementRef,
  ChangeDetectionStrategy,
} from '@angular/core';
import { HOME_GATEWAY } from '../domain';
import type { Comment } from '../../blog/domain';

@Component({
  selector: 'app-home-testimonials',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  template: `
    @if (comments().length > 0) {
      <section class="py-24 px-4 sm:px-6 lg:px-8 bg-white/5 max-w-7xl mx-auto">
        <h2 class="text-3xl sm:text-4xl font-bold text-center text-foreground mb-4">Témoignages</h2>
        <p class="text-center text-muted mb-12 max-w-2xl mx-auto">Ce qu'ils en disent</p>

        <div class="relative">
          <button
            (click)="scrollLeft()"
            class="absolute -left-4 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-background border border-foreground/10 shadow-lg flex items-center justify-center text-foreground hover:bg-foreground/5 transition-colors hidden md:flex"
            aria-label="Précédent"
          >
            <svg class="w-5 h-5" aria-hidden="true">
              <use href="/icons/sprite.svg#lucide-chevron-left" />
            </svg>
          </button>

          <button
            (click)="scrollRight()"
            class="absolute -right-4 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-background border border-foreground/10 shadow-lg flex items-center justify-center text-foreground hover:bg-foreground/5 transition-colors hidden md:flex"
            aria-label="Suivant"
          >
            <svg class="w-5 h-5" aria-hidden="true">
              <use href="/icons/sprite.svg#lucide-chevron-right" />
            </svg>
          </button>

          <ul
            #carousel
            class="flex gap-6 overflow-x-auto scroll-smooth snap-x snap-mandatory pb-4 -mx-2 px-2"
            role="list"
            style="scrollbar-width: none"
          >
            @for (comment of comments(); track comment.id) {
              <li
                class="snap-center shrink-0 w-75 sm:w-87.5 max-w-100 bg-background border border-foreground/10 rounded-2xl p-6 shadow-lg"
              >
                <div class="flex items-center gap-3 mb-4">
                  <span
                    class="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-sm"
                    aria-hidden="true"
                  >
                    {{ comment.author.charAt(0).toUpperCase() }}
                  </span>
                  <div>
                    <cite class="text-sm font-semibold text-foreground not-italic">{{
                      comment.author
                    }}</cite>
                    <p class="text-xs text-muted">{{ comment.date }}</p>
                  </div>
                </div>

                @if (comment.rating > 0) {
                  <div class="flex gap-0.5 mb-3">
                    @for (star of [1, 2, 3, 4, 5]; track star) {
                      <svg class="w-4 h-4" aria-hidden="true">
                        <use
                          href="/icons/sprite.svg#lucide-star"
                          [class]="star <= comment.rating ? 'text-yellow-400' : 'text-muted'"
                        />
                      </svg>
                    }
                  </div>
                }

                <blockquote class="text-sm text-muted leading-relaxed line-clamp-4">
                  {{ comment.content }}
                </blockquote>
              </li>
            }
          </ul>
        </div>
      </section>
    }
  `,
})
export class HomeTestimonials {
  private readonly homeGateway = inject(HOME_GATEWAY);

  readonly comments = signal<readonly Comment[]>([]);
  readonly carousel = viewChild<ElementRef<HTMLUListElement>>('carousel');

  constructor() {
    this.homeGateway.getFeaturedComments().subscribe((comments) => this.comments.set(comments));
  }

  scrollLeft(): void {
    const el = this.carousel()?.nativeElement;
    if (el) el.scrollBy({ left: -360, behavior: 'smooth' });
  }

  scrollRight(): void {
    const el = this.carousel()?.nativeElement;
    if (el) el.scrollBy({ left: 360, behavior: 'smooth' });
  }
}
