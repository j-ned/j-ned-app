import { Component, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { ButtonComponent } from '../../shared/components/button/button';
import { ABOUT_SECTION } from './data/home.data';

@Component({
  selector: 'app-home-about',
  imports: [ButtonComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div>
      <h2 class="text-3xl md:text-4xl font-bold mb-6">
        {{ aboutSection().title }}
      </h2>
      <div class="space-y-4 text-muted leading-relaxed">
        @for (paragraph of aboutSection().paragraphs; track $index) {
          <p>{{ paragraph }}</p>
        }
      </div>
      <div class="mt-8">
        <app-button variant="primary" size="md" radius="md" (clicked)="goToAbout()">
          En savoir plus
          <svg class="w-5 h-5">
            <use href="/icons/sprite.svg#think"></use>
          </svg>
        </app-button>
      </div>
    </div>
  `,
})
export class HomeAbout {
  protected readonly aboutSection = signal(ABOUT_SECTION);
  private readonly router = inject(Router);

  goToAbout() {
    this.router.navigate(['/about']);
  }
}
