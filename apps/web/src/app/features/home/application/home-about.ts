import { Component, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { ButtonComponent } from '../../../layout/components/button/button';

@Component({
  selector: 'app-home-about',
  imports: [ButtonComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  template: `
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
  `,
})
export class HomeAbout {
  private readonly router = inject(Router);

  protected readonly aboutSection = signal({
    title: 'À propos',
    paragraphs: [
      "Développeur full-stack passionné par la création d'applications web modernes et performantes. Je me spécialise dans l'écosystème Angular et NestJS, avec un focus particulier sur l'architecture logicielle et les bonnes pratiques.",
      'Mon approche combine rigueur technique et pragmatisme : du code maintenable, des patterns éprouvés, et une infrastructure maîtrisée de bout en bout. De la conception à la mise en production.',
    ],
  });

  goToAbout(): void {
    this.router.navigate(['/about']);
  }
}
