import { Component } from '@angular/core';
import { AppIcon } from '@shared/icons/app-icon';
import { HOME_METHOD } from '../domain/home-pitch.static-data';

@Component({
  selector: 'app-home-method',
  imports: [AppIcon],
  host: { class: 'block' },
  template: `
    <section
      class="page-container py-24 md:py-32"
      aria-labelledby="home-method-heading"
      data-testid="home-method"
    >
      <header class="mb-12 grid gap-4 lg:grid-cols-2 lg:items-end lg:gap-12">
        <h2 id="home-method-heading" class="section-title">{{ method.heading }}</h2>
        <p class="max-w-[52ch] text-muted" data-testid="home-method-lead">{{ method.lead }}</p>
      </header>
      <ol class="grid gap-y-10 sm:grid-cols-2 lg:grid-cols-4" role="list">
        @for (step of method.steps; track step.id; let index = $index) {
          <li class="grid content-start gap-2.5 pr-6" data-testid="home-method-step">
            <span
              class="mb-1.5 border-b-[1.5px] border-line-strong pb-3.5 font-mono text-xs text-primary tabular-nums"
              aria-hidden="true"
              >{{ sequence[index] }}</span
            >
            <span class="font-mono text-xs text-muted" data-testid="home-method-step-when">{{
              step.when
            }}</span>
            <h3
              class="text-xl font-bold leading-tight tracking-tight"
              data-testid="home-method-step-verb"
            >
              {{ step.verb }}
            </h3>
            <p class="text-[0.9375rem] text-muted" data-testid="home-method-step-detail">
              {{ step.detail }}
            </p>
          </li>
        }
      </ol>
      <ul
        class="mt-16 grid rounded-md bg-primary/8 px-6 py-4 sm:grid-cols-2 sm:gap-x-8 sm:px-10 sm:py-6"
        role="list"
      >
        @for (commitment of method.commitments; track commitment) {
          <li class="flex gap-3 py-2.5 text-[0.9375rem]" data-testid="home-method-commitment">
            <app-icon name="check" [size]="18" class="mt-0.5 text-primary" />{{ commitment }}
          </li>
        }
      </ul>
    </section>
  `,
})
export class HomeMethod {
  protected readonly method = HOME_METHOD;
  protected readonly sequence = HOME_METHOD.steps.map((_, index) =>
    String(index + 1).padStart(2, '0'),
  );
}
