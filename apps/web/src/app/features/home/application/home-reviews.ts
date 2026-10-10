import { Component, input } from '@angular/core';
import { REVIEW_INVITATION_COPY } from '@shared/identity/review-invitation.static-data';
import { SITE_IDENTITY } from '@shared/identity/site-identity.static-data';
import { HOME_REVIEWS_COPY } from '../domain/home-reviews.static-data';
import type { Review } from '../domain/models/review.model';

@Component({
  selector: 'app-home-reviews',
  host: { class: 'block' },
  template: `
    <section
      class="page-container py-26 md:py-34"
      aria-labelledby="home-reviews-heading"
      data-testid="home-reviews"
    >
      <h2
        id="home-reviews-heading"
        class="text-[clamp(1.75rem,3.4vw,2.75rem)] font-bold leading-[1.1] tracking-[-0.025em]"
      >
        {{ copy.heading }}
      </h2>
      <ul class="mt-10 grid gap-8 md:grid-cols-2" role="list">
        @for (review of reviews(); track review.id) {
          <li data-testid="home-review">
            <figure class="grid gap-4 border-l-2 border-primary/40 pl-5">
              <blockquote
                class="text-[clamp(1.0625rem,1.4vw,1.25rem)] leading-relaxed text-pretty"
                data-testid="home-review-quote"
              >
                {{ review.quote }}
              </blockquote>
              <figcaption class="grid gap-0.5 text-sm">
                <span class="font-semibold" data-testid="home-review-author">{{
                  review.authorName
                }}</span>
                <span
                  class="font-mono text-[0.8125rem] text-muted"
                  data-testid="home-review-context"
                  >{{ review.authorContext }}</span
                >
              </figcaption>
            </figure>
          </li>
        }
      </ul>
      <a
        [href]="googleReviewUrl"
        target="_blank"
        rel="noopener noreferrer"
        class="mt-10 inline-flex min-h-11 items-center font-mono text-[0.8125rem] text-muted underline decoration-foreground/25 underline-offset-4 transition-colors hover:text-primary"
        data-testid="home-reviews-google"
        >{{ invitation.link }}<span class="sr-only"> {{ invitation.newTab }}</span></a
      >
    </section>
  `,
})
export class HomeReviews {
  readonly reviews = input.required<readonly Review[]>();

  protected readonly copy = HOME_REVIEWS_COPY;
  protected readonly invitation = REVIEW_INVITATION_COPY;
  protected readonly googleReviewUrl = SITE_IDENTITY.googleReviewUrl;
}
